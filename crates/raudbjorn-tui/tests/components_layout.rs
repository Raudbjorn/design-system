use raudbjorn_tui::catalog::STORIES;
use raudbjorn_tui::profile::{ColorProfile, GlyphProfile};
use support::{profile, render_story};

mod support;

fn buf_text(buf: &ratatui::buffer::Buffer) -> String {
    let area = buf.area;
    let mut s = String::new();
    for y in area.top()..area.bottom() {
        for x in area.left()..area.right() {
            s.push_str(buf[(x, y)].symbol());
        }
        s.push('\n');
    }
    s
}

// ───────── Stack ─────────

#[test]
fn layout_stack_column() {
    let story = STORIES.iter().find(|s| s.id == "stack/column").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("jellyfin"));
    assert!(text.contains("sonarr"));
    assert!(text.contains("radarr"));
}

#[test]
fn layout_stack_row() {
    let story = STORIES.iter().find(|s| s.id == "stack/row").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("jellyfin"));
    assert!(text.contains("sonarr"));
}

#[test]
fn layout_stack_wrap() {
    let story = STORIES.iter().find(|s| s.id == "stack/wrap").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("cell A"));
    assert!(text.contains("cell F"));
}

// ───────── Card ─────────

#[test]
fn layout_card_basic() {
    let story = STORIES.iter().find(|s| s.id == "card/basic").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("jellyfin"));
    assert!(text.contains("Port 8096"));
}

#[test]
fn layout_card_header_footer() {
    let story = STORIES
        .iter()
        .find(|s| s.id == "card/header-footer")
        .unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("═══"));
    assert!(text.contains("footer"));
}

#[test]
fn layout_card_emphasis() {
    let story = STORIES.iter().find(|s| s.id == "card/emphasis").unwrap();
    let buffer = render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    );
    let text = buf_text(&buffer);
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("jellyfin"));
    assert!(!text.contains("*jellyfin*"));
    assert!(text.contains("slow"));
    let title = buffer
        .content()
        .iter()
        .find(|cell| cell.symbol() == "j")
        .expect("card title must render");
    assert!(
        title
            .modifier
            .contains(ratatui::style::Modifier::BOLD | ratatui::style::Modifier::UNDERLINED)
    );
}

#[test]
fn layout_card_dense() {
    let story = STORIES.iter().find(|s| s.id == "card/dense").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("jellyfin"));
}

// ───────── NavBar ─────────

#[test]
fn layout_nav_bar_default() {
    let story = STORIES.iter().find(|s| s.id == "nav-bar/default").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("Raudbjorn"));
    assert!(text.contains("[Menu]"));
}

#[test]
fn layout_nav_bar_narrow() {
    let story = STORIES.iter().find(|s| s.id == "nav-bar/narrow").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(!text.contains("Raudbjorn"));
    assert!(text.contains("[Menu]"));
}

// ───────── Breadcrumb ─────────

#[test]
fn layout_breadcrumb_default() {
    let story = STORIES
        .iter()
        .find(|s| s.id == "breadcrumb/default")
        .unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("›"));
}

#[test]
fn layout_breadcrumb_truncated() {
    let story = STORIES
        .iter()
        .find(|s| s.id == "breadcrumb/truncated")
        .unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    // Handle Ascii fallback map
    assert!(text.contains("…") || text.contains("?") || text.contains("..."));
}

// ───────── Tabs ─────────

#[test]
fn layout_tabs_first_active() {
    let story = STORIES
        .iter()
        .find(|s| s.id == "tabs/first-active")
        .unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("[Overview]"));
}

#[test]
fn layout_tabs_second_active() {
    let story = STORIES
        .iter()
        .find(|s| s.id == "tabs/second-active")
        .unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("[Services]"));
}

#[test]
fn layout_tabs_narrow() {
    let story = STORIES.iter().find(|s| s.id == "tabs/narrow").unwrap();
    let text = buf_text(&render_story(
        story,
        profile(ColorProfile::TrueColor, GlyphProfile::Unicode),
        (story.min_width, story.min_height),
    ));
    assert!(!text.contains("[WARN]"));
    assert!(text.contains("…") || text.contains("?") || text.contains("..."));
}
