#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TerminalPalette {
    pub bg: Color,
    pub surface_1: Color,
    pub surface_2: Color,
    pub surface_3: Color,
    pub border: Color,
    pub text: Color,
    pub text_strong: Color,
    pub text_muted: Color,
    pub text_faint: Color,
    pub accent: Color,
    pub accent_2: Color,
    pub accent_rust: Color,
    pub mix_target: Color,
    pub success: Color,
    pub error: Color,
    pub warning: Color,
    pub syn_keyword: Color,
    pub syn_string: Color,
    pub syn_var: Color,
    pub syn_func: Color,
    pub syn_comment: Color,
    pub syn_number: Color,
}

include!("generated.rs");

impl TerminalPalette {
    fn sentinel_to_role(&self, rgb: (u8, u8, u8)) -> Option<Color> {
        match rgb {
            (170, 0, 0) => Some(self.bg),
            (170, 0, 1) => Some(self.surface_1),
            (170, 0, 2) => Some(self.surface_2),
            (170, 0, 3) => Some(self.surface_3),
            (170, 0, 4) => Some(self.border),
            (170, 0, 5) => Some(self.text),
            (170, 0, 6) => Some(self.text_strong),
            (170, 0, 7) => Some(self.text_muted),
            (170, 0, 8) => Some(self.text_faint),
            (170, 0, 9) => Some(self.accent),
            (170, 0, 10) => Some(self.accent_2),
            (170, 0, 11) => Some(self.accent_rust),
            (170, 0, 12) => Some(self.mix_target),
            (170, 0, 13) => Some(self.success),
            (170, 0, 14) => Some(self.error),
            (170, 0, 15) => Some(self.warning),
            (170, 0, 16) => Some(self.syn_keyword),
            (170, 0, 17) => Some(self.syn_string),
            (170, 0, 18) => Some(self.syn_var),
            (170, 0, 19) => Some(self.syn_func),
            (170, 0, 20) => Some(self.syn_comment),
            (170, 0, 21) => Some(self.syn_number),
            _ => None,
        }
    }

    pub(crate) fn get_semantic_color(&self, marker: Color) -> Color {
        match marker {
            Color::Rgb(r, g, b) => self.sentinel_to_role((r, g, b)).unwrap_or(marker),
            _ => marker,
        }
    }
}
