use crate::profile::{TerminalProfile, apply_profile_area};
use crate::theme::TerminalPalette;
use crepuscularity_tui::{
    CrepusError, TemplateContext, TemplateValue, parse_component_file, render_component,
};
use ratatui::{Frame, layout::Rect};
use std::{
    collections::{HashMap, HashSet},
    sync::Arc,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ComponentId {
    Text,
    Heading,
    Button,
    Link,
    Badge,
    Icon,
    Kbd,
    Avatar,
    Stack,
    Card,
    CodeBlock,
    NavBar,
    StatCard,
    Input,
    Select,
    Checkbox,
    Radio,
    Switch,
    Alert,
    Tooltip,
    Spinner,
    Progress,
    Tabs,
    Table,
    Timeline,
    Breadcrumb,
    Modal,
    Sheet,
}

impl ComponentId {
    pub const ALL: [Self; 28] = [
        Self::Text,
        Self::Heading,
        Self::Button,
        Self::Link,
        Self::Badge,
        Self::Icon,
        Self::Kbd,
        Self::Avatar,
        Self::Stack,
        Self::Card,
        Self::CodeBlock,
        Self::NavBar,
        Self::StatCard,
        Self::Input,
        Self::Select,
        Self::Checkbox,
        Self::Radio,
        Self::Switch,
        Self::Alert,
        Self::Tooltip,
        Self::Spinner,
        Self::Progress,
        Self::Tabs,
        Self::Table,
        Self::Timeline,
        Self::Breadcrumb,
        Self::Modal,
        Self::Sheet,
    ];

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Text => "Text",
            Self::Heading => "Heading",
            Self::Button => "Button",
            Self::Link => "Link",
            Self::Badge => "Badge",
            Self::Icon => "Icon",
            Self::Kbd => "Kbd",
            Self::Avatar => "Avatar",
            Self::Stack => "Stack",
            Self::Card => "Card",
            Self::CodeBlock => "CodeBlock",
            Self::NavBar => "NavBar",
            Self::StatCard => "StatCard",
            Self::Input => "Input",
            Self::Select => "Select",
            Self::Checkbox => "Checkbox",
            Self::Radio => "Radio",
            Self::Switch => "Switch",
            Self::Alert => "Alert",
            Self::Tooltip => "Tooltip",
            Self::Spinner => "Spinner",
            Self::Progress => "Progress",
            Self::Tabs => "Tabs",
            Self::Table => "Table",
            Self::Timeline => "Timeline",
            Self::Breadcrumb => "Breadcrumb",
            Self::Modal => "Modal",
            Self::Sheet => "Sheet",
        }
    }

    pub const fn template_ref(self) -> TemplateRef {
        let (file, section) = match self {
            Self::Text
            | Self::Heading
            | Self::Icon
            | Self::Kbd
            | Self::Badge
            | Self::Avatar
            | Self::Spinner
            | Self::Progress => (TemplateFile::Atoms, self.as_str()),
            Self::Stack | Self::Card | Self::NavBar | Self::Breadcrumb | Self::Tabs => {
                (TemplateFile::Layout, self.as_str())
            }
            Self::Button
            | Self::Link
            | Self::StatCard
            | Self::Input
            | Self::Select
            | Self::Checkbox
            | Self::Radio
            | Self::Switch
            | Self::Alert
            | Self::Tooltip
            | Self::Table
            | Self::Timeline
            | Self::CodeBlock => (TemplateFile::Molecules, self.as_str()),
            Self::Modal | Self::Sheet => (TemplateFile::Views, self.as_str()),
        };
        TemplateRef { file, section }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TemplateFile {
    Atoms,
    Layout,
    Molecules,
    Views,
}

impl TemplateFile {
    pub const fn path(self) -> &'static str {
        match self {
            Self::Atoms => "templates/atoms.crepus",
            Self::Layout => "templates/layout.crepus",
            Self::Molecules => "templates/molecules.crepus",
            Self::Views => "templates/views.crepus",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct TemplateRef {
    pub file: TemplateFile,
    pub section: &'static str,
}

pub struct ComponentFileEntry {
    pub source: Arc<str>,
    pub sections: HashSet<String>,
}

pub struct TemplateStore {
    files: HashMap<TemplateFile, ComponentFileEntry>,
    virtual_files: Arc<HashMap<String, String>>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TemplateIssue {
    pub file: TemplateFile,
    pub message: String,
}

#[derive(Debug, thiserror::Error)]
pub enum ComponentError {
    #[error("invalid embedded templates")]
    InvalidTemplates(Vec<TemplateIssue>),
    #[error("missing component {section} in {file:?}")]
    MissingComponent {
        file: TemplateFile,
        section: &'static str,
    },
    #[error("render failed for {section} in {file:?}: {source}")]
    Render {
        file: TemplateFile,
        section: &'static str,
        #[source]
        source: CrepusError,
    },
}

impl TemplateStore {
    pub fn load_embedded() -> Result<Self, ComponentError> {
        let mut files = HashMap::new();
        let mut virtual_files = HashMap::new();
        let mut issues = Vec::new();

        let entries = [
            (
                TemplateFile::Atoms,
                include_str!("../templates/atoms.crepus"),
            ),
            (
                TemplateFile::Layout,
                include_str!("../templates/layout.crepus"),
            ),
            (
                TemplateFile::Molecules,
                include_str!("../templates/molecules.crepus"),
            ),
            (
                TemplateFile::Views,
                include_str!("../templates/views.crepus"),
            ),
        ];

        for (file_enum, content) in entries {
            let path = file_enum.path();
            virtual_files.insert(path.to_string(), content.to_string());

            match parse_component_file(content) {
                Ok(comp_file) => {
                    let sections: HashSet<String> = comp_file.components.keys().cloned().collect();
                    files.insert(
                        file_enum,
                        ComponentFileEntry {
                            source: content.into(),
                            sections,
                        },
                    );
                }
                Err(e) => {
                    issues.push(TemplateIssue {
                        file: file_enum,
                        message: e.to_string(),
                    });
                }
            }
        }

        if !issues.is_empty() {
            return Err(ComponentError::InvalidTemplates(issues));
        }

        Ok(Self {
            files,
            virtual_files: Arc::new(virtual_files),
        })
    }

    pub fn file_count(&self) -> usize {
        self.files.len()
    }

    pub fn component(&self, template: TemplateRef) -> Result<(), ComponentError> {
        self.files
            .get(&template.file)
            .and_then(|f| f.sections.get(template.section))
            .map(|_| ())
            .ok_or(ComponentError::MissingComponent {
                file: template.file,
                section: template.section,
            })
    }

    pub fn virtual_files(&self) -> Arc<HashMap<String, String>> {
        self.virtual_files.clone()
    }

    fn source_for_section(&self, template: TemplateRef) -> Result<Arc<str>, ComponentError> {
        self.files
            .get(&template.file)
            .map(|f| f.source.clone())
            .ok_or(ComponentError::MissingComponent {
                file: template.file,
                section: template.section,
            })
    }
}

pub struct ComponentRenderer {
    store: Arc<TemplateStore>,
}

impl ComponentRenderer {
    pub fn new(store: Arc<TemplateStore>) -> Self {
        Self { store }
    }

    /// Renders from the embedded `templates/` namespace. A caller-provided
    /// `base_dir` is intentionally ignored in the cloned render context.
    pub fn render(
        &mut self,
        template: TemplateRef,
        ctx: &TemplateContext,
        palette: TerminalPalette,
        profile: TerminalProfile,
        frame: &mut Frame,
        area: Rect,
    ) -> Result<(), ComponentError> {
        self.store.component(template)?;
        if area.is_empty() {
            return Ok(());
        }

        let content = self.store.source_for_section(template)?;

        let mut render_ctx = ctx.clone();
        normalize_render_context(template, &mut render_ctx);
        if render_ctx.virtual_files.is_empty() {
            render_ctx.virtual_files = self.store.virtual_files();
        } else {
            let virtual_files = self.store.virtual_files();
            let mut virtual_files_map = (*render_ctx.virtual_files).clone();
            for (path, content) in virtual_files.iter() {
                virtual_files_map.insert(path.clone(), content.clone());
            }
            render_ctx.virtual_files = Arc::new(virtual_files_map);
        }
        render_ctx.base_dir = Some("templates".into());

        render_ctx.set("w", area.width as i64);
        render_ctx.set("h", area.height as i64);
        render_ctx.set("viewport_width", area.width as i64);
        render_ctx.set("viewport_height", area.height as i64);
        render_component(&content, template.section, &render_ctx, frame, area).map_err(|e| {
            ComponentError::Render {
                file: template.file,
                section: template.section,
                source: e,
            }
        })?;

        let buf = frame.buffer_mut();
        for y in area.top()..area.bottom() {
            for x in area.left()..area.right() {
                if let Some(cell) = buf.cell_mut((x, y)) {
                    cell.fg = palette.get_semantic_color(cell.fg);
                    cell.bg = palette.get_semantic_color(cell.bg);
                    cell.underline_color = palette.get_semantic_color(cell.underline_color);
                }
            }
        }

        apply_profile_area(buf, area, profile);
        Ok(())
    }
}

fn normalize_render_context(template: TemplateRef, ctx: &mut TemplateContext) {
    // Injection: force-set viewport dimensions before any other normalization
    // We use the area values from the component renderer if possible, but here
    // we rely on the context already having them set.

    match template.section {
        "Progress" => normalize_progress(ctx),
        "Select" => normalize_select(ctx),
        _ => {}
    }
}

fn normalize_progress(ctx: &mut TemplateContext) {
    let value = match ctx.get("value") {
        Some(TemplateValue::Int(value)) => Some(*value as f64),
        Some(TemplateValue::Float(value)) => Some(*value),
        Some(TemplateValue::Str(value)) => value.parse().ok(),
        _ => None,
    };
    let Some(value) = value.filter(|value| value.is_finite()) else {
        ctx.set("value", "Unavailable")
            .set("bar", "----------")
            .set("state", "Unavailable");
        return;
    };

    let value = value.clamp(0.0, 100.0);
    if value.fract() == 0.0 {
        ctx.set("value", value as i64);
    } else {
        ctx.set("value", value);
    }
    let filled = (value / 10.0).floor() as usize;
    let bar = format!("{}{}", "█".repeat(filled), "░".repeat(10 - filled));
    ctx.set("bar", bar);
}

fn normalize_select(ctx: &mut TemplateContext) {
    let has_options = !ctx.get_str("options").trim().is_empty();
    let count = match ctx.get("option_count") {
        Some(TemplateValue::Int(value)) if has_options => (*value).max(0),
        _ => 0,
    };
    if count == 0 {
        ctx.set("selected", "No options")
            .set("options", "No options")
            .set("selected_index", -1_i64);
        return;
    }

    let selected = match ctx.get("selected_index") {
        Some(TemplateValue::Int(value)) => *value,
        _ => -1,
    };
    if !(0..count).contains(&selected) {
        ctx.set("selected", "None").set("selected_index", -1_i64);
    }
}
