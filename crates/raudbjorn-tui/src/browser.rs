use std::{io, time::Duration};

use crossterm::event::{
    self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers, MouseEventKind,
};
use ratatui::{
    Frame, Terminal,
    backend::TestBackend,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Modifier, Style},
    widgets::{Block, Borders, Clear, List, ListItem, ListState, Paragraph},
};
use thiserror::Error;
use tui_overlay::{Anchor, Backdrop, Overlay, OverlayState};

use crate::{
    catalog::{CatalogError, Presentation, STORIES, SheetSide, StorySpec, validate_catalog},
    component::{ComponentRenderer, TemplateStore},
    profile::{TerminalProfile, apply_profile_area},
    theme::{DARK, LIGHT, TerminalPalette},
};

#[derive(Debug, Error)]
pub enum GalleryError {
    #[error(transparent)]
    Catalog(#[from] CatalogError),
    #[error("unknown story: {0}")]
    UnknownStory(String),
    #[error("invalid viewport {width}x{height}; width and height must be nonzero")]
    InvalidSize { width: u16, height: u16 },
    #[error(transparent)]
    Component(#[from] crate::component::ComponentError),
    #[error(transparent)]
    Io(#[from] io::Error),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BrowserControl {
    Continue,
    Quit,
}

pub struct GalleryState {
    selected: usize,
    ctx: crepuscularity_tui::TemplateContext,
    dark: bool,
    preview_focused: bool,
    fullscreen: bool,
    return_focus_id: Option<&'static str>,
}

impl GalleryState {
    pub fn new() -> Result<Self, GalleryError> {
        validate_catalog()?;
        Ok(Self::from_index(0))
    }

    pub fn with_story(story_id: &str) -> Result<Self, GalleryError> {
        validate_catalog()?;
        let selected = STORIES
            .iter()
            .position(|story| story.id == story_id)
            .ok_or_else(|| GalleryError::UnknownStory(story_id.to_owned()))?;
        Ok(Self::from_index(selected))
    }

    pub fn selected_story(&self) -> &'static StorySpec {
        &STORIES[self.selected]
    }

    pub fn context(&self) -> &crepuscularity_tui::TemplateContext {
        &self.ctx
    }

    pub const fn is_dark(&self) -> bool {
        self.dark
    }

    pub const fn is_fullscreen(&self) -> bool {
        self.fullscreen
    }

    pub const fn focus_id(&self) -> &'static str {
        if self.preview_focused {
            "preview"
        } else {
            "story-list"
        }
    }

    pub const fn return_focus_id(&self) -> Option<&'static str> {
        self.return_focus_id
    }

    pub fn advance_animation(&mut self) -> bool {
        if !self.selected_story().animated {
            return false;
        }
        let tick = match self.ctx.get("tick") {
            Some(crepuscularity_tui::TemplateValue::Int(value)) => *value,
            _ => 0,
        };
        let next = (tick + 1).rem_euclid(4);
        self.ctx.set("tick", next);
        match self.selected_story().component {
            crate::component::ComponentId::Spinner => {
                self.ctx.set("symbol", ["⠋", "⠙", "⠹", "⠸"][next as usize]);
            }
            crate::component::ComponentId::Progress => {
                self.ctx.set(
                    "bar",
                    ["██░░░░░░░░", "░██░░░░░░░", "░░██░░░░░░", "░░░██░░░░░"][next as usize],
                );
            }
            _ => {}
        }
        true
    }

    fn toggle_preview_focus(&mut self) {
        if self.preview_focused {
            self.preview_focused = false;
            self.return_focus_id = None;
        } else {
            self.return_focus_id = Some(self.focus_id());
            self.preview_focused = true;
        }
    }

    pub fn handle_event_in(&mut self, input: &Event, viewport: Rect) -> BrowserControl {
        if self.overlay_is_active()
            && let Event::Mouse(mouse) = input
            && matches!(mouse.kind, MouseEventKind::Down(_))
        {
            let overlay = presentation_rect(self.selected_story().presentation, viewport);
            let inside = mouse.column >= overlay.left()
                && mouse.column < overlay.right()
                && mouse.row >= overlay.top()
                && mouse.row < overlay.bottom();
            if !inside {
                let close = Event::Key(KeyEvent::new(KeyCode::Esc, KeyModifiers::NONE));
                return self.handle_event(&close);
            }
        }
        self.handle_event(input)
    }

    pub fn handle_event(&mut self, input: &Event) -> BrowserControl {
        if self.overlay_is_active() {
            let was_open = self.ctx.get_bool("open");
            if let Some(handler) = self.selected_story().handle_event {
                handler(&mut self.ctx, input);
            }
            if was_open && !self.ctx.get_bool("open") {
                let return_focus_id = self.return_focus_id.take();
                self.preview_focused = return_focus_id == Some("preview");
            }
            return BrowserControl::Continue;
        }

        if let Event::Key(key) = input {
            if key.kind != KeyEventKind::Press {
                return BrowserControl::Continue;
            }
            if !self.fullscreen
                && (key.code == KeyCode::BackTab
                    || (key.code == KeyCode::Tab && key.modifiers == KeyModifiers::SHIFT))
            {
                self.toggle_preview_focus();
                return BrowserControl::Continue;
            }
            if key.modifiers != KeyModifiers::NONE {
                if self.preview_focused
                    && let Some(handler) = self.selected_story().handle_event
                {
                    handler(&mut self.ctx, input);
                }
                return BrowserControl::Continue;
            }
            if self.fullscreen {
                match key.code {
                    KeyCode::Char('q') => return BrowserControl::Quit,
                    KeyCode::Char('t') => self.dark = !self.dark,
                    KeyCode::Char('f') | KeyCode::Esc => self.exit_fullscreen(),
                    _ => {
                        if let Some(handler) = self.selected_story().handle_event {
                            handler(&mut self.ctx, input);
                        }
                    }
                }
                return BrowserControl::Continue;
            }
            match key.code {
                KeyCode::Char('q') => return BrowserControl::Quit,
                KeyCode::Char('f') if !self.preview_focused => {
                    self.enter_fullscreen();
                    return BrowserControl::Continue;
                }
                KeyCode::Char('t') => {
                    self.dark = !self.dark;
                    return BrowserControl::Continue;
                }
                KeyCode::Tab => {
                    self.toggle_preview_focus();
                    return BrowserControl::Continue;
                }
                KeyCode::Esc => {
                    if self.preview_focused
                        && self
                            .selected_story()
                            .handle_event
                            .is_some_and(|handler| handler(&mut self.ctx, input))
                    {
                        return BrowserControl::Continue;
                    }
                    if self.preview_focused {
                        self.toggle_preview_focus();
                        return BrowserControl::Continue;
                    }
                    return BrowserControl::Quit;
                }
                KeyCode::Up if !self.preview_focused => {
                    self.select(self.selected.saturating_sub(1));
                    return BrowserControl::Continue;
                }
                KeyCode::Down if !self.preview_focused => {
                    self.select((self.selected + 1).min(STORIES.len() - 1));
                    return BrowserControl::Continue;
                }
                KeyCode::Home if !self.preview_focused => {
                    self.select(0);
                    return BrowserControl::Continue;
                }
                KeyCode::End if !self.preview_focused => {
                    self.select(STORIES.len() - 1);
                    return BrowserControl::Continue;
                }
                _ => {}
            }
        }

        if self.preview_focused
            && let Some(handler) = self.selected_story().handle_event
        {
            handler(&mut self.ctx, input);
        }
        BrowserControl::Continue
    }

    fn from_index(selected: usize) -> Self {
        let fullscreen = matches!(STORIES[selected].presentation, Presentation::Fullscreen);
        Self {
            selected,
            ctx: STORIES[selected].context(),
            dark: true,
            preview_focused: fullscreen,
            fullscreen,
            return_focus_id: fullscreen.then_some("story-list"),
        }
    }

    fn select(&mut self, selected: usize) {
        self.selected = selected;
        self.ctx = STORIES[selected].context();
        self.fullscreen = matches!(STORIES[selected].presentation, Presentation::Fullscreen);
        self.preview_focused = self.fullscreen;
        self.return_focus_id = self.fullscreen.then_some("story-list");
    }

    fn enter_fullscreen(&mut self) {
        self.return_focus_id = Some(self.focus_id());
        self.preview_focused = true;
        self.fullscreen = true;
    }

    fn exit_fullscreen(&mut self) {
        self.preview_focused = self.return_focus_id == Some("preview");
        self.return_focus_id = None;
        self.fullscreen = false;
    }

    fn overlay_is_active(&self) -> bool {
        self.preview_focused
            && self.ctx.get_bool("open")
            && matches!(
                self.selected_story().presentation,
                Presentation::Modal { .. } | Presentation::Sheet { .. }
            )
    }
}

pub fn list_text() -> Result<String, GalleryError> {
    validate_catalog()?;
    let mut output = String::new();
    for story in STORIES {
        output.push_str(story.id);
        output.push('\t');
        output.push_str(story.group);
        output.push('\t');
        output.push_str(story.name);
        output.push('\n');
    }
    Ok(output)
}

pub fn dump_story(
    story_id: &str,
    width: u16,
    height: u16,
    profile: TerminalProfile,
    palette: TerminalPalette,
) -> Result<String, GalleryError> {
    validate_catalog()?;
    if width == 0 || height == 0 {
        return Err(GalleryError::InvalidSize { width, height });
    }
    let story = story_by_id(story_id)?;
    let store = std::sync::Arc::new(TemplateStore::load_embedded()?);
    let renderer = ComponentRenderer::new(store);
    let ctx = story.context();
    let backend = TestBackend::new(width, height);
    let mut terminal = Terminal::new(backend).expect("TestBackend is infallible");
    let area = Rect::new(0, 0, width, height);

    terminal
        .draw(|frame| {
            render_story(frame, &renderer, story, &ctx, palette, profile, area);
        })
        .expect("TestBackend is infallible");

    Ok(buffer_text(terminal.backend().buffer()))
}

pub fn run(profile: TerminalProfile) -> Result<(), GalleryError> {
    run_with_state(profile, GalleryState::new()?)
}

pub fn run_story(profile: TerminalProfile, story_id: &str) -> Result<(), GalleryError> {
    run_with_state(profile, GalleryState::with_story(story_id)?)
}

fn run_with_state(profile: TerminalProfile, mut app: GalleryState) -> Result<(), GalleryError> {
    let store = std::sync::Arc::new(TemplateStore::load_embedded()?);
    let renderer = ComponentRenderer::new(store);
    let story_labels: Vec<_> = STORIES
        .iter()
        .map(|story| format!("{} / {}", story.group, story.name))
        .collect();
    let mut terminal = ratatui::init();

    let result = (|| -> Result<(), GalleryError> {
        loop {
            let palette = if app.dark { DARK } else { LIGHT };
            terminal.draw(|frame| {
                render_browser(
                    frame,
                    &renderer,
                    &story_labels,
                    app.selected,
                    &app.ctx,
                    palette,
                    profile,
                    app.preview_focused,
                    app.fullscreen,
                );
            })?;

            let wait = if app.selected_story().animated {
                Duration::from_millis(100)
            } else {
                Duration::from_millis(250)
            };
            if !event::poll(wait)? {
                app.advance_animation();
                continue;
            }
            let size = terminal.size()?;
            let viewport = Rect::new(0, 0, size.width, size.height);
            if app.handle_event_in(&event::read()?, viewport) == BrowserControl::Quit {
                break;
            }
        }
        Ok(())
    })();

    ratatui::restore();
    result
}

fn story_by_id(story_id: &str) -> Result<&'static StorySpec, GalleryError> {
    STORIES
        .iter()
        .find(|story| story.id == story_id)
        .ok_or_else(|| GalleryError::UnknownStory(story_id.to_owned()))
}

fn render_browser(
    frame: &mut Frame,
    renderer: &ComponentRenderer,
    story_labels: &[String],
    selected: usize,
    ctx: &crepuscularity_tui::TemplateContext,
    palette: TerminalPalette,
    profile: TerminalProfile,
    preview_focused: bool,
    fullscreen: bool,
) {
    let area = frame.area();
    if area.width < 40 || area.height < 12 {
        frame.render_widget(
            Paragraph::new(format!(
                "Terminal too small — requires 40×12, current {}×{}",
                area.width, area.height
            )),
            area,
        );
        apply_profile_area(frame.buffer_mut(), area, profile);
        return;
    }

    if fullscreen {
        render_story(
            frame,
            renderer,
            &STORIES[selected],
            ctx,
            palette,
            profile,
            area,
        );
        return;
    }

    let vertical = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(1), Constraint::Length(1)])
        .split(area);
    let columns = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Length(30), Constraint::Min(10)])
        .split(vertical[0]);

    let items = story_labels
        .iter()
        .map(|label| ListItem::new(label.as_str()));
    let sidebar = List::new(items)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(if preview_focused {
                    "Stories"
                } else {
                    "Stories · focused"
                }),
        )
        .highlight_symbol("> ")
        .highlight_style(Style::default().add_modifier(Modifier::REVERSED));
    let mut state = ListState::default().with_selected(Some(selected));
    frame.render_stateful_widget(sidebar, columns[0], &mut state);

    let story = &STORIES[selected];
    let preview_block = Block::default()
        .borders(Borders::ALL)
        .title(if preview_focused {
            format!("{} · preview focused", story.id)
        } else {
            story.id.to_owned()
        });
    let preview = preview_block.inner(columns[1]);
    frame.render_widget(preview_block, columns[1]);
    render_story(frame, renderer, story, ctx, palette, profile, preview);

    frame.render_widget(
        Paragraph::new("↑/↓ select · Tab focus preview · t theme · q quit"),
        vertical[1],
    );
    apply_profile_area(frame.buffer_mut(), columns[0], profile);
    apply_profile_area(frame.buffer_mut(), vertical[1], profile);
}

fn render_story(
    frame: &mut Frame,
    renderer: &ComponentRenderer,
    story: &StorySpec,
    ctx: &crepuscularity_tui::TemplateContext,
    palette: TerminalPalette,
    profile: TerminalProfile,
    area: Rect,
) {
    let render_area = match story.presentation {
        Presentation::Inline | Presentation::Fullscreen => area,
        Presentation::Modal {
            width_percent,
            height_percent,
        } => {
            let overlay = Overlay::new()
                .anchor(Anchor::Center)
                .width(Constraint::Percentage(width_percent))
                .height(Constraint::Percentage(height_percent))
                .backdrop(Backdrop::new(palette.bg).fg(palette.text_faint))
                .bg(palette.surface_1);
            let mut state = OverlayState::new();
            state.open();
            frame.render_stateful_widget(overlay, area, &mut state);
            state.inner_area().unwrap_or(area)
        }

        Presentation::Sheet {
            side,
            width_percent,
        } => {
            let anchor = match side {
                SheetSide::Left => Anchor::Left,
                SheetSide::Right => Anchor::Right,
            };
            let overlay = Overlay::new()
                .anchor(anchor)
                .width(Constraint::Percentage(width_percent))
                .height(Constraint::Percentage(100))
                .backdrop(Backdrop::new(palette.bg).fg(palette.text_faint))
                .bg(palette.surface_2);
            let mut state = OverlayState::new();
            state.open();
            frame.render_stateful_widget(overlay, area, &mut state);
            state.inner_area().unwrap_or(area)
        }
    };

    if let Err(error) = renderer.render(story.source, ctx, palette, profile, frame, render_area) {
        frame.render_widget(Clear, render_area);
        frame.render_widget(
            Paragraph::new(format!("[WARN] {}: {error}", story.id))
                .style(Style::default().fg(palette.error)),
            render_area,
        );
    }
    apply_profile_area(frame.buffer_mut(), area, profile);
}

fn presentation_rect(presentation: Presentation, area: Rect) -> Rect {
    match presentation {
        Presentation::Inline | Presentation::Fullscreen => area,
        Presentation::Modal {
            width_percent,
            height_percent,
        } => {
            let width = (u32::from(area.width) * u32::from(width_percent.min(100)) / 100) as u16;
            let height = (u32::from(area.height) * u32::from(height_percent.min(100)) / 100) as u16;
            Rect::new(
                area.x.saturating_add(area.width.saturating_sub(width) / 2),
                area.y
                    .saturating_add(area.height.saturating_sub(height) / 2),
                width,
                height,
            )
        }
        Presentation::Sheet {
            side,
            width_percent,
        } => {
            let width = (u32::from(area.width) * u32::from(width_percent.min(100)) / 100) as u16;
            let x = match side {
                SheetSide::Left => area.x,
                SheetSide::Right => area.right().saturating_sub(width),
            };
            Rect::new(x, area.y, width, area.height)
        }
    }
}

fn buffer_text(buffer: &ratatui::buffer::Buffer) -> String {
    let mut output = String::new();
    for y in buffer.area.top()..buffer.area.bottom() {
        for x in buffer.area.left()..buffer.area.right() {
            let symbol = buffer[(x, y)].symbol();
            if symbol.is_empty() {
                output.push(' ');
            } else {
                output.push_str(symbol);
            }
        }
        output.push('\n');
    }
    output
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::profile::{ColorProfile, GlyphProfile};

    #[test]
    fn fullscreen_view_renders_without_browser_chrome() {
        let app = GalleryState::with_story("view/homelab-healthy").unwrap();
        let store = std::sync::Arc::new(TemplateStore::load_embedded().unwrap());
        let renderer = ComponentRenderer::new(store);
        let labels: Vec<_> = STORIES
            .iter()
            .map(|story| format!("{} / {}", story.group, story.name))
            .collect();
        let mut terminal = Terminal::new(TestBackend::new(80, 24)).unwrap();

        terminal
            .draw(|frame| {
                render_browser(
                    frame,
                    &renderer,
                    &labels,
                    app.selected,
                    &app.ctx,
                    DARK,
                    TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode),
                    app.preview_focused,
                    app.fullscreen,
                );
            })
            .unwrap();

        let text = buffer_text(terminal.backend().buffer());
        assert!(text.contains("[Dashboard]") && text.contains("[Menu]"));
        assert!(!text.contains("Stories"));
        assert!(!text.contains("Tab focus preview"));
    }

    #[test]
    fn presentation_rect_clamps_percentages_to_the_viewport() {
        let area = Rect::new(7, 11, 40, 20);
        let modal = presentation_rect(
            Presentation::Modal {
                width_percent: 200,
                height_percent: 300,
            },
            area,
        );
        let sheet = presentation_rect(
            Presentation::Sheet {
                side: SheetSide::Right,
                width_percent: 200,
            },
            area,
        );

        assert_eq!(modal, area);
        assert_eq!(sheet, area);
    }
}
