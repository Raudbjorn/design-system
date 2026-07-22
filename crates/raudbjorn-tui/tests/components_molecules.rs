use ratatui::Terminal;
use ratatui::backend::TestBackend;
use ratatui::buffer::Buffer;
use raudbjorn_tui::catalog::STORIES;
use raudbjorn_tui::component::{ComponentRenderer, TemplateStore};
use raudbjorn_tui::profile::{ColorProfile, GlyphProfile, TerminalProfile};
use raudbjorn_tui::theme::DARK;
use std::sync::Arc;

fn render_story(id: &str, size: (u16, u16)) -> Buffer {
    let story = STORIES
        .iter()
        .find(|s| s.id == id)
        .expect("story not found");
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let mut renderer = ComponentRenderer::new(store);
    let backend = TestBackend::new(size.0, size.1);
    let mut terminal = Terminal::new(backend).unwrap();
    let ctx = story.context();
    terminal
        .draw(|frame| {
            renderer
                .render(
                    story.source,
                    &ctx,
                    DARK,
                    TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode),
                    frame,
                    frame.area(),
                )
                .unwrap();
        })
        .unwrap();
    terminal.backend().buffer().clone()
}

fn buffer_text(buf: &Buffer) -> String {
    buf.content()
        .iter()
        .map(|c| c.symbol().to_string())
        .collect()
}

fn assert_no_warn(buf: &Buffer) {
    let content = buffer_text(buf);
    assert!(!content.contains("[WARN]"), "[WARN] found: {}", content);
}

// ===== Button =====

#[test]
fn test_button_primary_has_deploy() {
    let buf = render_story("button/primary", (24, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Deploy"));
}

#[test]
fn test_button_secondary_is_restart() {
    let buf = render_story("button/secondary", (24, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Restart"));
}

#[test]
fn test_button_ghost_is_view_logs() {
    let buf = render_story("button/ghost", (24, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("View logs"));
}

#[test]
fn test_button_danger_has_stop_service() {
    let buf = render_story("button/danger", (24, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Stop service"));
}

#[test]
fn test_button_focused_has_brackets() {
    let buf = render_story("button/focused", (24, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("[Deploy]"));
}

#[test]
fn test_button_disabled_has_depld() {
    let buf = render_story("button/disabled", (24, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("[DEPLD] Deploy"));
}

#[test]
fn test_button_loading_differs_from_primary() {
    let buf = render_story("button/loading", (24, 3));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    let p = buffer_text(&render_story("button/primary", (24, 3)));
    assert_ne!(t, p);
}

#[test]
fn test_button_variants_are_distinct() {
    let p = buffer_text(&render_story("button/primary", (24, 3)));
    let f = buffer_text(&render_story("button/focused", (24, 3)));
    let d = buffer_text(&render_story("button/disabled", (24, 3)));
    assert_ne!(p, f);
    assert_ne!(p, d);
    assert_ne!(f, d);
}

// ===== Link =====

#[test]
fn test_link_internal_shows_href() {
    let buf = render_story("link/internal", (32, 1));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(t.contains("jellyfin.s8n.is"), "Internal link: {}", t);
}

#[test]
fn test_link_external_shows_arrow() {
    let buf = render_story("link/external", (32, 1));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    // Arrow char \u{2192}
    assert!(
        t.contains("\u{2192}") || t.contains("/services"),
        "External link: {}",
        t
    );
}

#[test]
fn test_link_focused_differs() {
    let focused = buffer_text(&render_story("link/focused", (32, 1)));
    let internal = buffer_text(&render_story("link/internal", (32, 1)));
    assert_ne!(focused, internal);
}

// ===== StatCard =====

#[test]
fn test_stat_card_default_has_value() {
    let buf = render_story("stat-card/default", (32, 5));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(
        t.contains("99.98") || t.contains("vinbons"),
        "Stat card: {}",
        t
    );
}

#[test]
fn test_stat_card_accent_differs() {
    let def = buffer_text(&render_story("stat-card/default", (32, 5)));
    let acc = buffer_text(&render_story("stat-card/accent", (32, 5)));
    assert_ne!(def, acc);
}

// ===== Input =====

#[test]
fn test_input_error_has_port_out_of_range() {
    let buf = render_story("input/error", (36, 5));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Port out of range"));
}

#[test]
fn test_input_focused_differs() {
    let focused = buffer_text(&render_story("input/focused", (36, 5)));
    let default_ = buffer_text(&render_story("input/default", (36, 5)));
    assert_ne!(focused, default_);
}

#[test]
fn test_input_disabled_differs() {
    let disabled = buffer_text(&render_story("input/disabled", (36, 5)));
    let default_ = buffer_text(&render_story("input/default", (36, 5)));
    assert_ne!(disabled, default_);
}

// ===== Select =====

#[test]
fn test_select_closed_has_selected() {
    let buf = render_story("select/closed", (36, 9));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Sonarr"));
}

#[test]
fn test_select_open_shows_list() {
    let buf = render_story("select/open", (36, 9));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(t.contains("Sonarr"), "Open select: {}", t);
}

#[test]
fn test_select_selected_shows_radarr() {
    let buf = render_story("select/selected", (36, 9));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Radarr"));
}

#[test]
fn test_select_disabled_is_depld() {
    let buf = render_story("select/disabled", (36, 9));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("DEPLD"));
}

#[test]
fn test_select_open_differs_from_closed() {
    let open = buffer_text(&render_story("select/open", (36, 9)));
    let closed = buffer_text(&render_story("select/closed", (36, 9)));
    assert_ne!(open, closed);
}

// ===== Checkbox =====

#[test]
fn test_checkbox_checked_has_x() {
    let buf = render_story("checkbox/checked", (32, 1));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("[x]"));
}

#[test]
fn test_checkbox_unchecked_has_blank() {
    let buf = render_story("checkbox/unchecked", (32, 1));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("[ ]"));
}

#[test]
fn test_checkbox_disabled_checked_is_depld() {
    let buf = render_story("checkbox/disabled-checked", (32, 1));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("DISABLED"));
}

#[test]
fn test_checkbox_on_off_distinct() {
    let checked = buffer_text(&render_story("checkbox/checked", (32, 1)));
    let unchecked = buffer_text(&render_story("checkbox/unchecked", (32, 1)));
    assert_ne!(checked, unchecked);
}

#[test]
fn test_checkbox_focused_differs_from_unchecked() {
    let focused = buffer_text(&render_story("checkbox/focused", (32, 1)));
    let unchecked = buffer_text(&render_story("checkbox/unchecked", (32, 1)));
    assert_ne!(focused, unchecked);
}

// ===== Radio =====

#[test]
fn test_radio_group_shows_selection() {
    let buf = render_story("radio/group", (32, 5));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(
        t.contains("( )"),
        "radio/group should show unselected marker: {t}"
    );
}

#[test]
fn test_radio_selected_shows_star() {
    let buf = render_story("radio/selected", (32, 5));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("*"));
}

#[test]
fn test_radio_disabled_is_depld() {
    let buf = render_story("radio/disabled", (32, 5));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("DISABLED"));
}

#[test]
fn test_radio_selections_distinct() {
    let grp = buffer_text(&render_story("radio/group", (32, 5)));
    let sel = buffer_text(&render_story("radio/selected", (32, 5)));
    assert_ne!(grp, sel);
}

// ===== Switch =====

#[test]
fn test_switch_off_has_off_state() {
    let buf = render_story("switch/off", (32, 1));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("[ OFF ]"));
}

#[test]
fn test_switch_on_has_on_state() {
    let buf = render_story("switch/on", (32, 1));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("[ ON ]"));
}

#[test]
fn test_switch_focused_differs() {
    let focused = buffer_text(&render_story("switch/focused", (32, 1)));
    let off = buffer_text(&render_story("switch/off", (32, 1)));
    assert_ne!(focused, off);
}

#[test]
fn test_switch_disabled_is_depld() {
    let buf = render_story("switch/disabled", (32, 1));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("DEPLD"));
}

#[test]
fn test_switch_labeled_shows_label() {
    let buf = render_story("switch/labeled", (32, 1));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(t.contains("[ OFF ]") && t.contains("restart"));
}

#[test]
fn test_switch_on_off_distinct() {
    let on = buffer_text(&render_story("switch/on", (32, 1)));
    let off = buffer_text(&render_story("switch/off", (32, 1)));
    assert_ne!(on, off);
}

// ===== Alert =====

#[test]
fn test_alert_info_has_uppercase_tone() {
    let buf = render_story("alert/info", (40, 3));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(t.contains("INFO"), "Alert info: {}", t);
    assert!(t.contains("Service details updated"));
}

#[test]
fn test_alert_success_has_uppercase_tone() {
    let buf = render_story("alert/success", (40, 3));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(t.contains("SUCCESS"));
    assert!(t.contains("jellyfin is healthy"));
}

#[test]
fn test_alert_warning_has_uppercase_tone() {
    let buf = render_story("alert/warning", (40, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("WARNING"));
}

#[test]
fn test_alert_error_has_uppercase_tone() {
    let buf = render_story("alert/error", (40, 3));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(t.contains("ERROR"), "Alert error: {}", t);
    assert!(t.contains("sonarr is unavailable"));
}

#[test]
fn test_alert_tones_distinct() {
    let info = buffer_text(&render_story("alert/info", (40, 3)));
    let err = buffer_text(&render_story("alert/error", (40, 3)));
    assert_ne!(info, err);
}

// ===== Tooltip =====

#[test]
fn test_tooltip_closed_shows_help() {
    let buf = render_story("tooltip/closed", (32, 3));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("?"));
}

#[test]
fn test_tooltip_help_open_shows_help() {
    let open = render_story("tooltip/help-open", (32, 3));
    let closed = render_story("tooltip/closed", (32, 3));
    assert_no_warn(&open);
    let open_text = buffer_text(&open);
    assert!(open_text.contains("Help text"), "Open tooltip: {open_text}");
    assert_ne!(open_text, buffer_text(&closed));
}

#[test]
fn test_tooltip_focused_differs() {
    let focused = buffer_text(&render_story("tooltip/focused", (32, 3)));
    let closed = buffer_text(&render_story("tooltip/closed", (32, 3)));
    assert_ne!(focused, closed);
}

// ===== Table =====

#[test]
fn test_table_default_has_data() {
    let buf = render_story("table/default", (60, 10));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("SERVICE") || buffer_text(&buf).contains("jellyfin"));
}

#[test]
fn test_table_empty_has_no_rows() {
    let buf = render_story("table/empty", (60, 10));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("No rows"));
}

#[test]
fn test_table_rich_cells_has_glyph() {
    let buf = render_story("table/rich-cells", (60, 10));
    assert_no_warn(&buf);
    let text = buffer_text(&buf);
    assert!(
        text.contains("●") || text.contains("[RICH]"),
        "table/rich-cells must show a rich marker: {text}"
    );
}

#[test]
fn test_table_selected_differs() {
    let sel = buffer_text(&render_story("table/selected", (60, 10)));
    let def = buffer_text(&render_story("table/default", (60, 10)));
    assert_ne!(sel, def);
}

#[test]
fn test_table_empty_vs_default_distinct() {
    let empty = buffer_text(&render_story("table/empty", (60, 10)));
    let def = buffer_text(&render_story("table/default", (60, 10)));
    assert_ne!(empty, def);
}

// ===== Timeline =====

#[test]
fn test_timeline_basic_has_spine_and_event() {
    let buf = render_story("timeline/basic", (48, 10));
    assert_no_warn(&buf);
    let text = buffer_text(&buf);
    assert!(
        text.contains("↑") && text.contains("tailscale connected"),
        "timeline/basic must show its up-arrow spine and event: {text}"
    );
}

#[test]
fn test_timeline_status_has_marker() {
    let buf = render_story("timeline/status", (48, 10));
    assert_no_warn(&buf);
    let t = buffer_text(&buf);
    assert!(
        t.contains("[ONLINE] ONLINE"),
        "timeline status must use a terminal-native status chip, not a Markdown bullet: {t}"
    );
}

#[test]
fn test_timeline_reverse_shows_event() {
    let buf = render_story("timeline/reverse", (48, 10));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("tailscale connected"));
}

#[test]
fn test_timeline_variants_distinct() {
    let basic = buffer_text(&render_story("timeline/basic", (48, 10)));
    let status = buffer_text(&render_story("timeline/status", (48, 10)));
    let reverse = buffer_text(&render_story("timeline/reverse", (48, 10)));
    assert_ne!(basic, status);
    assert_ne!(basic, reverse);
}

// ===== CodeBlock =====

#[test]
fn test_code_block_highlighted_has_code() {
    let buf = render_story("code-block/highlighted", (60, 12));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("systemctl restart jellyfin"));
}

#[test]
fn test_code_block_plain_has_code() {
    let buf = render_story("code-block/plain", (60, 12));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("systemctl restart jellyfin"));
}

#[test]
fn test_code_block_long_line_has_overflow() {
    let buf = render_story("code-block/long-line", (60, 12));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("<"));
}

#[test]
fn test_code_block_variants_distinct() {
    let hl = buffer_text(&render_story("code-block/highlighted", (60, 12)));
    let pl = buffer_text(&render_story("code-block/plain", (60, 12)));
    assert_ne!(hl, pl);
}

// ===== All molecule stories render at min size =====

#[test]
fn test_all_molecule_stories_render_at_min_size() {
    fn is_molecule(comp: raudbjorn_tui::component::ComponentId) -> bool {
        matches!(
            comp,
            raudbjorn_tui::component::ComponentId::Button
                | raudbjorn_tui::component::ComponentId::Link
                | raudbjorn_tui::component::ComponentId::StatCard
                | raudbjorn_tui::component::ComponentId::Input
                | raudbjorn_tui::component::ComponentId::Select
                | raudbjorn_tui::component::ComponentId::Checkbox
                | raudbjorn_tui::component::ComponentId::Radio
                | raudbjorn_tui::component::ComponentId::Switch
                | raudbjorn_tui::component::ComponentId::Alert
                | raudbjorn_tui::component::ComponentId::Tooltip
                | raudbjorn_tui::component::ComponentId::Table
                | raudbjorn_tui::component::ComponentId::Timeline
                | raudbjorn_tui::component::ComponentId::CodeBlock
        )
    }

    let failures: Vec<_> = STORIES
        .iter()
        .filter(|s| is_molecule(s.component))
        .filter_map(|s| {
            let buf = render_story(s.id, (s.min_width, s.min_height));
            if buffer_text(&buf).contains("[WARN]") {
                Some(format!(
                    "[{}] WARN at {}x{}",
                    s.id, s.min_width, s.min_height
                ))
            } else {
                None
            }
        })
        .collect();

    assert!(
        failures.is_empty(),
        "Render failures:\n{}",
        failures.join("\n")
    );
}
