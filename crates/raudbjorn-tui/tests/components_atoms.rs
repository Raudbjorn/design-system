use ratatui::Terminal;
use ratatui::backend::TestBackend;
use ratatui::buffer::Buffer;
use ratatui::style::Modifier;
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
    let ctx = story.context();
    let backend = TestBackend::new(size.0, size.1);
    let mut terminal = Terminal::new(backend).unwrap();
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

fn assert_no_warn(buf: &Buffer, label: &str) {
    let content = buffer_text(buf);
    assert!(!content.contains("[WARN]"), "[WARN] in {label}: {content}");
}

#[test]
fn test_text_variants() {
    let variants = [
        "text/default",
        "text/strong",
        "text/muted",
        "text/faint",
        "text/mono",
    ];
    let mut buffers = Vec::new();
    let mut results = Vec::new();
    for variant in variants {
        let buffer = render_story(variant, (24, 1));
        assert_no_warn(&buffer, variant);
        results.push(buffer_text(&buffer));
        buffers.push(buffer);
    }

    for (variant, result) in variants.iter().zip(&results) {
        assert!(
            result.contains("Homelab services"),
            "Text variant {variant} missing fixture label"
        );
        assert!(
            !result.contains('*') && !result.contains('`'),
            "Text variant {variant} must not expose Markdown syntax: {result:?}"
        );
    }

    assert!(!results[0].contains('~') && !results[0].contains('…'));
    assert!(!results[1].contains('~') && !results[1].contains('…'));
    assert!(results[2].contains('~'), "text/muted should end with ~");
    assert!(results[3].contains('…'), "text/faint should end with …");
    assert_eq!(
        results[0], results[4],
        "a terminal is already monospaced; mono must not add syntax"
    );

    let first_modifier = |buffer: &Buffer| {
        buffer
            .content()
            .iter()
            .find(|cell| !cell.symbol().trim().is_empty())
            .map(|cell| cell.modifier)
            .expect("text story must render a visible cell")
    };
    assert!(first_modifier(&buffers[1]).contains(Modifier::BOLD));
    assert!(first_modifier(&buffers[2]).contains(Modifier::DIM));
    assert!(first_modifier(&buffers[3]).contains(Modifier::DIM | Modifier::ITALIC));
}

#[test]
fn text_muted_and_faint_use_distinct_foregrounds() {
    let muted = render_story("text/muted", (24, 1));
    let faint = render_story("text/faint", (24, 1));
    let first_foreground = |buffer: &Buffer| {
        buffer
            .content()
            .iter()
            .find(|cell| !cell.symbol().trim().is_empty())
            .map(|cell| cell.fg)
            .expect("text story must render a visible cell")
    };

    assert_ne!(first_foreground(&muted), first_foreground(&faint));
}

#[test]
fn test_heading_variants() {
    let variants = vec![
        "heading/level-1",
        "heading/level-2",
        "heading/level-3",
        "heading/level-4",
    ];
    let mut results = Vec::new();
    let mut buffers = Vec::new();
    for v in &variants {
        let buf = render_story(v, (24, 2));
        assert_no_warn(&buf, v);
        results.push(buffer_text(&buf));
        buffers.push(buf);
    }
    for i in 0..results.len() {
        for j in i + 1..results.len() {
            assert_ne!(
                results[i], results[j],
                "Heading variants {} and {} byte-identical",
                variants[i], variants[j]
            );
        }
    }
    for (index, result) in results.iter().enumerate() {
        assert!(
            result.starts_with("Service dashboard"),
            "{} must render terminal-native heading text without Markdown markers: {result:?}",
            variants[index]
        );
        assert!(
            !result.contains('#'),
            "{} must not expose Markdown heading syntax: {result:?}",
            variants[index]
        );
    }
    assert!(results[0].contains("level 1"));
    assert!(results[1].contains("level 2"));
    assert!(results[2].contains("level 3"));
    assert!(results[3].contains("level 4"));

    let modifiers: Vec<_> = buffers
        .iter()
        .map(|buffer| buffer[(0, 0)].modifier)
        .collect();
    assert!(modifiers[0].contains(Modifier::BOLD | Modifier::UNDERLINED));
    assert!(modifiers[1].contains(Modifier::BOLD | Modifier::UNDERLINED));
    assert!(modifiers[2].contains(Modifier::BOLD));
    assert!(!modifiers[2].contains(Modifier::UNDERLINED));
    assert!(!modifiers[3].intersects(Modifier::BOLD | Modifier::UNDERLINED));
}

#[test]
fn test_icon_variants() {
    let buf_u = render_story("icon/unicode", (20, 1));
    let buf_a = render_story("icon/ascii", (20, 1));
    assert_no_warn(&buf_u, "icon/unicode");
    assert_no_warn(&buf_a, "icon/ascii");
    let c_u = buffer_text(&buf_u);
    let c_a = buffer_text(&buf_a);
    assert!(c_u.contains('●'));
    assert!(c_a.contains('*'));
    assert_ne!(c_u, c_a);
}

#[test]
fn test_kbd_variants() {
    let buf_s = render_story("kbd/single", (20, 1));
    let buf_c = render_story("kbd/chord", (20, 1));
    assert_no_warn(&buf_s, "kbd/single");
    assert_no_warn(&buf_c, "kbd/chord");
    let c_s = buffer_text(&buf_s);
    let c_c = buffer_text(&buf_c);
    assert!(c_s.contains("[Esc]"));
    assert!(c_c.contains("[Ctrl]+[P]"));
    assert_ne!(c_s, c_c);
}

#[test]
fn test_badge_variants() {
    let variants = vec![
        "badge/neutral",
        "badge/accent",
        "badge/success",
        "badge/warning",
        "badge/error",
    ];
    let expected = vec!["[IDLE]", "[ACTIVE]", "[SUCCESS]", "[WARNING]", "[ERROR]"];
    let mut results = Vec::new();
    for (i, v) in variants.iter().enumerate() {
        let buf = render_story(v, (20, 1));
        assert_no_warn(&buf, v);
        let content = buffer_text(&buf);
        assert!(
            content.contains(expected[i]),
            "badge variant {} missing label {}",
            v,
            expected[i]
        );
        results.push(content);
    }
    use std::collections::HashSet;
    let set: HashSet<_> = results.into_iter().collect();
    assert_eq!(set.len(), 5, "badge variants not pairwise distinct");
}

#[test]
fn test_avatar_variants() {
    let buf_i = render_story("avatar/initials", (20, 3));
    let buf_f = render_story("avatar/image-fallback", (20, 3));
    assert_no_warn(&buf_i, "avatar/initials");
    assert_no_warn(&buf_f, "avatar/image-fallback");
    let c_i = buffer_text(&buf_i);
    let c_f = buffer_text(&buf_f);
    assert!(c_i.contains("SV"));
    assert!(c_f.contains("(no-image)"));
    assert_ne!(c_i, c_f);
}

#[test]
fn test_spinner_variants() {
    let variants = vec!["spinner/frozen", "spinner/animated", "spinner/ascii"];
    let mut results = Vec::new();
    for v in &variants {
        let buf = render_story(v, (24, 1));
        assert_no_warn(&buf, v);
        results.push(buffer_text(&buf));
    }
    assert!(
        results[0].trim_end().ends_with('-'),
        "spinner/frozen should end with - marker"
    );
    assert!(
        results[1].trim_end().ends_with('~'),
        "spinner/animated should end with ~ marker"
    );
    assert!(
        results[2].contains('|'),
        "spinner/ascii should show | symbol"
    );
    use std::collections::HashSet;
    let set: HashSet<_> = results.into_iter().collect();
    assert_eq!(set.len(), 3, "spinner variants not pairwise distinct");
}

#[test]
fn test_progress_variants() {
    let variants = vec![
        "progress/determinate",
        "progress/indeterminate",
        "progress/complete",
        "progress/error",
    ];
    let prefixes = vec!["Progress:", "Working:", "Done:", "Error:"];
    let state_labels = ["", "Working", "Complete", "Error"];
    for (i, v) in variants.iter().enumerate() {
        let buf = render_story(v, (40, 3));
        assert_no_warn(&buf, v);
        let content = buffer_text(&buf);
        assert!(
            content.contains(prefixes[i]),
            "progress variant {} missing prefix {}",
            v,
            prefixes[i]
        );
        // Row 2 (cells 80..120) holds the state label — the gap row is 40..80.
        let row2: String = buf.content()[80..120].iter().map(|c| c.symbol()).collect();
        if i > 0 {
            assert!(
                !row2.trim().is_empty(),
                "Progress variant {} should have a state label on row 2",
                v
            );
            assert!(
                row2.contains(state_labels[i]),
                "Progress variant {} should contain state label '{}'",
                v,
                state_labels[i]
            );
        }
    }
    let mut buffers = Vec::new();
    for v in &variants {
        let buf = render_story(v, (40, 3));
        buffers.push(buffer_text(&buf));
    }
    use std::collections::HashSet;
    let set: HashSet<_> = buffers.into_iter().collect();
    assert_eq!(set.len(), 4, "progress variants not pairwise distinct");
}
