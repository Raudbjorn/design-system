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
    let renderer = ComponentRenderer::new(store);
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
    assert!(!content.contains("[WARN]"), "Found [WARN]: {content}");
}

#[test]
fn test_modal_open() {
    let buf = render_story("modal/open", (60, 16));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Restart jellyfin?"));
    assert!(
        !buffer_text(&buf).contains("level 4"),
        "embedded headings must not expose catalog-only hierarchy captions"
    );
}

#[test]
fn test_modal_validation_error() {
    let buf = render_story("modal/validation-error", (60, 16));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("Service is required"));
}

#[test]
fn test_modal_minimum_size() {
    let buf = render_story("modal/minimum-size", (60, 16));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("minimum size 60x16"));
}

#[test]
fn test_sheet_right() {
    let buf = render_story("sheet/right", (60, 16));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("RIGHT"));
}

#[test]
fn test_sheet_left() {
    let buf = render_story("sheet/left", (60, 16));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("LEFT"));
}

#[test]
fn test_sheet_minimum_size() {
    let buf = render_story("sheet/minimum-size", (60, 16));
    assert_no_warn(&buf);
    assert!(buffer_text(&buf).contains("minimum size 60x16"));
}
