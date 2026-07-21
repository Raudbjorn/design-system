use std::sync::Arc;

use crepuscularity_tui::TemplateContext;
use ratatui::{Terminal, backend::TestBackend};
use raudbjorn_tui::{
    catalog::STORIES,
    component::{ComponentRenderer, TemplateStore},
    profile::{ColorProfile, GlyphProfile, TerminalProfile},
    theme::DARK,
};

fn render(story_id: &str, ctx: &TemplateContext, size: (u16, u16)) -> String {
    let story = STORIES.iter().find(|story| story.id == story_id).unwrap();
    let mut renderer = ComponentRenderer::new(Arc::new(TemplateStore::load_embedded().unwrap()));
    let mut terminal = Terminal::new(TestBackend::new(size.0, size.1)).unwrap();
    terminal
        .draw(|frame| {
            renderer
                .render(
                    story.source,
                    ctx,
                    DARK,
                    TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode),
                    frame,
                    frame.area(),
                )
                .unwrap();
        })
        .unwrap();
    terminal
        .backend()
        .buffer()
        .content()
        .iter()
        .map(|cell| cell.symbol())
        .collect()
}

#[test]
fn progress_normalizes_out_of_range_and_non_finite_values() {
    for (value, expected) in [(-1.0, "0%"), (101.0, "100%"), (f64::NAN, "Unavailable")] {
        let story = STORIES
            .iter()
            .find(|story| story.id == "progress/determinate")
            .unwrap();
        let mut ctx = story.context();
        ctx.set("value", value);
        let output = render(story.id, &ctx, (40, 3));
        assert!(
            output.contains(expected),
            "value {value:?} must render as {expected}: {output:?}"
        );
        if value.is_nan() {
            assert!(
                !output.contains("Unavailable%"),
                "non-finite progress must not render an unavailable percentage: {output:?}"
            );
        }
    }
}

#[test]
fn select_empty_options_renders_explicit_fallback() {
    let story = STORIES
        .iter()
        .find(|story| story.id == "select/open")
        .unwrap();
    let mut ctx = story.context();
    ctx.set("option_count", 0_i64)
        .set("selected_index", 8_i64)
        .set("selected", "")
        .set("options", "");

    let output = render(story.id, &ctx, (36, 9));
    assert!(output.contains("No options"), "empty Select: {output:?}");
}
