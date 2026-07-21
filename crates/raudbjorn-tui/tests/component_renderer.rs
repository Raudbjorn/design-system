use crepuscularity_tui::TemplateContext;
use ratatui::{layout::Rect, style::Color};
use raudbjorn_tui::component::{ComponentId, ComponentRenderer, TemplateStore};
use raudbjorn_tui::profile::{ColorProfile, GlyphProfile, TerminalProfile};
use std::{path::PathBuf, sync::Arc};

#[test]
fn component_renderer_aggregates_template_parsing() {
    let store = TemplateStore::load_embedded().expect("failed to load templates");
    assert_eq!(store.file_count(), 4);
}

#[test]
fn component_renderer_resolves_every_component() {
    let store = TemplateStore::load_embedded().unwrap();
    for id in ComponentId::ALL.iter() {
        let template_ref = id.template_ref();
        assert!(
            store.component(template_ref).is_ok(),
            "Component {:?} (file={:?}, section={}) failed to resolve",
            id,
            template_ref.file,
            template_ref.section
        );
    }
}

#[test]
fn component_renderer_reports_missing_section() {
    let store = TemplateStore::load_embedded().unwrap();
    let template_ref = raudbjorn_tui::component::TemplateRef {
        file: raudbjorn_tui::component::TemplateFile::Atoms,
        section: "NonExistent",
    };
    assert!(store.component(template_ref).is_err());
}

#[test]
fn component_renderer_deterministic_render() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let mut renderer = ComponentRenderer::new(store);
    let mut ctx = TemplateContext::default();
    let area = Rect::new(3, 2, 40, 5);

    let palette = raudbjorn_tui::theme::DARK;
    let profile = TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode);
    let template = ComponentId::Button.template_ref();
    ctx.set("label", "Click me");

    let backend1 = ratatui::backend::TestBackend::new(area.right(), area.bottom());
    let mut terminal1 = ratatui::Terminal::new(backend1).unwrap();
    terminal1
        .draw(|f| {
            renderer
                .render(template, &ctx, palette, profile, f, area)
                .unwrap();
        })
        .unwrap();

    let backend2 = ratatui::backend::TestBackend::new(area.right(), area.bottom());
    let mut terminal2 = ratatui::Terminal::new(backend2).unwrap();
    terminal2
        .draw(|f| {
            renderer
                .render(template, &ctx, palette, profile, f, area)
                .unwrap();
        })
        .unwrap();

    assert_eq!(
        terminal1.backend().buffer(),
        terminal2.backend().buffer(),
        "deterministic render failed"
    );
}

#[test]
fn component_renderer_virtual_files_resolve() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let mut renderer = ComponentRenderer::new(store);
    let area = Rect::new(0, 0, 40, 8);
    let palette = raudbjorn_tui::theme::DARK;
    let profile = TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode);
    let template = ComponentId::Modal.template_ref();

    let mut ctx = TemplateContext::default();
    ctx.set("heading", "X");
    ctx.set("body", "Included heading");
    ctx.set("footer", "Close");

    let backend = ratatui::backend::TestBackend::new(area.width, area.height);
    let mut terminal = ratatui::Terminal::new(backend).unwrap();

    terminal
        .draw(|f| {
            renderer
                .render(template, &ctx, palette, profile, f, area)
                .expect("render failed");
        })
        .unwrap();

    // The real Modal component resolves its embedded Heading include and props.
    let buf = terminal.backend().buffer();
    let mut rendered_text = String::new();
    for y in area.top()..area.bottom() {
        for x in area.left()..area.right() {
            rendered_text.push(buf[(x, y)].symbol().chars().next().unwrap_or(' '));
        }
    }
    assert!(
        rendered_text.contains('X'),
        "Rendered text: {rendered_text}"
    );
}

#[test]
fn component_renderer_semantic_profile_mapping() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let mut renderer = ComponentRenderer::new(store);
    let area = Rect::new(0, 0, 40, 5);

    let mut ctx = TemplateContext::default();
    ctx.set("tone", "warning");
    ctx.set("message", "Something happened");

    let template = ComponentId::Alert.template_ref();
    let profile_8 = TerminalProfile::new(ColorProfile::Ansi8, GlyphProfile::Ascii);

    let backend_dark = ratatui::backend::TestBackend::new(area.width, area.height);
    let mut terminal_dark = ratatui::Terminal::new(backend_dark).unwrap();
    let backend_light = ratatui::backend::TestBackend::new(area.width, area.height);
    let mut terminal_light = ratatui::Terminal::new(backend_light).unwrap();

    terminal_dark
        .draw(|f| {
            renderer
                .render(
                    template,
                    &ctx,
                    raudbjorn_tui::theme::DARK,
                    profile_8,
                    f,
                    area,
                )
                .unwrap();
        })
        .unwrap();

    terminal_light
        .draw(|f| {
            renderer
                .render(
                    template,
                    &ctx,
                    raudbjorn_tui::theme::LIGHT,
                    profile_8,
                    f,
                    area,
                )
                .unwrap();
        })
        .unwrap();

    let buf_dark = terminal_dark.backend().buffer();
    let buf_light = terminal_light.backend().buffer();

    assert_ne!(
        buf_dark, buf_light,
        "DARK vs LIGHT must still differ under Ansi8"
    );
}

#[test]
fn component_renderer_profiles_only_its_area_and_preserves_context() {
    let store = Arc::new(TemplateStore::load_embedded().unwrap());
    let mut renderer = ComponentRenderer::new(store);
    let mut ctx = TemplateContext::default();
    ctx.set("label", "Scoped");
    ctx.base_dir = Some(PathBuf::from("caller-owned"));
    let original_virtual_files = Arc::clone(&ctx.virtual_files);

    let area = Rect::new(4, 2, 20, 3);
    let backend = ratatui::backend::TestBackend::new(30, 8);
    let mut terminal = ratatui::Terminal::new(backend).unwrap();
    terminal
        .draw(|frame| {
            let untouched = &mut frame.buffer_mut()[(1, 0)];
            untouched.set_char('→');
            untouched.fg = Color::Rgb(1, 2, 3);

            renderer
                .render(
                    ComponentId::Button.template_ref(),
                    &ctx,
                    raudbjorn_tui::theme::DARK,
                    TerminalProfile::new(ColorProfile::Ansi8, GlyphProfile::Ascii),
                    frame,
                    area,
                )
                .unwrap();
        })
        .unwrap();

    let untouched = &terminal.backend().buffer()[(1, 0)];
    assert_eq!(untouched.symbol(), "→");
    assert_eq!(untouched.fg, Color::Rgb(1, 2, 3));
    assert_eq!(ctx.base_dir, Some(PathBuf::from("caller-owned")));
    assert!(Arc::ptr_eq(&ctx.virtual_files, &original_virtual_files));
}
