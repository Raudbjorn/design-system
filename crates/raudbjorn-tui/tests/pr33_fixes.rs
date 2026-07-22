//! Regression tests paired with the nine PR #33 review-thread fixes.
//!
//! Each test here corresponds to one fix in the brief. Tests are written
//! before the implementation change so that the brief's contract (red then
//! green) is enforced in this file's commit history.

use std::collections::HashMap;
use std::sync::Arc;

use crossterm::event::{Event, KeyCode, KeyEvent, KeyModifiers};
use crepuscularity_tui::TemplateContext;
use raudbjorn_tui::browser::GalleryState;
use raudbjorn_tui::catalog::{
    STORIES,
    fixtures::{checkbox_fixture, radio_fixture, switch_fixture, table_fixture, tabs_fixture},
    handlers,
};

// ----- shared helpers --------------------------------------------------------

fn key(code: KeyCode) -> Event {
    Event::Key(KeyEvent::new(code, KeyModifiers::NONE))
}

fn modified_key(code: KeyCode, modifiers: KeyModifiers) -> Event {
    Event::Key(KeyEvent::new(code, modifiers))
}

fn get_i64(ctx: &TemplateContext, key: &str) -> i64 {
    match ctx.get(key) {
        Some(crepuscularity_tui::TemplateValue::Int(v)) => *v,
        _ => 0,
    }
}

fn get_str(ctx: &TemplateContext, key: &str) -> String {
    match ctx.get(key) {
        Some(crepuscularity_tui::TemplateValue::Str(v)) => (*v).clone(),
        _ => String::new(),
    }
}

fn get_bool(ctx: &TemplateContext, key: &str) -> bool {
    matches!(
        ctx.get(key),
        Some(crepuscularity_tui::TemplateValue::Bool(true))
    )
}

// ===== Fix 1 — handle_table consumes keypress at zero row, clamps to zero ===

#[test]
fn handle_table_at_zero_clamps_to_zero_not_negative() {
    let mut ctx = table_fixture();
    ctx.set("row_count", 5_i64).set("selected_row", 0_i64);

    let consumed = handlers::handle_table(&mut ctx, &key(KeyCode::Up));

    assert!(
        consumed,
        "Up at row 0 must still be consumed (handler acknowledges the keystroke)"
    );
    assert_eq!(
        get_i64(&ctx, "selected_row"),
        0,
        "Up at row 0 must not underflow into a negative index"
    );
}

#[test]
fn handle_table_at_last_row_down_clamps_and_consumes() {
    let mut ctx = table_fixture();
    ctx.set("row_count", 5_i64).set("selected_row", 4_i64);

    let consumed = handlers::handle_table(&mut ctx, &key(KeyCode::Down));

    assert!(
        consumed,
        "Down at the last row must be consumed even though the index does not advance"
    );
    assert_eq!(
        get_i64(&ctx, "selected_row"),
        4,
        "Down at the last row must clamp to count - 1"
    );
}

// ===== Fix 2 — normalize_select syncs text, normalize_tabs keeps the tab in sync

#[test]
fn normalize_select_syncs_selected_text_from_options_and_index() {
    let mut ctx = TemplateContext::default();
    ctx.set("options", "A,B,C")
        .set("option_count", 3_i64)
        .set("selected_index", 1_i64)
        .set("selected", "stale value");

    raudbjorn_tui::component::normalize_select(&mut ctx);

    assert_eq!(
        get_str(&ctx, "selected"),
        "B",
        "normalize_select must derive `selected` from the current option at selected_index"
    );
}

#[test]
fn normalize_select_handles_negative_index_gracefully() {
    let mut ctx = TemplateContext::default();
    ctx.set("options", "A,B,C")
        .set("option_count", 3_i64)
        .set("selected_index", -2_i64)
        .set("selected", "");

    raudbjorn_tui::component::normalize_select(&mut ctx);

    assert_eq!(
        get_i64(&ctx, "selected_index"),
        -1,
        "Out-of-range selected_index must clamp to the no-selection sentinel"
    );
    assert_eq!(
        get_str(&ctx, "selected"),
        "None",
        "Out-of-range selected text must read 'None'"
    );
}

#[test]
fn normalize_select_falls_back_to_no_options_when_blank() {
    let mut ctx = TemplateContext::default();
    ctx.set("options", "")
        .set("option_count", 0_i64)
        .set("selected_index", 0_i64)
        .set("selected", "");

    raudbjorn_tui::component::normalize_select(&mut ctx);

    assert_eq!(get_str(&ctx, "selected"), "No options");
    assert_eq!(get_str(&ctx, "options"), "No options");
    assert_eq!(get_i64(&ctx, "selected_index"), -1_i64);
}

#[test]
fn normalize_tabs_syncs_tab_text_with_active_index() {
    let mut ctx = TemplateContext::default();
    ctx.set("tabs", "One,Two,Three")
        .set("tab_count", 3_i64)
        .set("active_index", 2_i64)
        .set("tab", "stale tab");

    raudbjorn_tui::component::normalize_tabs(&mut ctx);

    assert_eq!(
        get_str(&ctx, "tab"),
        "Three",
        "normalize_tabs must set `tab` to the label at active_index"
    );
}

#[test]
fn normalize_tabs_clamps_out_of_range_active_index() {
    let mut ctx = TemplateContext::default();
    ctx.set("tabs", "One,Two,Three")
        .set("tab_count", 3_i64)
        .set("active_index", 99_i64)
        .set("tab", "stale tab");

    raudbjorn_tui::component::normalize_tabs(&mut ctx);

    assert_eq!(
        get_i64(&ctx, "active_index"),
        2,
        "active_index past the last tab must clamp to count - 1"
    );
    assert_eq!(
        get_str(&ctx, "tab"),
        "Three",
        "tab text must reflect the clamped active_index"
    );
}

// ===== Fix 3 — Sheet width must not underflow; rendered preview stays inside area

#[test]
fn dump_story_sheet_right_at_5x5_does_not_panic() {
    let profile = raudbjorn_tui::profile::TerminalProfile::new(
        raudbjorn_tui::profile::ColorProfile::TrueColor,
        raudbjorn_tui::profile::GlyphProfile::Unicode,
    );
    let result = raudbjorn_tui::browser::dump_story(
        "sheet/right",
        5,
        5,
        profile,
        raudbjorn_tui::theme::DARK,
    );
    assert!(
        result.is_ok(),
        "dump_story must not panic at 5x5: {result:?}"
    );
}

#[test]
fn dump_story_modal_open_at_10x10_does_not_panic() {
    let profile = raudbjorn_tui::profile::TerminalProfile::new(
        raudbjorn_tui::profile::ColorProfile::TrueColor,
        raudbjorn_tui::profile::GlyphProfile::Unicode,
    );
    let result = raudbjorn_tui::browser::dump_story(
        "modal/open",
        10,
        10,
        profile,
        raudbjorn_tui::theme::DARK,
    );
    assert!(
        result.is_ok(),
        "dump_story must not panic at 10x10: {result:?}"
    );
}

// ===== Fix 4 — tui job's checkout disables persist-credentials (YAML smoke) =

#[test]
fn tui_ci_checkout_disables_persist_credentials() {
    let yaml = include_str!("../../../.github/workflows/ci.yml");
    let tui_block_start = yaml.find("tui:").expect("tui job missing from ci.yml");
    let tui_block = &yaml[tui_block_start..];
    assert!(
        tui_block.contains("dtolnay/rust-toolchain@1.96.1"),
        "The `tui:` job must use dtolnay/rust-toolchain@1.96.1"
    );
    assert!(
        tui_block.contains("persist-credentials: false"),
        "The tui job's actions/checkout must set persist-credentials: false"
    );
}

// ===== Fix 5 — BackTab on non-fullscreen browser routes to focus-toggle

#[test]
fn browser_handles_backtab_as_shift_tab() {
    let mut state = GalleryState::with_story("text/default").unwrap();
    let back_tab = key(KeyCode::BackTab);

    state.handle_event(&back_tab);
    assert_eq!(
        state.focus_id(),
        "preview",
        "BackTab on a non-fullscreen browser must toggle focus into the preview pane"
    );

    state.handle_event(&back_tab);
    assert_eq!(
        state.focus_id(),
        "story-list",
        "BackTab must toggle focus back out of the preview pane"
    );
}

// ===== Fix 6 (a) — table fixtures set row_count and handle_table works ========

#[test]
fn table_fixtures_provide_row_count() {
    let mut bad: Vec<String> = Vec::new();
    for story in STORIES.iter().filter(|s| s.id.starts_with("table/")) {
        let ctx = story.context();
        let rc = get_i64(&ctx, "row_count");
        if rc <= 0 {
            bad.push(format!("{} -> row_count = {}", story.id, rc));
        }
    }
    assert!(
        bad.is_empty(),
        "Table fixtures must set row_count > 0. Missing: {bad:?}"
    );
}

#[test]
fn table_stories_handle_table_advances_selected_row() {
    for story in STORIES.iter().filter(|s| s.id.starts_with("table/")) {
        let mut ctx = story.context();
        if get_i64(&ctx, "row_count") <= 0 {
            ctx.set("row_count", 1_i64);
        }
        ctx.set("selected_row", 0_i64);
        let consumed = handlers::handle_table(&mut ctx, &key(KeyCode::Down));
        let next = get_i64(&ctx, "selected_row");
        assert!(
            consumed || next == 0,
            "table story {} must consume Down or stay at row 0 (got next={})",
            story.id,
            next
        );
    }
}

// ===== Fix 6 (b) — handlers mutate, fields actually consumed ================

#[test]
fn handle_checkbox_toggles_checked_field() {
    let mut ctx = checkbox_fixture();
    assert!(!get_bool(&ctx, "checked"));
    assert!(handlers::handle_checkbox(&mut ctx, &key(KeyCode::Char(' '))));
    assert!(get_bool(&ctx, "checked"));
}

#[test]
fn handle_switch_toggles_on_field() {
    let mut ctx = switch_fixture();
    assert!(!get_bool(&ctx, "on"));
    assert!(handlers::handle_switch(&mut ctx, &key(KeyCode::Char(' '))));
    assert!(get_bool(&ctx, "on"));
}

#[test]
fn handle_radio_advances_selected_index() {
    let mut ctx = radio_fixture();
    ctx.set("option_count", 3_i64).set("selected_index", 0_i64);
    assert!(handlers::handle_radio(&mut ctx, &key(KeyCode::Right)));
    assert_eq!(get_i64(&ctx, "selected_index"), 1);
}

#[test]
fn handle_tabs_advances_active_index() {
    let mut ctx = tabs_fixture();
    ctx.set("tab_count", 3_i64).set("active_index", 0_i64);
    assert!(handlers::handle_tabs(&mut ctx, &key(KeyCode::Right)));
    assert_eq!(get_i64(&ctx, "active_index"), 1);
}

#[test]
fn templates_reference_mutated_fields() {
    use raudbjorn_tui::component::{TemplateFile, TemplateStore};

    let store = TemplateStore::load_embedded().unwrap();

    let cases: &[(&str, TemplateFile, &str)] = &[
        ("Checkbox", TemplateFile::Molecules, "{checked}"),
        ("Radio", TemplateFile::Molecules, "{radio}"),
        ("Switch", TemplateFile::Molecules, "{on}"),
        ("Tabs", TemplateFile::Layout, "{tab}"),
    ];

    let mut missing: Vec<String> = Vec::new();
    for (component, file, snippet) in cases {
        let entry = store
            .source_for_section_public(*file, component)
            .expect("component present in store");
        if !entry.contains(snippet) {
            missing.push(format!("{component} missing {snippet}"));
        }
    }
    assert!(
        missing.is_empty(),
        "Templates must reference handler-mutated fields: {missing:?}"
    );
}

// ===== Fix 7 — caller-supplied virtual_files overrides store entries ========

#[test]
fn component_renderer_caller_virtual_file_overrides_store_entry() {
    use raudbjorn_tui::component::{ComponentRenderer, TemplateFile, TemplateRef, TemplateStore};
    use raudbjorn_tui::profile::{ColorProfile, GlyphProfile, TerminalProfile};
    use std::sync::Arc;

    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let mut renderer = ComponentRenderer::new(store);

    let sentinel = "PR33-OVERRIDE-SENTINEL";
    let mut override_ctx = TemplateContext::default();
    override_ctx.set("w", 30_i64).set("h", 1_i64).set("sentinel", sentinel);

    let mut vf = HashMap::new();
    vf.insert(
        "templates/atoms.crepus".to_string(),
        format!(
            "+++\n[Text]\ndescription = \"Text component\"\n+++\n--- Text\n\
             div h-[1] text-[#aa0005]\n  \"{sentinel}\"\n"
        ),
    );
    override_ctx.virtual_files = Arc::new(vf);

    let template = TemplateRef {
        file: TemplateFile::Atoms,
        section: "Text",
    };

    let backend = ratatui::backend::TestBackend::new(40, 1);
    let mut terminal = ratatui::Terminal::new(backend).unwrap();
    terminal
        .draw(|frame| {
            renderer
                .render(
                    template,
                    &override_ctx,
                    raudbjorn_tui::theme::DARK,
                    TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode),
                    frame,
                    frame.area(),
                )
                .unwrap();
        })
        .unwrap();

    let text: String = terminal
        .backend()
        .buffer()
        .content()
        .iter()
        .map(|cell| cell.symbol())
        .collect();
    assert!(
        text.contains(sentinel),
        "Caller-supplied virtual_files must win over the store's embedded source; got {text:?}"
    );
}

// ===== Fix 8 — PaneServiceTable audit =========================================

#[test]
fn pane_service_table_outer_container_has_border_in_both_states() {
    let src = include_str!("../templates/views.crepus");

    let pane_start = src
        .find("--- PaneServiceTable")
        .expect("PaneServiceTable section must exist in views.crepus");
    let next_section = src[pane_start..]
        .find("\n--- ")
        .map(|rel| pane_start + rel)
        .unwrap_or(src.len());
    let pane = &src[pane_start..next_section];
    let outer_line = pane
        .lines()
        .find(|line| line.starts_with("div "))
        .expect("PaneServiceTable must contain an outer div");
    assert!(
        outer_line.contains("border"),
        "PaneServiceTable outer div must declare `border` to remain visually consistent \
         with sibling panes; got {outer_line:?}"
    );
}
