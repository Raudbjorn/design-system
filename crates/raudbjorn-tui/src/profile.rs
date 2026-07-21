use std::env;

use ratatui::{
    buffer::{Buffer, CellDiffOption},
    layout::Rect,
    style::Color,
};
use thiserror::Error;
use unicode_width::UnicodeWidthStr;

use crate::theme::TerminalPalette;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorProfile {
    TrueColor,
    Ansi256,
    Ansi16,
    Ansi8,
    Mono,
    NoColor,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GlyphProfile {
    Unicode,
    Ascii,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TerminalProfile {
    pub color: ColorProfile,
    pub glyphs: GlyphProfile,
}

#[derive(Debug, Error, PartialEq, Eq)]
pub enum ProfileError {
    #[error("invalid {key} value: {value}")]
    InvalidValue { key: &'static str, value: String },
}

const ANSI16: [(Color, (u8, u8, u8)); 16] = [
    (Color::Black, (0, 0, 0)),
    (Color::Red, (128, 0, 0)),
    (Color::Green, (0, 128, 0)),
    (Color::Yellow, (128, 128, 0)),
    (Color::Blue, (0, 0, 128)),
    (Color::Magenta, (128, 0, 128)),
    (Color::Cyan, (0, 128, 128)),
    (Color::Gray, (192, 192, 192)),
    (Color::DarkGray, (128, 128, 128)),
    (Color::LightRed, (255, 0, 0)),
    (Color::LightGreen, (0, 255, 0)),
    (Color::LightYellow, (255, 255, 0)),
    (Color::LightBlue, (0, 0, 255)),
    (Color::LightMagenta, (255, 0, 255)),
    (Color::LightCyan, (0, 255, 255)),
    (Color::White, (255, 255, 255)),
];

const XTERM_LEVELS: [u8; 6] = [0, 95, 135, 175, 215, 255];

impl TerminalProfile {
    pub const fn new(color: ColorProfile, glyphs: GlyphProfile) -> Self {
        Self { color, glyphs }
    }

    pub fn from_env() -> Result<Self, ProfileError> {
        let color =
            env::var_os("RAUDBJORN_TUI_COLOR").map(|value| value.to_string_lossy().into_owned());
        let glyphs =
            env::var_os("RAUDBJORN_TUI_GLYPHS").map(|value| value.to_string_lossy().into_owned());
        let no_color = env::var_os("NO_COLOR").map(|value| value.to_string_lossy().into_owned());

        parse_profile_values(color.as_deref(), glyphs.as_deref(), no_color.as_deref())
    }
}

fn parse_profile_values(
    color: Option<&str>,
    glyphs: Option<&str>,
    no_color: Option<&str>,
) -> Result<TerminalProfile, ProfileError> {
    let color = match color.filter(|value| !value.is_empty()) {
        Some("truecolor") => ColorProfile::TrueColor,
        Some("ansi256") => ColorProfile::Ansi256,
        Some("ansi16") => ColorProfile::Ansi16,
        Some("ansi8") => ColorProfile::Ansi8,
        Some("mono") => ColorProfile::Mono,
        Some("no-color") => ColorProfile::NoColor,
        Some(value) => {
            return Err(ProfileError::InvalidValue {
                key: "RAUDBJORN_TUI_COLOR",
                value: value.to_owned(),
            });
        }
        None if no_color.is_some_and(|value| !value.is_empty()) => ColorProfile::NoColor,
        None => ColorProfile::TrueColor,
    };

    let glyphs = match glyphs.filter(|value| !value.is_empty()) {
        Some("unicode") => GlyphProfile::Unicode,
        Some("ascii") => GlyphProfile::Ascii,
        Some(value) => {
            return Err(ProfileError::InvalidValue {
                key: "RAUDBJORN_TUI_GLYPHS",
                value: value.to_owned(),
            });
        }
        None => GlyphProfile::Unicode,
    };

    Ok(TerminalProfile::new(color, glyphs))
}

pub fn resolve_palette(palette: TerminalPalette, profile: ColorProfile) -> TerminalPalette {
    TerminalPalette {
        bg: quantize_color(palette.bg, profile),
        surface_1: quantize_color(palette.surface_1, profile),
        surface_2: quantize_color(palette.surface_2, profile),
        surface_3: quantize_color(palette.surface_3, profile),
        border: quantize_color(palette.border, profile),
        text: quantize_color(palette.text, profile),
        text_strong: quantize_color(palette.text_strong, profile),
        text_muted: quantize_color(palette.text_muted, profile),
        text_faint: quantize_color(palette.text_faint, profile),
        accent: quantize_color(palette.accent, profile),
        accent_2: quantize_color(palette.accent_2, profile),
        accent_rust: quantize_color(palette.accent_rust, profile),
        mix_target: quantize_color(palette.mix_target, profile),
        success: quantize_color(palette.success, profile),
        error: quantize_color(palette.error, profile),
        warning: quantize_color(palette.warning, profile),
        syn_keyword: quantize_color(palette.syn_keyword, profile),
        syn_string: quantize_color(palette.syn_string, profile),
        syn_var: quantize_color(palette.syn_var, profile),
        syn_func: quantize_color(palette.syn_func, profile),
        syn_comment: quantize_color(palette.syn_comment, profile),
        syn_number: quantize_color(palette.syn_number, profile),
    }
}

pub fn apply_profile(buf: &mut Buffer, profile: TerminalProfile) {
    apply_profile_area(buf, buf.area, profile);
}

pub fn apply_profile_area(buf: &mut Buffer, area: Rect, profile: TerminalProfile) {
    for y in area.y..area.y.saturating_add(area.height) {
        for x in area.x..area.x.saturating_add(area.width) {
            let release_trailing = {
                let Some(cell) = buf.cell_mut((x, y)) else {
                    continue;
                };

                cell.fg = quantize_color(cell.fg, profile.color);
                cell.bg = quantize_color(cell.bg, profile.color);
                cell.underline_color = quantize_color(cell.underline_color, profile.color);

                if profile.glyphs == GlyphProfile::Ascii && !cell.symbol().is_ascii() {
                    let original_width = cell.symbol().width();
                    let fallback = ascii_fallback(cell.symbol());
                    cell.set_char(fallback);
                    cell.set_diff_option(CellDiffOption::None);
                    original_width.saturating_sub(1)
                } else {
                    0
                }
            };

            let release_end = x
                .saturating_add(release_trailing as u16)
                .min(area.right().saturating_sub(1));
            for trailing_x in x.saturating_add(1)..=release_end {
                if let Some(trailing) = buf.cell_mut((trailing_x, y)) {
                    trailing.set_diff_option(CellDiffOption::None);
                }
            }
        }
    }
}

fn quantize_color(color: Color, profile: ColorProfile) -> Color {
    match profile {
        ColorProfile::TrueColor => color,
        ColorProfile::Mono | ColorProfile::NoColor => Color::Reset,
        ColorProfile::Ansi256 => match color {
            Color::Reset | Color::Indexed(_) => color,
            Color::Rgb(r, g, b) => Color::Indexed(nearest_xterm_index((r, g, b))),
            named => named,
        },
        ColorProfile::Ansi16 => match color {
            Color::Reset => Color::Reset,
            named if named_color_rgb(named).is_some() => named,
            other => color_to_rgb(other)
                .map(|rgb| nearest_ansi_color(rgb, ANSI16.len()))
                .unwrap_or(Color::Reset),
        },
        ColorProfile::Ansi8 => match color {
            Color::Reset => Color::Reset,
            Color::Black
            | Color::Red
            | Color::Green
            | Color::Yellow
            | Color::Blue
            | Color::Magenta
            | Color::Cyan
            | Color::Gray => color,
            other => color_to_rgb(other)
                .map(|rgb| nearest_ansi_color(rgb, 8))
                .unwrap_or(Color::Reset),
        },
    }
}

fn nearest_xterm_index(rgb: (u8, u8, u8)) -> u8 {
    let mut best_index = 16;
    let mut best_distance = u32::MAX;

    for index in 16_u8..=255 {
        let candidate = indexed_color_rgb(index);
        let distance = color_distance(rgb, candidate);
        if distance < best_distance {
            best_distance = distance;
            best_index = index;
        }
    }

    best_index
}

fn nearest_ansi_color(rgb: (u8, u8, u8), count: usize) -> Color {
    let mut best_color = ANSI16[0].0;
    let mut best_distance = u32::MAX;

    for &(color, candidate) in &ANSI16[..count] {
        let distance = color_distance(rgb, candidate);
        if distance < best_distance {
            best_distance = distance;
            best_color = color;
        }
    }

    best_color
}

fn color_to_rgb(color: Color) -> Option<(u8, u8, u8)> {
    match color {
        Color::Reset => None,
        Color::Rgb(r, g, b) => Some((r, g, b)),
        Color::Indexed(index) => Some(indexed_color_rgb(index)),
        named => named_color_rgb(named),
    }
}

fn named_color_rgb(color: Color) -> Option<(u8, u8, u8)> {
    ANSI16
        .iter()
        .find_map(|&(candidate, rgb)| (candidate == color).then_some(rgb))
}

fn indexed_color_rgb(index: u8) -> (u8, u8, u8) {
    match index {
        0..=15 => ANSI16[index as usize].1,
        16..=231 => {
            let offset = index - 16;
            let r = XTERM_LEVELS[(offset / 36) as usize];
            let g = XTERM_LEVELS[((offset % 36) / 6) as usize];
            let b = XTERM_LEVELS[(offset % 6) as usize];
            (r, g, b)
        }
        232..=255 => {
            let gray = 8 + 10 * (index - 232);
            (gray, gray, gray)
        }
    }
}

fn color_distance(left: (u8, u8, u8), right: (u8, u8, u8)) -> u32 {
    let red = i32::from(left.0) - i32::from(right.0);
    let green = i32::from(left.1) - i32::from(right.1);
    let blue = i32::from(left.2) - i32::from(right.2);
    (red * red + green * green + blue * blue) as u32
}

fn ascii_fallback(symbol: &str) -> char {
    if let Some(ascii) = symbol
        .chars()
        .find(|character| character.is_ascii_graphic())
    {
        return ascii;
    }

    match symbol {
        "─" | "━" | "╌" | "╍" | "┄" | "┅" | "┈" | "┉" | "═" => '-',
        "│" | "┃" | "╎" | "╏" | "┆" | "┇" | "┊" | "┋" | "║" => '|',
        "✅" | "✓" | "✔" => '+',
        "⚠" | "⚠️" => '!',
        "❌" | "✘" | "✖" => 'x',
        "→" | "↗" | "⇒" => '>',
        "←" | "↙" | "⇐" => '<',
        "↑" | "⇑" => '^',
        "↓" | "⇓" => 'v',
        _ => {
            let first = symbol.chars().next().unwrap_or('?');
            match first {
                '\u{2500}'..='\u{257f}' => '+',
                '\u{2580}'..='\u{259f}' => '#',
                '\u{2800}'..='\u{28ff}' => '*',
                '\u{4e00}'..='\u{9fff}' | '\u{e000}'..='\u{f8ff}' => '?',
                _ if symbol.contains('\u{200d}') || is_emoji(first) => '*',
                _ => '?',
            }
        }
    }
}

fn is_emoji(character: char) -> bool {
    matches!(
        character,
        '\u{1f000}'..='\u{1faff}' | '\u{2600}'..='\u{27bf}'
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn profile_env_defaults_and_empty_values() {
        assert_eq!(
            parse_profile_values(None, None, None).unwrap(),
            TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode)
        );
        assert_eq!(
            parse_profile_values(Some(""), Some(""), Some("")).unwrap(),
            TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode)
        );
        assert_eq!(
            parse_profile_values(None, None, Some("1")).unwrap().color,
            ColorProfile::NoColor
        );
    }

    #[test]
    fn profile_env_accepts_only_documented_values() {
        let colors = [
            ("truecolor", ColorProfile::TrueColor),
            ("ansi256", ColorProfile::Ansi256),
            ("ansi16", ColorProfile::Ansi16),
            ("ansi8", ColorProfile::Ansi8),
            ("mono", ColorProfile::Mono),
            ("no-color", ColorProfile::NoColor),
        ];
        for (value, expected) in colors {
            assert_eq!(
                parse_profile_values(Some(value), None, Some("1"))
                    .unwrap()
                    .color,
                expected
            );
        }

        assert_eq!(
            parse_profile_values(None, Some("ascii"), None)
                .unwrap()
                .glyphs,
            GlyphProfile::Ascii
        );
        assert_eq!(
            parse_profile_values(None, Some("unicode"), None)
                .unwrap()
                .glyphs,
            GlyphProfile::Unicode
        );
    }

    #[test]
    fn profile_env_rejects_invalid_non_empty_values() {
        assert_eq!(
            parse_profile_values(Some("24bit"), None, None),
            Err(ProfileError::InvalidValue {
                key: "RAUDBJORN_TUI_COLOR",
                value: "24bit".to_owned(),
            })
        );
        assert_eq!(
            parse_profile_values(None, Some("none"), None),
            Err(ProfileError::InvalidValue {
                key: "RAUDBJORN_TUI_GLYPHS",
                value: "none".to_owned(),
            })
        );
    }

    #[test]
    fn profile_resolves_every_palette_field() {
        let resolved = resolve_palette(crate::theme::DARK, ColorProfile::NoColor);
        assert!(
            [
                resolved.bg,
                resolved.surface_1,
                resolved.surface_2,
                resolved.surface_3,
                resolved.border,
                resolved.text,
                resolved.text_strong,
                resolved.text_muted,
                resolved.text_faint,
                resolved.accent,
                resolved.accent_2,
                resolved.accent_rust,
                resolved.mix_target,
                resolved.success,
                resolved.error,
                resolved.warning,
                resolved.syn_keyword,
                resolved.syn_string,
                resolved.syn_var,
                resolved.syn_func,
                resolved.syn_comment,
                resolved.syn_number,
            ]
            .into_iter()
            .all(|color| color == Color::Reset)
        );
    }
}
