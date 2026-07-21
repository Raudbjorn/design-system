use crossterm::event::{
    Event, KeyCode, KeyEvent, KeyModifiers, MouseButton, MouseEvent, MouseEventKind,
};
use ratatui::layout::Rect;
use raudbjorn_tui::browser::{BrowserControl, GalleryState};

fn key(code: KeyCode) -> Event {
    Event::Key(KeyEvent::new(code, KeyModifiers::NONE))
}

fn modified_key(code: KeyCode, modifiers: KeyModifiers) -> Event {
    Event::Key(KeyEvent::new(code, modifiers))
}

fn click(column: u16, row: u16) -> Event {
    modified_click(column, row, KeyModifiers::NONE)
}

fn modified_click(column: u16, row: u16, modifiers: KeyModifiers) -> Event {
    Event::Mouse(MouseEvent {
        kind: MouseEventKind::Down(MouseButton::Left),
        column,
        row,
        modifiers,
    })
}

#[test]
fn tab_round_trip_consumes_return_focus_target() {
    let mut state = GalleryState::with_story("text/default").unwrap();
    state.handle_event(&key(KeyCode::Tab));
    assert_eq!(state.return_focus_id(), Some("story-list"));

    state.handle_event(&key(KeyCode::Tab));
    assert_eq!(state.focus_id(), "story-list");
    assert_eq!(state.return_focus_id(), None);
}

#[test]
fn shift_tab_traverses_the_two_browser_focus_stops() {
    let mut state = GalleryState::with_story("text/default").unwrap();
    let shift_tab = modified_key(KeyCode::Tab, KeyModifiers::SHIFT);

    state.handle_event(&shift_tab);
    assert_eq!(state.focus_id(), "preview");

    state.handle_event(&shift_tab);
    assert_eq!(state.focus_id(), "story-list");
    assert_eq!(state.return_focus_id(), None);
}

#[test]
fn modal_blocks_background_shortcuts_and_traps_tab() {
    let mut state = GalleryState::with_story("modal/open").unwrap();
    assert_eq!(state.focus_id(), "story-list");
    assert_eq!(
        state.handle_event(&key(KeyCode::Tab)),
        BrowserControl::Continue
    );
    assert_eq!(state.focus_id(), "preview");
    assert!(state.context().get_bool("open"));

    let dark_before = state.is_dark();
    assert_eq!(
        state.handle_event(&key(KeyCode::Char('t'))),
        BrowserControl::Continue
    );
    assert_eq!(
        state.is_dark(),
        dark_before,
        "modal must block theme shortcut"
    );

    assert_eq!(
        state.handle_event(&key(KeyCode::Tab)),
        BrowserControl::Continue
    );
    assert_eq!(state.focus_id(), "preview", "Tab must remain trapped");
}

#[test]
fn modal_escape_closes_once_and_restores_focus() {
    let mut state = GalleryState::with_story("modal/open").unwrap();
    state.handle_event(&key(KeyCode::Tab));
    assert_eq!(state.return_focus_id(), Some("story-list"));

    assert_eq!(
        state.handle_event(&key(KeyCode::Esc)),
        BrowserControl::Continue
    );
    assert!(!state.context().get_bool("open"));
    assert_eq!(state.focus_id(), "story-list");
    assert_eq!(state.return_focus_id(), None);

    assert_eq!(state.handle_event(&key(KeyCode::Esc)), BrowserControl::Quit);
}

#[test]
fn modal_outside_click_closes_once_but_inside_click_is_isolated() {
    let viewport = Rect::new(0, 0, 60, 16);
    let mut state = GalleryState::with_story("modal/open").unwrap();
    state.handle_event(&key(KeyCode::Tab));
    state.handle_event_in(&click(30, 8), viewport);
    assert!(
        state.context().get_bool("open"),
        "inside click must not close"
    );

    state.handle_event_in(&click(0, 0), viewport);
    assert!(
        !state.context().get_bool("open"),
        "outside click must close"
    );
    assert_eq!(state.focus_id(), "story-list");

    state.handle_event_in(&click(0, 0), viewport);
    assert!(
        !state.context().get_bool("open"),
        "second click must be a no-op"
    );
}

#[test]
fn modified_outside_click_still_closes_overlay() {
    let viewport = Rect::new(0, 0, 60, 16);
    let mut state = GalleryState::with_story("modal/open").unwrap();
    state.handle_event(&key(KeyCode::Tab));

    state.handle_event_in(&modified_click(0, 0, KeyModifiers::SHIFT), viewport);

    assert!(!state.context().get_bool("open"));
}

#[test]
fn escape_from_preview_restores_story_list_focus_without_quitting() {
    let mut state = GalleryState::with_story("text/default").unwrap();
    state.handle_event(&key(KeyCode::Tab));
    assert_eq!(state.focus_id(), "preview");

    assert_eq!(
        state.handle_event(&key(KeyCode::Esc)),
        BrowserControl::Continue
    );
    assert_eq!(state.focus_id(), "story-list");
    assert_eq!(state.return_focus_id(), None);
}

#[test]
fn plain_story_navigation_uses_the_same_state_reducer() {
    let mut state = GalleryState::with_story("text/default").unwrap();
    let initial = state.selected_story().id;
    assert_eq!(
        state.handle_event(&key(KeyCode::Down)),
        BrowserControl::Continue
    );
    assert_ne!(state.selected_story().id, initial);
    assert_eq!(
        state.context().get_str("story_id"),
        state.selected_story().id
    );
}

#[test]
fn animated_story_advances_from_injected_tick() {
    let mut state = GalleryState::with_story("spinner/animated").unwrap();
    let initial_symbol = state.context().get_str("symbol");

    assert!(state.advance_animation());
    assert_ne!(state.context().get_str("symbol"), initial_symbol);

    let mut static_state = GalleryState::with_story("spinner/frozen").unwrap();
    assert!(!static_state.advance_animation());
}

#[test]
fn views_open_fullscreen_and_f_restores_browser_chrome() {
    let mut state = GalleryState::with_story("view/homelab-healthy").unwrap();
    assert!(state.is_fullscreen());
    assert_eq!(state.focus_id(), "preview");

    assert_eq!(
        state.handle_event(&key(KeyCode::Char('f'))),
        BrowserControl::Continue
    );
    assert!(!state.is_fullscreen());
    assert_eq!(state.focus_id(), "story-list");
}

#[test]
fn fullscreen_escape_returns_to_browser_without_quitting() {
    let mut state = GalleryState::with_story("view/homelab-healthy").unwrap();

    assert_eq!(
        state.handle_event(&key(KeyCode::Esc)),
        BrowserControl::Continue
    );
    assert!(!state.is_fullscreen());
}

#[test]
fn modified_keys_do_not_trigger_global_browser_shortcuts() {
    let mut state = GalleryState::with_story("text/default").unwrap();
    let dark = state.is_dark();

    assert_eq!(
        state.handle_event(&modified_key(KeyCode::Char('q'), KeyModifiers::CONTROL)),
        BrowserControl::Continue
    );
    state.handle_event(&modified_key(KeyCode::Char('t'), KeyModifiers::ALT));
    state.handle_event(&modified_key(KeyCode::Char('f'), KeyModifiers::CONTROL));

    assert_eq!(state.is_dark(), dark);
    assert!(!state.is_fullscreen());
}
