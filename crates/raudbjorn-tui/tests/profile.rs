use ratatui::{
    buffer::{Buffer, CellDiffOption},
    layout::Rect,
    style::{Color, Modifier, Style},
};
use raudbjorn_tui::{
    profile::{ColorProfile, GlyphProfile, TerminalProfile, apply_profile, resolve_palette},
    theme::DARK,
};
use unicode_width::UnicodeWidthStr as _;

fn resolved(color: Color, profile: ColorProfile) -> Color {
    resolve_palette(
        raudbjorn_tui::theme::TerminalPalette { bg: color, ..DARK },
        profile,
    )
    .bg
}

#[test]
fn profile_quantizes_xterm_cube_and_grayscale_by_nearest_distance() {
    assert_eq!(
        resolved(Color::Rgb(255, 0, 0), ColorProfile::Ansi256),
        Color::Indexed(196)
    );
    assert_eq!(
        resolved(Color::Rgb(95, 95, 95), ColorProfile::Ansi256),
        Color::Indexed(59)
    );
    assert_eq!(
        resolved(Color::Rgb(128, 128, 128), ColorProfile::Ansi256),
        Color::Indexed(244)
    );
    assert_eq!(
        resolved(Color::Rgb(8, 8, 8), ColorProfile::Ansi256),
        Color::Indexed(232)
    );
}

#[test]
fn profile_quantizes_to_nearest_ansi_sixteen_and_eight() {
    assert_eq!(
        resolved(Color::Rgb(255, 0, 0), ColorProfile::Ansi16),
        Color::LightRed
    );
    assert_eq!(
        resolved(Color::Rgb(128, 0, 0), ColorProfile::Ansi16),
        Color::Red
    );
    assert_eq!(
        resolved(Color::Rgb(255, 0, 0), ColorProfile::Ansi8),
        Color::Red
    );
    assert_eq!(
        resolved(Color::Rgb(0, 255, 255), ColorProfile::Ansi8),
        Color::Cyan
    );
    assert_eq!(
        resolved(Color::Indexed(196), ColorProfile::Ansi16),
        Color::LightRed
    );
    assert_eq!(
        resolved(Color::Indexed(196), ColorProfile::Ansi8),
        Color::Red
    );
}

#[test]
fn profile_handles_every_named_ratatui_color() {
    let named = [
        Color::Reset,
        Color::Black,
        Color::Red,
        Color::Green,
        Color::Yellow,
        Color::Blue,
        Color::Magenta,
        Color::Cyan,
        Color::Gray,
        Color::DarkGray,
        Color::LightRed,
        Color::LightGreen,
        Color::LightYellow,
        Color::LightBlue,
        Color::LightMagenta,
        Color::LightCyan,
        Color::White,
    ];

    for color in named {
        assert_eq!(resolved(color, ColorProfile::TrueColor), color);
        assert_eq!(resolved(color, ColorProfile::Ansi256), color);
        assert!(matches!(
            resolved(color, ColorProfile::Ansi16),
            Color::Reset
                | Color::Black
                | Color::Red
                | Color::Green
                | Color::Yellow
                | Color::Blue
                | Color::Magenta
                | Color::Cyan
                | Color::Gray
                | Color::DarkGray
                | Color::LightRed
                | Color::LightGreen
                | Color::LightYellow
                | Color::LightBlue
                | Color::LightMagenta
                | Color::LightCyan
                | Color::White
        ));
        assert!(matches!(
            resolved(color, ColorProfile::Ansi8),
            Color::Reset
                | Color::Black
                | Color::Red
                | Color::Green
                | Color::Yellow
                | Color::Blue
                | Color::Magenta
                | Color::Cyan
                | Color::Gray
        ));
    }
}

#[test]
fn profile_apply_transforms_colors_at_nonzero_origin_and_keeps_modifiers() {
    let area = Rect::new(5, 7, 1, 1);
    let mut buffer = Buffer::empty(area);
    buffer[(5, 7)].set_symbol("✓").set_style(
        Style::default()
            .fg(Color::Rgb(255, 0, 0))
            .bg(Color::Rgb(0, 0, 255))
            .underline_color(Color::Rgb(0, 255, 0))
            .add_modifier(Modifier::BOLD | Modifier::REVERSED),
    );

    apply_profile(
        &mut buffer,
        TerminalProfile::new(ColorProfile::Ansi16, GlyphProfile::Unicode),
    );

    let cell = &buffer[(5, 7)];
    assert_eq!(cell.fg, Color::LightRed);
    assert_eq!(cell.bg, Color::LightBlue);
    assert_eq!(cell.underline_color, Color::LightGreen);
    assert_eq!(cell.symbol(), "✓");
    assert!(cell.modifier.contains(Modifier::BOLD | Modifier::REVERSED));
}

#[test]
fn profile_ascii_fallbacks_are_one_column_for_unicode_corpus() {
    let corpus = [
        ("A", "A"),
        ("─", "-"),
        ("│", "|"),
        ("╭", "+"),
        ("═", "-"),
        ("║", "|"),
        ("⣿", "*"),
        ("e\u{301}", "e"),
        ("界", "?"),
        ("✅", "+"),
        ("👩\u{200d}💻", "*"),
        ("\u{e0b0}", "?"),
    ];

    for (input, expected) in corpus {
        let mut buffer = Buffer::empty(Rect::new(0, 0, 1, 1));
        buffer[(0, 0)].set_symbol(input);
        apply_profile(
            &mut buffer,
            TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Ascii),
        );
        let actual = buffer[(0, 0)].symbol();
        assert_eq!(actual, expected, "fallback for {input:?}");
        assert_eq!(actual.width(), 1, "width for {input:?}");
    }
}

#[test]
fn profile_ascii_releases_a_wide_glyph_trailing_cell() {
    let mut buffer = Buffer::empty(Rect::new(0, 0, 2, 1));
    buffer[(0, 0)].set_symbol("界");
    buffer[(1, 0)].set_diff_option(CellDiffOption::Skip);
    assert_eq!(buffer[(1, 0)].diff_option, CellDiffOption::Skip);

    apply_profile(
        &mut buffer,
        TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Ascii),
    );

    assert_eq!(buffer[(0, 0)].symbol(), "?");
    assert_eq!(
        buffer[(1, 0)].diff_option,
        CellDiffOption::None,
        "one-column fallback must release the old wide trailing cell"
    );
}
#[test]
fn profile_no_color_preserves_non_color_status_and_focus_distinctions() {
    let mut buffer = Buffer::empty(Rect::new(0, 0, 2, 1));
    buffer[(0, 0)].set_symbol("✅").set_style(
        Style::default()
            .fg(Color::Green)
            .add_modifier(Modifier::BOLD),
    );
    buffer[(1, 0)].set_symbol("⚠").set_style(
        Style::default()
            .fg(Color::Yellow)
            .add_modifier(Modifier::REVERSED),
    );

    apply_profile(
        &mut buffer,
        TerminalProfile::new(ColorProfile::NoColor, GlyphProfile::Ascii),
    );

    assert_eq!(buffer[(0, 0)].symbol(), "+");
    assert_eq!(buffer[(1, 0)].symbol(), "!");
    assert_eq!(buffer[(0, 0)].fg, Color::Reset);
    assert_eq!(buffer[(1, 0)].fg, Color::Reset);
    assert!(buffer[(0, 0)].modifier.contains(Modifier::BOLD));
    assert!(buffer[(1, 0)].modifier.contains(Modifier::REVERSED));
}
