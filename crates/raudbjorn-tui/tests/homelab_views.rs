use crepuscularity_tui::TemplateValue;
use crossterm::event::{Event, KeyCode, KeyEvent, KeyModifiers};
use ratatui::Terminal;
use ratatui::backend::TestBackend;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use raudbjorn_tui::catalog::STORIES;
use raudbjorn_tui::catalog::fixtures;
use raudbjorn_tui::catalog::handlers;
use raudbjorn_tui::component::{ComponentRenderer, TemplateStore};
use raudbjorn_tui::profile::{ColorProfile, GlyphProfile, TerminalProfile};
use raudbjorn_tui::theme::DARK;
use std::sync::Arc;

fn render_story_with_extras(
    renderer: &ComponentRenderer,
    story: &raudbjorn_tui::catalog::StorySpec,
    w: u16,
    h: u16,
    extras: &[(&str, TemplateValue)],
) -> Buffer {
    let profile = TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode);
    let area = Rect::new(0, 0, w, h);
    let mut terminal = Terminal::new(TestBackend::new(w, h)).unwrap();
    let mut ctx = (story.fixture)();
    for (k, v) in extras {
        ctx.set(*k, v.clone());
    }
    terminal
        .draw(|frame| {
            renderer
                .render(story.source, &ctx, DARK, profile, frame, area)
                .unwrap();
        })
        .unwrap();
    terminal.backend().buffer().clone()
}

fn render_story(
    renderer: &ComponentRenderer,
    story: &raudbjorn_tui::catalog::StorySpec,
    w: u16,
    h: u16,
) -> Buffer {
    render_story_with_extras(renderer, story, w, h, &[])
}

fn buffer_text(buf: &Buffer) -> String {
    buf.content().iter().map(|c| c.symbol()).collect()
}

fn normalized_text(buf: &Buffer) -> String {
    buffer_text(buf)
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[test]
fn catalog_ids_match_12_composite() {
    let composites = STORIES
        .iter()
        .filter(|s| s.id.starts_with("pane/") || s.id.starts_with("view/"))
        .count();
    assert_eq!(
        composites, 12,
        "Should have 12 composite stories (6 panes + 6 views)"
    );
}

#[test]
fn panes_render_without_warn_at_min_size() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let panes = STORIES.iter().filter(|s| s.id.starts_with("pane/"));
    for story in panes {
        let buf = render_story(&renderer, story, story.min_width, story.min_height);
        assert!(
            !buffer_text(&buf).contains("[WARN]"),
            "Pane {} rendered with [WARN] at {}x{}",
            story.id,
            story.min_width,
            story.min_height
        );
    }
}

#[test]
fn service_table_pane_owns_one_border_and_keeps_its_title_when_empty() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let story = STORIES
        .iter()
        .find(|story| story.id == "pane/service-table")
        .unwrap();

    for buffer in [
        render_story(&renderer, story, 60, 8),
        render_story_with_extras(
            &renderer,
            story,
            60,
            8,
            &[("empty", TemplateValue::Bool(true))],
        ),
    ] {
        let text = normalized_text(&buffer);
        assert!(text.contains("Services"), "pane title is missing: {text}");

        let area = buffer.area;
        let corners = ["┌", "┐", "└", "┘", "╭", "╮", "╰", "╯"];
        for (x, y) in [
            (area.left(), area.top()),
            (area.right() - 1, area.top()),
            (area.left(), area.bottom() - 1),
            (area.right() - 1, area.bottom() - 1),
        ] {
            assert!(
                corners.contains(&buffer[(x, y)].symbol()),
                "missing pane border corner at ({x},{y})"
            );
        }
        for y in area.top()..area.bottom() {
            for x in area.left()..area.right() {
                let is_outer_corner = (x == area.left() || x == area.right() - 1)
                    && (y == area.top() || y == area.bottom() - 1);
                assert!(
                    is_outer_corner || !corners.contains(&buffer[(x, y)].symbol()),
                    "nested border corner at ({x},{y})"
                );
            }
        }
    }
}

#[test]
fn view_minimum_size_renders_exact_fallback() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let story = STORIES
        .iter()
        .find(|s| s.id == "view/minimum-size")
        .unwrap();
    let buf = render_story(&renderer, story, 40, 12);
    let normalized = normalized_text(&buf);
    assert!(
        normalized.contains("Terminal too small requires 80×24, current 40×12"),
        "Fallback mismatch: '{}'",
        normalized
    );
}

#[test]
fn full_view_subthreshold_inherits_viewport_dimensions() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let story = STORIES
        .iter()
        .find(|story| story.id == "view/homelab-healthy")
        .unwrap();
    let buffer = render_story(&renderer, story, 40, 12);

    assert!(normalized_text(&buffer).contains("Terminal too small requires 80×24, current 40×12"));
}

#[test]
fn view_states_no_warn_at_every_viewport() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let view_ids = [
        "view/homelab-healthy",
        "view/homelab-degraded",
        "view/homelab-loading",
        "view/homelab-empty",
        "view/homelab-error",
        "view/minimum-size",
    ];
    let viewports = [(80u16, 24u16), (90, 30), (120, 30), (160, 50)];

    for id in view_ids {
        let story = STORIES.iter().find(|s| s.id == id).unwrap();
        for (w, h) in viewports {
            let buf = render_story(&renderer, story, w, h);
            let text = buffer_text(&buf);
            assert!(
                !text.contains("[WARN]"),
                "View {} rendered with [WARN] at {}x{}\nText: {}",
                id,
                w,
                h,
                text
            );
            match id {
                "view/homelab-loading" => {
                    assert!(
                        text.contains("Loading"),
                        "loading view {}x{} text: {}",
                        w,
                        h,
                        text
                    );
                }
                "view/homelab-error" => {
                    assert!(
                        text.contains("Homelab unreachable"),
                        "error view {}x{} text: {}",
                        w,
                        h,
                        text
                    );
                }
                "view/homelab-empty" => {
                    assert!(
                        text.contains("No services configured"),
                        "empty view {}x{} text: {}",
                        w,
                        h,
                        text
                    );
                    assert!(
                        !text.contains("NAME STATUS UPTIME"),
                        "empty view {}x{} should not show header",
                        w,
                        h
                    );
                }
                "view/homelab-healthy" => {
                    assert!(
                        text.contains("NAME STATUS UPTIME"),
                        "healthy {}x{} missing header | text:\n{}",
                        w,
                        h,
                        text
                    );
                    assert!(
                        text.contains("Journal"),
                        "healthy {}x{} missing Journal | text:\n{}",
                        w,
                        h,
                        text
                    );
                }
                "view/minimum-size" => {
                    let normalized = normalized_text(&buf);
                    assert!(
                        normalized.contains("Terminal too small requires 80×24, current"),
                        "min {}x{} text: {}",
                        w,
                        h,
                        normalized
                    );
                }
                _ => {}
            }
        }
    }
}

#[test]
fn view_states_pairwise_distinct() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let view_ids = [
        "view/homelab-healthy",
        "view/homelab-degraded",
        "view/homelab-loading",
        "view/homelab-empty",
        "view/homelab-error",
    ];
    let mut distinct_texts = std::collections::HashSet::new();

    for id in view_ids {
        let story = STORIES.iter().find(|s| s.id == id).unwrap();
        let buf = render_story(&renderer, story, 120, 30);
        distinct_texts.insert(normalized_text(&buf));
    }
    assert_eq!(
        distinct_texts.len(),
        5,
        "State views at 120x30 must be pairwise distinct"
    );
}

#[test]
fn view_at_160_keeps_content_inside_w_120() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let story = STORIES
        .iter()
        .find(|s| s.id == "view/homelab-healthy")
        .unwrap();
    let buf = render_story(&renderer, story, 160, 50);
    let text = buffer_text(&buf);
    let width = 160usize;
    for (i, cell) in buf.content().iter().enumerate() {
        if cell.symbol() == " " {
            continue;
        }
        let x = (i % width) as u16;
        let y = (i / width) as u16;
        if y >= 1 {
            assert!(
                x < 120,
                "Content found outside w=120 cap at x={}, y={} | text:\n{}",
                x,
                y,
                text
            );
        }
    }
}

#[test]
fn journal_end_resets_to_following() {
    let mut ctx = fixtures::pane_journal_pinned_fixture();
    let event = Event::Key(KeyEvent::new(KeyCode::End, KeyModifiers::NONE));
    handlers::handle_journal(&mut ctx, &event);
    assert!(matches!(ctx.get("journal_mode"), Some(TemplateValue::Str(s)) if s == "FOLLOWING"));
    assert!(matches!(ctx.get("unseen"), Some(TemplateValue::Int(0))));
}

#[test]
fn journal_up_and_pageup_pin() {
    let mut ctx = fixtures::pane_journal_fixture();
    let event_up = Event::Key(KeyEvent::new(KeyCode::Up, KeyModifiers::NONE));
    handlers::handle_journal(&mut ctx, &event_up);
    assert!(matches!(ctx.get("journal_mode"), Some(TemplateValue::Str(s)) if s == "PINNED"));

    let mut ctx2 = fixtures::pane_journal_fixture();
    let event_pageup = Event::Key(KeyEvent::new(KeyCode::PageUp, KeyModifiers::NONE));
    handlers::handle_journal(&mut ctx2, &event_pageup);
    assert!(matches!(ctx2.get("journal_mode"), Some(TemplateValue::Str(s)) if s == "PINNED"));
}

fn border_cells(buf: &Buffer, w: u16, h: u16) -> Vec<(u16, u16)> {
    let mut cells = Vec::new();
    for y in 0..h {
        for x in 0..w {
            if (x == 0 || x == w - 1 || y == 0 || y == h - 1) && buf[(x, y)].symbol() != " " {
                cells.push((x, y));
            }
        }
    }
    cells
}

#[test]
fn view_states_share_fixed_geometry() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let view_ids = [
        "view/homelab-healthy",
        "view/homelab-degraded",
        "view/homelab-loading",
        "view/homelab-empty",
        "view/homelab-error",
    ];
    let mut geometries = Vec::new();

    for id in view_ids {
        let story = STORIES.iter().find(|s| s.id == id).unwrap();
        let buf = render_story(&renderer, story, 120, 30);
        geometries.push(border_cells(&buf, 120, 30));
    }

    for (i, geom) in geometries.iter().enumerate().skip(1) {
        assert_eq!(
            geom, &geometries[0],
            "Geometry mismatch between healthy and state {}",
            view_ids[i]
        );
    }
}

#[test]
fn pane_journal_pinned_displays_unseen() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let renderer = ComponentRenderer::new(store);
    let story = STORIES
        .iter()
        .find(|s| s.id == "pane/journal-pinned")
        .unwrap();
    let buf = render_story_with_extras(
        &renderer,
        story,
        40,
        5,
        &[("unseen", TemplateValue::Int(3))],
    );
    assert!(
        buffer_text(&buf).contains("· 3 unseen"),
        "Pinned journal must display · 3 unseen | text: {}",
        buffer_text(&buf)
    );
}
