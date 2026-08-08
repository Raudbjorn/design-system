use crepuscularity_tui::TemplateValue;
use raudbjorn_tui::catalog::{STORIES, validate_catalog};
use raudbjorn_tui::component::ComponentId;

fn get_i64(ctx: &crepuscularity_tui::TemplateContext, key: &str) -> i64 {
    ctx.get(key)
        .and_then(|v| {
            if let TemplateValue::Int(i) = v {
                Some(*i)
            } else {
                None
            }
        })
        .unwrap_or(0)
}

#[test]
fn catalog_ids_are_unique() {
    let mut seen = std::collections::HashSet::new();
    for story in STORIES.iter() {
        assert!(seen.insert(story.id), "Duplicate ID: {}", story.id);
    }
}

#[test]
fn catalog_labels_are_unique() {
    let mut seen = std::collections::HashSet::new();
    for story in STORIES.iter() {
        let key = (story.group, story.name);
        assert!(
            seen.insert(key),
            "Duplicate label ({}, {})",
            story.group,
            story.name
        );
    }
}

#[test]
fn catalog_covers_all_web_components() {
    let web_components: std::collections::HashSet<_> = include_str!("../../../src/lib/index.ts")
        .lines()
        .filter_map(|line| {
            line.strip_prefix("export { default as ")
                .and_then(|export| export.split_once(" } from './components/"))
                .map(|(name, _)| name)
        })
        .collect();
    let terminal_components: std::collections::HashSet<_> = ComponentId::ALL
        .iter()
        .map(|component| component.as_str())
        .collect();

    assert_eq!(
        terminal_components, web_components,
        "terminal component inventory must match the public Svelte component barrel"
    );
}

#[test]
fn catalog_has_stories_for_each_component() {
    let mut by_comp: std::collections::HashMap<ComponentId, usize> =
        std::collections::HashMap::new();
    for story in STORIES {
        *by_comp.entry(story.component).or_insert(0) += 1;
    }
    for comp in ComponentId::ALL {
        let count = by_comp.get(&comp).copied().unwrap_or(0);
        assert!(count > 0, "{:?} has 0 stories", comp);
    }
}

#[test]
fn catalog_validation_passes_with_load_embedded() {
    validate_catalog().unwrap_or_else(|error| panic!("catalog validation failed: {error:?}"));
}

#[test]
fn fixtures_are_deterministic() {
    fn values(ctx: &crepuscularity_tui::TemplateContext) -> Vec<(&str, String)> {
        let mut values: Vec<_> = ctx
            .vars
            .iter()
            .map(|(key, value)| (key.as_str(), format!("{value:?}")))
            .collect();
        values.sort_unstable();
        values
    }

    for story in STORIES {
        let first = story.context();
        let second = story.context();
        assert_eq!(
            values(&first),
            values(&second),
            "{} fixture is not deterministic",
            story.id
        );
    }
}

#[test]
fn story_context_identifies_each_variant() {
    for story in STORIES {
        let ctx = story.context();
        assert_eq!(ctx.get_str("story_id"), story.id);
        let expected_variant = story
            .id
            .rsplit_once('/')
            .map_or(story.id, |(_, variant)| variant);
        assert_eq!(
            ctx.get_str("variant"),
            expected_variant,
            "{} must expose its variant to the template",
            story.id
        );
    }
}

#[test]
fn story_context_applies_interactive_variant_state() {
    let context = |id| {
        STORIES
            .iter()
            .find(|story| story.id == id)
            .unwrap_or_else(|| panic!("missing story {id}"))
            .context()
    };

    assert!(context("button/disabled").get_bool("disabled"));
    assert!(context("button/loading").get_bool("loading"));
    assert!(context("switch/on").get_bool("on"));
    assert!(!context("checkbox/unchecked").get_bool("checked"));
    assert!(context("select/open").get_bool("open"));
    assert_eq!(get_i64(&context("tabs/second-active"), "active_index"), 1);
}
#[test]
fn all_min_sizes_positive() {
    for story in STORIES {
        assert!(
            story.min_width > 0 && story.min_height > 0,
            "{} has zero minimum size",
            story.id
        );
    }
}

#[test]
fn interactive_stories_have_handlers() {
    fn is_interactive(comp: ComponentId) -> bool {
        matches!(
            comp,
            ComponentId::Button
                | ComponentId::Input
                | ComponentId::Select
                | ComponentId::Checkbox
                | ComponentId::Radio
                | ComponentId::Switch
                | ComponentId::Tabs
                | ComponentId::Link
                | ComponentId::Table
                | ComponentId::Tooltip
                | ComponentId::Modal
                | ComponentId::Sheet
        )
    }
    for story in STORIES {
        if is_interactive(story.component) {
            assert!(
                story.handle_event.is_some(),
                "Interactive story {:?} ({}) missing handler",
                story.component,
                story.id
            );
        }
    }
}

use crossterm::event::{Event, KeyCode, KeyEvent, KeyModifiers};

#[test]
fn test_button_activation_changes_state() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::button_fixture();
    let enter = Event::Key(KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE));
    let changed = raudbjorn_tui::catalog::handlers::handle_button(&mut ctx, &enter);
    assert!(changed, "Button Enter should activate");
    assert_eq!(
        get_i64(&ctx, "activations"),
        1,
        "activations must increment on Enter"
    );
}

#[test]
fn test_button_disabled_returns_false() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::button_fixture();
    ctx.set("disabled", true);
    let enter = Event::Key(KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE));
    let changed = raudbjorn_tui::catalog::handlers::handle_button(&mut ctx, &enter);
    assert!(!changed, "Disabled button should not activate");
}

#[test]
fn test_checkbox_toggle_true() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::checkbox_fixture();
    let space = Event::Key(KeyEvent::new(KeyCode::Char(' '), KeyModifiers::NONE));
    let changed = raudbjorn_tui::catalog::handlers::handle_checkbox(&mut ctx, &space);
    assert!(changed, "Space on checkbox should toggle");
}

#[test]
fn test_input_paste_handling() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::input_fixture();
    let pasted = Event::Paste("hello world".into());
    let changed = raudbjorn_tui::catalog::handlers::handle_input(&mut ctx, &pasted);
    assert!(changed, "Paste should update input value");
}

#[test]
fn test_select_bounded_selection() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::select_fixture();
    ctx.set("open", true);

    let down = Event::Key(KeyEvent::new(KeyCode::Down, KeyModifiers::NONE));
    assert!(raudbjorn_tui::catalog::handlers::handle_select(
        &mut ctx, &down
    ));
    for _ in 1..100 {
        let _ = raudbjorn_tui::catalog::handlers::handle_select(&mut ctx, &down);
    }

    let selected = get_i64(&ctx, "selected_index");
    assert!(
        selected >= 0 && selected <= 2,
        "Selected index {} out of bounds [0,2]",
        selected
    );
}

#[test]
fn test_tabs_wrapping_navigation() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::tabs_fixture();
    let right = Event::Key(KeyEvent::new(KeyCode::Right, KeyModifiers::NONE));
    for _ in 0..3 {
        assert!(raudbjorn_tui::catalog::handlers::handle_tabs(
            &mut ctx, &right
        ));
    }
    assert_eq!(
        get_i64(&ctx, "active_index"),
        0,
        "Right must wrap from the final tab to the first"
    );

    let left = Event::Key(KeyEvent::new(KeyCode::Left, KeyModifiers::NONE));
    assert!(raudbjorn_tui::catalog::handlers::handle_tabs(
        &mut ctx, &left
    ));
    assert_eq!(
        get_i64(&ctx, "active_index"),
        2,
        "Left must wrap from the first tab to the final tab"
    );
}

#[test]
fn test_radio_bounded_selection() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::radio_fixture();

    let down = Event::Key(KeyEvent::new(KeyCode::Down, KeyModifiers::NONE));
    assert!(raudbjorn_tui::catalog::handlers::handle_radio(
        &mut ctx, &down
    ));
    for _ in 1..50 {
        let _ = raudbjorn_tui::catalog::handlers::handle_radio(&mut ctx, &down);
    }

    let selected = get_i64(&ctx, "selected_index");
    assert!(
        selected >= 0 && selected <= 2,
        "Radio selected index {} out of bounds",
        selected
    );
}

#[test]
fn test_switch_on_off() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::switch_fixture();

    let space = Event::Key(KeyEvent::new(KeyCode::Char(' '), KeyModifiers::NONE));
    let on = raudbjorn_tui::catalog::handlers::handle_switch(&mut ctx, &space);
    assert!(on, "Switch should toggle on");

    let off = raudbjorn_tui::catalog::handlers::handle_switch(&mut ctx, &space);
    assert!(off, "Switch should toggle off");
}

#[test]
fn test_modal_esc_closes_once() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::modal_fixture();
    ctx.set("open", true);

    let esc1 = Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE));
    let closed1 = raudbjorn_tui::catalog::handlers::handle_modal(&mut ctx, &esc1);
    assert!(closed1, "Modal Esc should close");

    let esc2 = Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE));
    let closed2 = raudbjorn_tui::catalog::handlers::handle_modal(&mut ctx, &esc2);
    assert!(!closed2, "Second Modal Esc should be no-op");

    let still_open = ctx.get_bool("open");
    assert!(!still_open, "Modal should be closed after first Esc");
}

#[test]
fn test_sheet_esc_closes_once() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::sheet_fixture();
    ctx.set("open", true);

    let esc1 = Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE));
    let closed1 = raudbjorn_tui::catalog::handlers::handle_sheet(&mut ctx, &esc1);
    assert!(closed1, "Sheet Esc should close");

    let esc2 = Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE));
    let closed2 = raudbjorn_tui::catalog::handlers::handle_sheet(&mut ctx, &esc2);
    assert!(!closed2, "Second Sheet Esc should be no-op");
}

#[test]
fn test_tooltip_toggling() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::tooltip_fixture();

    let q = Event::Key(KeyEvent::new(KeyCode::Char('?'), KeyModifiers::NONE));
    let opened = raudbjorn_tui::catalog::handlers::handle_tooltip(&mut ctx, &q);
    assert!(opened, "Tooltip ? should open");

    let q2 = Event::Key(KeyEvent::new(KeyCode::Char('?'), KeyModifiers::NONE));
    let closed = raudbjorn_tui::catalog::handlers::handle_tooltip(&mut ctx, &q2);
    assert!(closed, "Tooltip ? should close");
}

#[test]
fn test_input_delete_unicode_safe() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::input_fixture();
    ctx.set("value", "Hello 🌍");

    let back = Event::Key(KeyEvent::new(KeyCode::Backspace, KeyModifiers::NONE));
    let changed = raudbjorn_tui::catalog::handlers::handle_input(&mut ctx, &back);
    assert!(changed, "Backspace should modify input");
    assert_eq!(
        ctx.get_str("value"),
        "Hello ",
        "Backspace on emoji must remove exactly the emoji codepoint"
    );
}

#[test]
fn test_input_backspace_empty_is_noop() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::input_fixture();
    ctx.set("value", "");

    let back = Event::Key(KeyEvent::new(KeyCode::Backspace, KeyModifiers::NONE));
    assert!(!raudbjorn_tui::catalog::handlers::handle_input(
        &mut ctx, &back
    ));
    assert_eq!(ctx.get_str("value"), "");
}

#[test]
fn test_input_ignores_control_keys_but_accepts_shifted_text() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::input_fixture();
    ctx.set("value", "");
    let ctrl_k = Event::Key(KeyEvent::new(KeyCode::Char('k'), KeyModifiers::CONTROL));
    let shift_k = Event::Key(KeyEvent::new(KeyCode::Char('K'), KeyModifiers::SHIFT));

    assert!(!raudbjorn_tui::catalog::handlers::handle_input(
        &mut ctx, &ctrl_k
    ));
    assert!(raudbjorn_tui::catalog::handlers::handle_input(
        &mut ctx, &shift_k
    ));
    assert_eq!(ctx.get_str("value"), "K");
}

#[test]
fn test_link_focused_event() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::link_fixture();

    let enter = Event::Key(KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE));
    let changed = raudbjorn_tui::catalog::handlers::handle_link(&mut ctx, &enter);
    assert!(changed, "Link Enter should activate");
}

#[test]
fn test_table_row_selection_bounded() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::table_fixture();
    ctx.set("row_count", 10_i64);

    for _ in 0..100 {
        let down = Event::Key(KeyEvent::new(KeyCode::Down, KeyModifiers::NONE));
        let _changed = raudbjorn_tui::catalog::handlers::handle_table(&mut ctx, &down);
    }

    let sel = get_i64(&ctx, "selected_row");
    assert!(
        sel >= 0 && sel < 10,
        "Table row selection {} outside rows=10",
        sel
    );
}

#[test]
fn table_up_at_first_row_stays_bounded() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::table_fixture();
    ctx.set("row_count", 10_i64).set("selected_row", 0_i64);

    let up = Event::Key(KeyEvent::new(KeyCode::Up, KeyModifiers::NONE));
    let changed = raudbjorn_tui::catalog::handlers::handle_table(&mut ctx, &up);

    assert!(!changed, "Up at the first row must be a no-op");
    assert_eq!(get_i64(&ctx, "selected_row"), 0);
}

#[test]
fn stories_count_matches_approved_inventory() {
    assert_eq!(
        STORIES.len(),
        115,
        "Should have 115 stories total (103 components + 12 composites)"
    );
    let components = STORIES
        .iter()
        .filter(|s| !s.id.starts_with("pane/") && !s.id.starts_with("view/"))
        .count();
    assert_eq!(
        components, 103,
        "Should have 103 original component stories"
    );
}

#[test]
fn story_groups_match_plan_categories() {
    let expected_groups: std::collections::HashSet<&str> =
        ComponentId::ALL.iter().map(|c| c.as_str()).collect();

    let actual_groups: std::collections::HashSet<&str> = STORIES.iter().map(|s| s.group).collect();

    for g in &expected_groups {
        assert!(
            actual_groups.contains(g),
            "Group '{}' missing from stories",
            g
        );
    }
}

#[test]
fn tabs_home_end_clamps() {
    let mut ctx = raudbjorn_tui::catalog::fixtures::tabs_fixture();

    let end = Event::Key(KeyEvent::new(KeyCode::End, KeyModifiers::NONE));
    let _ = raudbjorn_tui::catalog::handlers::handle_tabs(&mut ctx, &end);
    let home = Event::Key(KeyEvent::new(KeyCode::Home, KeyModifiers::NONE));
    let _ = raudbjorn_tui::catalog::handlers::handle_tabs(&mut ctx, &home);

    let idx = get_i64(&ctx, "active_index");
    assert_eq!(idx, 0, "Home must select the first tab");
}

#[test]
fn disabled_controls_return_false_all_types() {
    // Button
    let mut ctx = raudbjorn_tui::catalog::fixtures::button_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_button(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE))
    ));

    // Input
    let mut ctx = raudbjorn_tui::catalog::fixtures::input_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_input(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Char('x'), KeyModifiers::NONE))
    ));

    // Checkbox
    let mut ctx = raudbjorn_tui::catalog::fixtures::checkbox_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_checkbox(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Char(' '), KeyModifiers::NONE))
    ));

    // Select
    let mut ctx = raudbjorn_tui::catalog::fixtures::select_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_select(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Enter, KeyModifiers::NONE))
    ));

    // Radio
    let mut ctx = raudbjorn_tui::catalog::fixtures::radio_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_radio(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Down, KeyModifiers::NONE))
    ));

    // Switch
    let mut ctx = raudbjorn_tui::catalog::fixtures::switch_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_switch(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Char(' '), KeyModifiers::NONE))
    ));

    // Tabs
    let mut ctx = raudbjorn_tui::catalog::fixtures::tabs_fixture();
    ctx.set("disabled", true);
    assert!(!raudbjorn_tui::catalog::handlers::handle_tabs(
        &mut ctx,
        &Event::Key(KeyEvent::new(KeyCode::Right, KeyModifiers::NONE))
    ));
}

#[test]
fn catalog_ids_match_approved_inventory() {
    let expected: std::collections::HashSet<_> = concat!(
        "text/default text/strong text/muted text/faint text/mono ",
        "heading/level-1 heading/level-2 heading/level-3 heading/level-4 ",
        "icon/unicode icon/ascii kbd/single kbd/chord ",
        "badge/neutral badge/accent badge/success badge/warning badge/error ",
        "avatar/initials avatar/image-fallback ",
        "button/primary button/secondary button/ghost button/danger button/focused button/disabled button/loading ",
        "link/internal link/external link/focused ",
        "stack/column stack/row stack/wrap ",
        "card/basic card/header-footer card/emphasis card/dense ",
        "stat-card/default stat-card/accent stat-card/accent-2 stat-card/row ",
        "alert/info alert/success alert/warning alert/error ",
        "spinner/frozen spinner/animated spinner/ascii ",
        "progress/determinate progress/indeterminate progress/complete progress/error ",
        "input/default input/hint input/error input/focused input/disabled ",
        "select/closed select/open select/selected select/focused select/disabled ",
        "checkbox/unchecked checkbox/checked checkbox/focused checkbox/disabled-checked ",
        "radio/group radio/selected radio/focused radio/disabled ",
        "switch/off switch/on switch/focused switch/disabled switch/labeled ",
        "tabs/first-active tabs/second-active tabs/narrow ",
        "breadcrumb/default breadcrumb/truncated ",
        "nav-bar/default nav-bar/narrow ",
        "table/default table/rich-cells table/selected table/empty table/narrow ",
        "timeline/basic timeline/status timeline/reverse ",
        "code-block/highlighted code-block/plain code-block/long-line code-block/ascii ",
        "tooltip/closed tooltip/help-open tooltip/focused ",
        "modal/open modal/validation-error modal/minimum-size ",
        "sheet/right sheet/left sheet/minimum-size ",
        "pane/service-table pane/stat-row pane/activity pane/journal-following pane/journal-pinned pane/actions ",
        "view/homelab-healthy view/homelab-degraded view/homelab-loading view/homelab-empty view/homelab-error view/minimum-size"
    )
    .split_whitespace()
    .collect();
    let actual: std::collections::HashSet<_> = STORIES.iter().map(|story| story.id).collect();
    assert_eq!(actual, expected);
}
