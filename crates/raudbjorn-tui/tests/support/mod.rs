use std::{
    fmt::Write as _,
    path::PathBuf,
    sync::{Arc, LazyLock},
};

use crepuscularity_tui::TemplateContext;
use ratatui::{Terminal, backend::TestBackend, buffer::Buffer, layout::Rect};
use raudbjorn_tui::{
    catalog::StorySpec,
    component::{ComponentRenderer, TemplateStore},
    profile::{ColorProfile, GlyphProfile, TerminalProfile},
    theme::{DARK, TerminalPalette},
};

static TEMPLATE_STORE: LazyLock<Arc<TemplateStore>> = LazyLock::new(|| {
    Arc::new(TemplateStore::load_embedded().expect("embedded templates must parse"))
});

#[allow(dead_code)]
pub fn render_story(story: &StorySpec, profile: TerminalProfile, size: (u16, u16)) -> Buffer {
    render_story_with_palette(story, profile, size, DARK)
}

#[allow(dead_code)]
pub fn render_story_with_palette(
    story: &StorySpec,
    profile: TerminalProfile,
    size: (u16, u16),
    palette: TerminalPalette,
) -> Buffer {
    let ctx = frozen_story_context(story);
    render_context_with_palette(story, &ctx, profile, size, palette)
}

pub fn frozen_story_context(story: &StorySpec) -> TemplateContext {
    let mut ctx = story.context();
    if story.animated {
        ctx.set("tick", 5_i64)
            .set("symbol", "◐")
            .set("value", 42_i64)
            .set("bar", "████████░░░░");
    }
    ctx
}

pub fn render_context_with_palette(
    story: &StorySpec,
    ctx: &TemplateContext,
    profile: TerminalProfile,
    size: (u16, u16),
    palette: TerminalPalette,
) -> Buffer {
    let store = Arc::clone(&TEMPLATE_STORE);
    let renderer = ComponentRenderer::new(store);
    let mut terminal = Terminal::new(TestBackend::new(size.0, size.1))
        .expect("TestBackend construction is infallible");

    terminal
        .draw(|frame| {
            renderer
                .render(
                    story.source,
                    ctx,
                    palette,
                    profile,
                    frame,
                    Rect::new(0, 0, size.0, size.1),
                )
                .unwrap_or_else(|error| panic!("{} failed to render: {error}", story.id));
        })
        .expect("TestBackend drawing is infallible");

    terminal.backend().buffer().clone()
}

#[allow(dead_code)]
pub fn serialize_buffer(buffer: &Buffer) -> String {
    let area = buffer.area;
    let mut output = format!("width={} height={}\n", area.width, area.height);
    for y in area.top()..area.bottom() {
        for x in area.left()..area.right() {
            let cell = &buffer[(x, y)];
            writeln!(
                output,
                "{x},{y}:{}|{:?}|{:?}|{:?}|{:?}",
                escape(cell.symbol()),
                cell.fg,
                cell.bg,
                cell.underline_color,
                cell.modifier
            )
            .expect("writing to String is infallible");
        }
    }
    output
}

#[allow(dead_code)]
pub fn assert_buffer_snapshot(
    story_id: &str,
    theme_name: &str,
    profile: TerminalProfile,
    size: (u16, u16),
    buffer: &Buffer,
) {
    let path = snapshot_path(story_id, theme_name, profile, size);
    let actual = serialize_buffer(buffer);

    if std::env::var_os("UPDATE_SNAPSHOTS").is_some() {
        std::fs::create_dir_all(path.parent().expect("snapshot path has a parent"))
            .expect("snapshot directory must be writable");
        std::fs::write(&path, &actual).expect("snapshot must be writable");
        return;
    }

    let expected = std::fs::read_to_string(&path).unwrap_or_else(|error| {
        panic!(
            "missing snapshot {}: {error}; regenerate explicitly with UPDATE_SNAPSHOTS=1",
            path.display()
        )
    });
    assert_eq!(actual, expected, "snapshot changed: {}", path.display());
}

pub const fn profile(color: ColorProfile, glyphs: GlyphProfile) -> TerminalProfile {
    TerminalProfile::new(color, glyphs)
}

#[allow(dead_code)]
pub fn snapshot_path(
    story_id: &str,
    theme_name: &str,
    profile: TerminalProfile,
    size: (u16, u16),
) -> PathBuf {
    let profile_name = match (profile.color, profile.glyphs) {
        (ColorProfile::TrueColor, GlyphProfile::Unicode) => "truecolor-unicode",
        (ColorProfile::TrueColor, GlyphProfile::Ascii) => "truecolor-ascii",
        (ColorProfile::Ansi256, GlyphProfile::Unicode) => "ansi256-unicode",
        (ColorProfile::Ansi256, GlyphProfile::Ascii) => "ansi256-ascii",
        (ColorProfile::Ansi16, GlyphProfile::Unicode) => "ansi16-unicode",
        (ColorProfile::Ansi16, GlyphProfile::Ascii) => "ansi16-ascii",
        (ColorProfile::Ansi8, GlyphProfile::Unicode) => "ansi8-unicode",
        (ColorProfile::Ansi8, GlyphProfile::Ascii) => "ansi8-ascii",
        (ColorProfile::Mono, GlyphProfile::Unicode) => "mono-unicode",
        (ColorProfile::Mono, GlyphProfile::Ascii) => "mono-ascii",
        (ColorProfile::NoColor, GlyphProfile::Unicode) => "no-color-unicode",
        (ColorProfile::NoColor, GlyphProfile::Ascii) => "no-color-ascii",
    };
    let file_name = format!(
        "{}__{}__{}__{}x{}.snap",
        story_id.replace('/', "__"),
        theme_name,
        profile_name,
        size.0,
        size.1
    );
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/snapshots")
        .join(file_name)
}

#[allow(dead_code)]
fn escape(symbol: &str) -> String {
    symbol
        .replace('\\', "\\\\")
        .replace('|', "\\|")
        .replace('\r', "\\r")
        .replace('\n', "\\n")
        .replace('\t', "\\t")
}
