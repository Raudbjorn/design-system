mod support;

use ratatui::style::Color;
use raudbjorn_tui::{
    browser::{GalleryError, dump_story, list_text},
    profile::{ColorProfile, GlyphProfile, TerminalProfile},
    theme::DARK,
};
use support::render_context_with_palette;

fn profile() -> TerminalProfile {
    TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode)
}

#[test]
fn gallery_list_is_catalog_order_and_complete() {
    let output = list_text().unwrap();
    let lines: Vec<_> = output.lines().collect();
    assert_eq!(lines.len(), 115);
    assert_eq!(lines[0], "text/default\tText\tDefault");
    assert_eq!(lines[114], "view/minimum-size\tViews\tMinimum Size");
}

#[test]
fn gallery_dump_is_fixed_size_and_deterministic() {
    let first = dump_story("text/default", 24, 3, profile(), DARK).unwrap();
    let second = dump_story("text/default", 24, 3, profile(), DARK).unwrap();
    assert_eq!(first, second);
    let rows: Vec<_> = first.lines().collect();
    assert_eq!(rows.len(), 3);
    assert!(rows[0].contains("Homelab services"));
}

#[test]
fn gallery_dump_rejects_unknown_story_and_zero_size() {
    assert!(matches!(
        dump_story("missing/story", 24, 3, profile(), DARK),
        Err(GalleryError::UnknownStory(id)) if id == "missing/story"
    ));
    assert!(matches!(
        dump_story("text/default", 0, 3, profile(), DARK),
        Err(GalleryError::InvalidSize {
            width: 0,
            height: 3
        })
    ));
}

#[test]
fn gallery_dump_renders_every_registered_story() {
    for story in raudbjorn_tui::catalog::STORIES {
        let output = dump_story(story.id, story.min_width, story.min_height, profile(), DARK)
            .unwrap_or_else(|error| panic!("{} failed: {error}", story.id));
        assert_eq!(output.lines().count(), usize::from(story.min_height));
    }
}

#[test]
fn gallery_no_color_render_resets_every_cell_color() {
    let story = raudbjorn_tui::catalog::STORIES
        .iter()
        .find(|story| story.id == "alert/error")
        .expect("alert/error story");
    let ctx = story.context();
    let buffer = render_context_with_palette(
        story,
        &ctx,
        support::profile(ColorProfile::NoColor, GlyphProfile::Unicode),
        (60, 5),
        DARK,
    );

    assert!(buffer.content.iter().all(|cell| {
        cell.fg == Color::Reset && cell.bg == Color::Reset && cell.underline_color == Color::Reset
    }));
}
