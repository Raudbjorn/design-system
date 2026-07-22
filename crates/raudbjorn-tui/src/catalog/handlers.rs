use crepuscularity_tui::{TemplateContext, TemplateValue};
use crossterm::event::{Event, KeyCode, KeyEventKind, KeyModifiers};

fn is_disabled(ctx: &TemplateContext) -> bool {
    get_bool(ctx, "disabled")
}

fn pressed_key(event: &Event) -> Option<KeyCode> {
    match event {
        Event::Key(key)
            if key.kind == KeyEventKind::Press && key.modifiers == KeyModifiers::NONE =>
        {
            Some(key.code)
        }
        _ => None,
    }
}

fn activation(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) {
        return false;
    }
    if !matches!(
        pressed_key(event),
        Some(KeyCode::Enter | KeyCode::Char(' '))
    ) {
        return false;
    }
    ctx.set("activations", get_i64(ctx, "activations").saturating_add(1));
    true
}

pub fn handle_button(ctx: &mut TemplateContext, event: &Event) -> bool {
    activation(ctx, event)
}

pub fn handle_link(ctx: &mut TemplateContext, event: &Event) -> bool {
    activation(ctx, event)
}

pub fn handle_input(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) {
        return false;
    }

    match event {
        Event::Paste(text) if !text.is_empty() => {
            let mut value = ctx.get_str("value");
            value.push_str(text);
            ctx.set("value", value);
            true
        }
        Event::Key(key)
            if key.kind == KeyEventKind::Press
                && !key
                    .modifiers
                    .intersects(KeyModifiers::CONTROL | KeyModifiers::ALT) =>
        {
            match key.code {
                KeyCode::Char(character) => {
                    let mut value = ctx.get_str("value");
                    value.push(character);
                    ctx.set("value", value);
                    true
                }
                KeyCode::Backspace => {
                    match ctx.get("value") {
                        Some(TemplateValue::Str(value)) if value.is_empty() => return false,
                        None => return false,
                        _ => {}
                    }
                    let mut value = ctx.get_str("value");
                    value.pop();
                    ctx.set("value", value);
                    true
                }
                _ => false,
            }
        }
        _ => false,
    }
}

pub fn handle_select(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) {
        return false;
    }
    let Some(code) = pressed_key(event) else {
        return false;
    };
    let count = get_i64(ctx, "option_count").max(0);
    let open = get_bool(ctx, "open");

    if !open {
        if count > 0 && matches!(code, KeyCode::Down | KeyCode::Up | KeyCode::Enter) {
            ctx.set("open", true);
            return true;
        }
        return false;
    }

    match code {
        KeyCode::Esc | KeyCode::Enter => {
            ctx.set("open", false);
            true
        }
        KeyCode::Down | KeyCode::PageDown if count > 0 => set_bounded_index(
            ctx,
            "selected_index",
            get_i64(ctx, "selected_index") + 1,
            count,
        ),
        KeyCode::Up | KeyCode::PageUp if count > 0 => set_bounded_index(
            ctx,
            "selected_index",
            get_i64(ctx, "selected_index") - 1,
            count,
        ),
        _ => false,
    }
}

pub fn handle_checkbox(ctx: &mut TemplateContext, event: &Event) -> bool {
    toggle_on_space(ctx, event, "checked")
}

pub fn handle_switch(ctx: &mut TemplateContext, event: &Event) -> bool {
    toggle_on_space(ctx, event, "on")
}

fn toggle_on_space(ctx: &mut TemplateContext, event: &Event, key: &str) -> bool {
    if is_disabled(ctx) || pressed_key(event) != Some(KeyCode::Char(' ')) {
        return false;
    }
    ctx.set(key, !get_bool(ctx, key));
    true
}

pub fn handle_radio(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) {
        return false;
    }
    let count = get_i64(ctx, "option_count").max(0);
    if count == 0 {
        return false;
    }
    let current = normalize_index(get_i64(ctx, "selected_index"), count);
    let next = match pressed_key(event) {
        Some(KeyCode::Left | KeyCode::Up) => (current + count - 1) % count,
        Some(KeyCode::Right | KeyCode::Down) => (current + 1) % count,
        _ => return false,
    };
    ctx.set("selected_index", next);
    next != current
}

pub fn handle_tabs(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) {
        return false;
    }
    let count = get_i64(ctx, "tab_count").max(0);
    if count == 0 {
        return false;
    }
    let current = normalize_index(get_i64(ctx, "active_index"), count);
    let next = match pressed_key(event) {
        Some(KeyCode::Home) => 0,
        Some(KeyCode::End) => count - 1,
        Some(KeyCode::Left) => (current + count - 1) % count,
        Some(KeyCode::Right) => (current + 1) % count,
        _ => return false,
    };
    if next == current {
        return false;
    }
    ctx.set("active_index", next);
    true
}

pub fn handle_table(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) {
        return false;
    }
    let count = get_i64(ctx, "row_count").max(0);
    if count == 0 {
        return false;
    }
    let current = normalize_index(get_i64(ctx, "selected_row"), count).min(count - 1);
    let next = match pressed_key(event) {
        Some(KeyCode::Up) => (current - 1).max(0),
        Some(KeyCode::Down) => (current + 1).min(count - 1),
        Some(KeyCode::Home) => 0,
        Some(KeyCode::End) => count - 1,
        _ => return false,
    };
    // Always consume navigation keys; the boundary checks above stop the row
    // from overflowing or going negative.
    ctx.set("selected_row", next);
    true
}

pub fn handle_tooltip(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) || pressed_key(event) != Some(KeyCode::Char('?')) {
        return false;
    }
    ctx.set("open", !get_bool(ctx, "open"));
    true
}

pub fn handle_modal(ctx: &mut TemplateContext, event: &Event) -> bool {
    close_on_escape(ctx, event)
}

pub fn handle_sheet(ctx: &mut TemplateContext, event: &Event) -> bool {
    close_on_escape(ctx, event)
}

fn close_on_escape(ctx: &mut TemplateContext, event: &Event) -> bool {
    if is_disabled(ctx) || !get_bool(ctx, "open") || pressed_key(event) != Some(KeyCode::Esc) {
        return false;
    }
    ctx.set("open", false);
    true
}

fn set_bounded_index(ctx: &mut TemplateContext, key: &str, candidate: i64, count: i64) -> bool {
    let current = normalize_index(get_i64(ctx, key), count);
    let next = candidate.clamp(0, count - 1);
    if next == current {
        return false;
    }
    ctx.set(key, next);
    true
}

fn normalize_index(index: i64, count: i64) -> i64 {
    if count == 0 {
        0
    } else {
        index.clamp(0, count - 1)
    }
}

fn get_bool(ctx: &TemplateContext, key: &str) -> bool {
    matches!(ctx.get(key), Some(TemplateValue::Bool(true)))
}

fn get_i64(ctx: &TemplateContext, key: &str) -> i64 {
    match ctx.get(key) {
        Some(TemplateValue::Int(value)) => *value,
        _ => 0,
    }
}
pub fn handle_journal(ctx: &mut TemplateContext, event: &Event) -> bool {
    if let Some(code) = pressed_key(event) {
        match code {
            KeyCode::End => {
                ctx.set("journal_mode", "FOLLOWING");
                ctx.set("unseen", 0);
                return true;
            }
            KeyCode::Up | KeyCode::PageUp => {
                ctx.set("journal_mode", "PINNED");
                return true;
            }
            _ => {}
        }
    }
    false
}
