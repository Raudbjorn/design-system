use crepuscularity_tui::TemplateContext;

pub fn apply_story_variant(ctx: &mut TemplateContext, id: &str) {
    match id {
        // ===== Hierarchy atoms =====
        "text/default" => {
            ctx.set("label", "Homelab services");
        }
        "text/strong" => {
            ctx.set("label", "Homelab services");
        }
        "text/muted" => {
            ctx.set("label", "Homelab services");
        }
        "text/faint" => {
            ctx.set("label", "Homelab services");
        }
        "text/mono" => {
            ctx.set("label", "Homelab services");
        }
        "heading/level-1" => {
            ctx.set("title", "Service dashboard");
        }
        "heading/level-2" => {
            ctx.set("title", "Service dashboard");
        }
        "heading/level-3" => {
            ctx.set("title", "Service dashboard");
        }
        "heading/level-4" => {
            ctx.set("title", "Service dashboard");
        }
        "icon/unicode" => {
            ctx.set("symbol", "\u{25cf}");
        }
        "icon/ascii" => {
            ctx.set("symbol", "*");
        }
        "kbd/single" => {
            ctx.set("key", "Esc");
        }
        "kbd/chord" => {
            ctx.set("key", "Ctrl]+[P");
        }
        "badge/neutral" => {
            ctx.set("label", "IDLE");
        }
        "badge/accent" => {
            ctx.set("label", "ACTIVE");
        }
        "badge/success" => {
            ctx.set("label", "SUCCESS");
        }
        "badge/warning" => {
            ctx.set("label", "WARNING");
        }
        "badge/error" => {
            ctx.set("label", "ERROR");
        }
        "avatar/initials" => {
            ctx.set("initials", "SV");
        }
        "avatar/image-fallback" => {
            ctx.set("initials", "");
        }
        "spinner/frozen" => {
            ctx.set("symbol", "o");
            ctx.set("label", "Loading");
        }
        "spinner/animated" => {
            ctx.set("symbol", "o");
            ctx.set("label", "Loading");
        }
        "spinner/ascii" => {
            ctx.set("symbol", "|");
            ctx.set("label", "Processing");
        }
        "progress/determinate" => {
            ctx.set("value", "42");
            ctx.set("bar", "███");
            ctx.set("state", "Working");
        }
        "progress/indeterminate" => {
            ctx.set("value", "0");
            ctx.set("bar", "~");
            ctx.set("state", "Working");
        }
        "progress/complete" => {
            ctx.set("value", "100");
            ctx.set("bar", "█");
            ctx.set("state", "Complete");
        }
        "progress/error" => {
            ctx.set("value", "0");
            ctx.set("bar", "✗");
            ctx.set("state", "Error");
        }

        // ===== Molecules =====
        "button/primary" => {
            ctx.set("label", "Deploy");
        }
        "button/secondary" => {
            ctx.set("label", "Restart");
        }
        "button/ghost" => {
            ctx.set("label", "View logs");
        }
        "button/danger" => {
            ctx.set("label", "Stop service");
        }
        "button/focused" => {
            ctx.set("label", "Deploy");
            ctx.set("focused", true);
        }
        "button/disabled" => {
            ctx.set("label", "Deploy");
            ctx.set("disabled", true);
        }
        "button/loading" => {
            ctx.set("label", "Deploy");
            ctx.set("loading", true);
        }
        "link/internal" => {
            ctx.set("href", "jellyfin.s8n.is");
        }
        "link/external" => {
            ctx.set("href", "/service");
            ctx.set("external", true);
        }
        "link/focused" => {
            ctx.set("href", "/service");
            ctx.set("focused", true);
        }
        "stat-card/default" => {
            ctx.set("value", "99.98");
            ctx.set("label", "vinbons");
        }
        "stat-card/accent" => {
            ctx.set("accent", true);
            ctx.set("value", "100");
            ctx.set("label", "CPU");
        }
        "stat-card/accent-2" => {
            ctx.set("accent_2", true);
            ctx.set("value", "212ms");
            ctx.set("label", "Latency");
        }
        "stat-card/row" => {
            ctx.set("value", "1");
            ctx.set("label", "Service");
        }
        "input/default" => {
            ctx.set("prompt", "Hostname");
            ctx.set("value", "vinbonesjr");
        }
        "input/hint" => {
            ctx.set("prompt", "Host");
            ctx.set("value", "localhost");
            ctx.set("hint", "optional");
        }
        "input/error" => {
            ctx.set("prompt", "Port");
            ctx.set("value", "99999");
            ctx.set("error", true);
            ctx.set("hint", "Port out of range");
        }
        "input/focused" => {
            ctx.set("prompt", "Host");
            ctx.set("value", "server");
            ctx.set("focused", true);
        }
        "input/disabled" => {
            ctx.set("prompt", "Port");
            ctx.set("value", "8080");
            ctx.set("disabled", true);
        }
        "select/closed" => {
            ctx.set("selected", "Sonarr");
            ctx.set("options", "Sonarr,Radarr,Lidarr");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 0_i64);
        }
        "select/open" => {
            ctx.set("selected", "Sonarr");
            ctx.set("options", "Sonarr,Radarr,Lidarr");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 0_i64);
            ctx.set("open", true);
        }
        "select/selected" => {
            ctx.set("selected", "Radarr");
            ctx.set("options", "Sonarr,Radarr,Lidarr");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 1_i64);
        }
        "select/focused" => {
            ctx.set("selected", "Option 1");
            ctx.set("options", "Option 1,Option 2");
            ctx.set("option_count", 2_i64);
            ctx.set("selected_index", 0_i64);
            ctx.set("focused", true);
        }
        "select/disabled" => {
            ctx.set("selected", "Sonarr");
            ctx.set("options", "Sonarr");
            ctx.set("option_count", 1_i64);
            ctx.set("selected_index", 0_i64);
            ctx.set("disabled", true);
        }
        "checkbox/unchecked" => {
            ctx.set("check", "[ ]");
            ctx.set("label", "Enable");
        }
        "checkbox/checked" => {
            ctx.set("check", "[x]");
            ctx.set("label", "Enable");
        }
        "checkbox/focused" => {
            ctx.set("check", "[ ]");
            ctx.set("label", "Enable");
            ctx.set("focused", true);
        }
        "checkbox/disabled-checked" => {
            ctx.set("check", "[x]");
            ctx.set("label", "Enable");
            ctx.set("disabled", true);
        }
        "radio/group" => {
            ctx.set("radio", "( )");
            ctx.set("label", "Alpha");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 0_i64);
        }
        "radio/selected" => {
            ctx.set("radio", "(*)");
            ctx.set("label", "Beta");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 1_i64);
        }
        "radio/focused" => {
            ctx.set("radio", "( )");
            ctx.set("label", "Gamma");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 2_i64);
            ctx.set("focused", true);
        }
        "radio/disabled" => {
            ctx.set("radio", "( )");
            ctx.set("label", "Delta");
            ctx.set("option_count", 3_i64);
            ctx.set("selected_index", 0_i64);
            ctx.set("disabled", true);
        }
        "switch/off" => {
            ctx.set("state", "[ OFF ]");
        }
        "switch/on" => {
            ctx.set("state", "[ ON ]");
            ctx.set("on", true);
        }
        "switch/focused" => {
            ctx.set("state", "[ OFF ]");
            ctx.set("focused", true);
        }
        "switch/disabled" => {
            ctx.set("state", "[ OFF ]");
            ctx.set("disabled", true);
        }
        "switch/labeled" => {
            ctx.set("state", "[ OFF ]");
            ctx.set("labeled", true);
            ctx.set("label", "restart");
        }
        "alert/info" => {
            ctx.set("message", "Service details updated");
            ctx.set("tone", "Info");
            ctx.set("info", true);
        }
        "alert/success" => {
            ctx.set("message", "jellyfin is healthy");
            ctx.set("tone", "Success");
            ctx.set("success", true);
        }
        "alert/warning" => {
            ctx.set("message", "sonarr is unavailable");
            ctx.set("tone", "Warning");
            ctx.set("warning", true);
        }
        "alert/error" => {
            ctx.set("message", "sonarr is unavailable");
            ctx.set("tone", "Error");
            ctx.set("error", true);
        }
        "tooltip/closed" => {
            ctx.set("help", "tooltip?");
        }
        "tooltip/help-open" => {
            ctx.set("help", "Help tooltip");
            ctx.set("open", true);
        }
        "tooltip/focused" => {
            ctx.set("help", "context help");
            ctx.set("focused", true);
        }
        "table/default" => {
            ctx.set("headers", "SERVICE");
            ctx.set("rows", "jellyfin");
            ctx.set("row_count", 1_i64);
        }
        "table/rich-cells" => {
            ctx.set("headers", "SERVICE");
            ctx.set("rows", "jellyfin");
            ctx.set("rich", true);
            ctx.set("row_count", 1_i64);
        }
        "table/selected" => {
            ctx.set("headers", "SERVICE");
            ctx.set("rows", "online");
            ctx.set("selected", true);
            ctx.set("row_count", 1_i64);
        }
        "table/empty" => {
            ctx.set("headers", "SERVICE");
            ctx.set("rows", "No rows");
            ctx.set("empty", true);
            ctx.set("row_count", 1_i64);
        }
        "table/narrow" => {
            ctx.set("headers", "SVC");
            ctx.set("rows", "jellyfin");
            ctx.set("row_count", 1_i64);
        }
        "timeline/basic" => {
            ctx.set("ts", "10:00");
            ctx.set("event", "tailscale connected");
        }
        "timeline/status" => {
            ctx.set("ts", "10:05");
            ctx.set("event", "ONLINE");
            ctx.set("status", true);
        }
        "timeline/reverse" => {
            ctx.set("ts", "10:10");
            ctx.set("event", "tailscale connected");
            ctx.set("reverse", true);
        }
        "code-block/highlighted" => {
            ctx.set("code", "systemctl restart jellyfin");
            ctx.set("highlighted", true);
            ctx.set("line_numbers", true);
            ctx.set("lines", "1");
        }
        "code-block/plain" => {
            ctx.set("code", "systemctl restart jellyfin");
            ctx.set("plain", true);
        }
        "code-block/long-line" => {
            ctx.set(
                "code",
                "systemctl restart jellyfin --full-restart-with-extra-long-flag-that-exceeds-width",
            );
            ctx.set("overflow", true);
        }
        "code-block/ascii" => {
            ctx.set("code", "echo hello");
        }
        "stack/column" | "stack/row" => {
            ctx.set("i", "jellyfin");
        }
        "stack/wrap" => {}
        "card/basic" | "card/header-footer" | "card/emphasis" | "card/dense" => {
            ctx.set("title", "jellyfin");
            ctx.set("subtitle", "Port 8096");
        }
        "tabs/first-active" => {
            ctx.set("tabs", "Overview,Services");
            ctx.set("tab", "Overview");
            ctx.set("active_index", 0_i64);
            ctx.set("tab_count", 2_i64);
        }
        "tabs/second-active" => {
            ctx.set("tabs", "Overview,Services");
            ctx.set("tab", "Services");
            ctx.set("active_index", 1_i64);
            ctx.set("tab_count", 2_i64);
            ctx.set("active_index", 1_i64);
        }
        "tabs/narrow" => {
            ctx.set("tabs", "A,B,C");
            ctx.set("tab_count", 3_i64);
            ctx.set("active_index", 0_i64);
            ctx.set("tab", "A");
        }
        "breadcrumb/default" => {
            ctx.set("segments", "Home,Dashboard,Settings");
            ctx.set("sep", "›");
            ctx.set("crumb", "Dashboard › Settings");
        }
        "breadcrumb/truncated" => {
            ctx.set("segments", "Home,A/B/C/D/E/F/G");
        }
        "nav-bar/default" => {
            ctx.set("brand", "Raudbjorn");
            ctx.set("current", "Services");
            ctx.set("section", "Services");
            ctx.set("actions", "Search,Menu");
        }
        "nav-bar/narrow" => {
            ctx.set("brand", "L");
            ctx.set("current", "Svc");
            ctx.set("section", "Svc");
            ctx.set("actions", "Menu");
        }
        "modal/open" => {
            ctx.set("heading", "Confirm restart");
            ctx.set("body", "Restart jellyfin?");
            ctx.set("footer", "Enter confirm · Esc cancel");
            ctx.set("open", true);
        }
        "modal/validation-error" => {
            ctx.set("heading", "Invalid input");
            ctx.set("body", "Correct the service name.");
            ctx.set("validation_error", true);
            ctx.set("validation_label", "Service is required");
            ctx.set("footer", "Esc close");
            ctx.set("open", true);
        }
        "modal/minimum-size" => {
            ctx.set("heading", "Compact modal");
            ctx.set("body", "Resize terminal");
            ctx.set("minimum_size", true);
            ctx.set("footer", "Esc close");
            ctx.set("open", true);
        }
        "sheet/right" => {
            ctx.set("title", "Right panel");
            ctx.set("side", "RIGHT");
            ctx.set("body", "Content here");
            ctx.set("footer", "Esc close");
            ctx.set("open", true);
        }
        "sheet/left" => {
            ctx.set("title", "Left panel");
            ctx.set("side", "LEFT");
            ctx.set("body", "Content");
            ctx.set("footer", "Esc close");
            ctx.set("open", true);
        }
        "sheet/minimum-size" => {
            ctx.set("title", "Compact sheet");
            ctx.set("side", "RIGHT");
            ctx.set("body", "Resize terminal");
            ctx.set("minimum_size", true);
            ctx.set("footer", "Esc close");
            ctx.set("open", true);
        }
        "pane/service-table" => {
            ctx.set("title", "Services");
            ctx.set("headers", "NAME STATUS UPTIME");
            ctx.set("rows", "jellyfin ONLINE 14d");
            ctx.set("empty", false);
        }
        "pane/stat-row" => {
            ctx.set("cpu", "12%");
            ctx.set("mem", "4.2G");
            ctx.set("uptime", "14d");
        }
        "pane/activity" => {
            ctx.set("title", "Activity");
            ctx.set("events", "Updated service");
        }
        "pane/journal-following" => {
            ctx.set("title", "Journal");
            ctx.set("journal_mode", "FOLLOWING");
            ctx.set("events", "log line 1");
            ctx.set("unseen", 0_i64);
        }
        "pane/journal-pinned" => {
            ctx.set("title", "Journal");
            ctx.set("journal_mode", "PINNED");
            ctx.set("events", "pinned log");
            ctx.set("unseen", 3_i64);
        }
        "pane/actions" => {
            ctx.set("title", "Actions");
        }
        "view/homelab-healthy" => {
            ctx.set("status", "healthy");
        }
        "view/homelab-degraded" => {
            ctx.set("status", "degraded");
        }
        "view/homelab-loading" => {
            ctx.set("status", "loading");
        }
        "view/homelab-empty" => {
            ctx.set("status", "empty");
        }
        "view/homelab-error" => {
            ctx.set("status", "error");
        }
        "view/minimum-size" => {}

        _ => {}
    }
}

// Default fixtures — used when no variant arm matches.
// Each sets sensible fallback values so the renderer never gets empty output.
pub fn text_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("label", "default");
    c
}
pub fn heading_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("title", "Title");
    c
}
pub fn icon_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("symbol", "!");
    c.set("label", "icon");
    c
}
pub fn kbd_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("key", "Esc");
    c
}
pub fn badge_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("label", "IDLE");
    c
}
pub fn avatar_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("initials", "AB");
    c
}
pub fn button_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("label", "Deploy");
    c
}
pub fn link_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("href", "link");
    c
}
pub fn stack_fixture() -> TemplateContext {
    TemplateContext::default()
}
pub fn card_fixture() -> TemplateContext {
    TemplateContext::default()
}
pub fn stat_card_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("value", "N/A");
    c.set("label", "Label");
    c
}
pub fn alert_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("message", "");
    c.set("tone", "");
    c
}
pub fn spinner_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("symbol", "o");
    c.set("label", "loading");
    c
}
pub fn progress_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("value", "0");
    c.set("bar", "-");
    c.set("state", "idle");
    c
}
pub fn input_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("prompt", "");
    c.set("value", "");
    c
}
pub fn select_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("selected", "A")
        .set("options", "A,B,C")
        .set("option_count", 3_i64)
        .set("selected_index", 0_i64);
    ctx
}
pub fn checkbox_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("check", "[ ]");
    c.set("label", "");
    c
}
pub fn radio_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("radio", "( )")
        .set("label", "Option")
        .set("option_count", 3_i64)
        .set("selected_index", 0_i64);
    ctx
}
pub fn switch_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("state", "");
    c
}
pub fn tabs_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("tabs", "Tab1,Tab2,Tab3")
        .set("tab_count", 3_i64)
        .set("active_index", 0_i64);
    ctx
}
pub fn breadcrumb_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("segments", "A/B");
    c
}
pub fn nav_bar_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("brand", "");
    c.set("current", "");
    c.set("actions", "");
    c
}
pub fn table_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("headers", "");
    c.set("rows", "");
    c
}
pub fn timeline_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("ts", "");
    c.set("event", "");
    c
}
pub fn code_block_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("code", "");
    c
}
pub fn tooltip_fixture() -> TemplateContext {
    let mut c = TemplateContext::default();
    c.set("help", "");
    c
}
pub fn modal_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("heading", "Confirm restart")
        .set("body", "Restart jellyfin?")
        .set("footer", "Enter confirm · Esc cancel")
        .set("open", true);
    ctx
}
pub fn sheet_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("title", "Service actions")
        .set("side", "RIGHT")
        .set("body", "Restart · Stop · View logs")
        .set("footer", "Esc close")
        .set("open", true);
    ctx
}
pub fn pane_service_table_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("title", "Services")
        .set("headers", "NAME STATUS UPTIME")
        .set("rows", "jellyfin ONLINE 14d")
        .set("empty", false);
    ctx
}

pub fn pane_stat_row_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("cpu", "12%")
        .set("mem", "4.2G")
        .set("uptime", "14d");
    ctx
}

pub fn pane_activity_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("title", "Activity")
        .set("events", "Service jellyfin healthy");
    ctx
}

pub fn pane_journal_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("title", "Journal")
        .set("events", "Service started")
        .set("journal_mode", "FOLLOWING")
        .set("unseen", 0_i64);
    ctx
}

pub fn pane_journal_pinned_fixture() -> TemplateContext {
    let mut ctx = pane_journal_fixture();
    ctx.set("journal_mode", "PINNED").set("unseen", 3_i64);
    ctx
}

pub fn pane_actions_fixture() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("title", "Actions");
    ctx
}

fn homelab_context() -> TemplateContext {
    let mut ctx = TemplateContext::default();
    ctx.set("rows", "jellyfin ONLINE 14d")
        .set("empty", false)
        .set("activity", "Service jellyfin healthy")
        .set("cpu", "12%")
        .set("mem", "4.2G")
        .set("uptime", "14d")
        .set("journal", "Service started")
        .set("unseen", 0_i64);
    ctx
}

pub fn homelab_view_healthy_fixture() -> TemplateContext {
    homelab_context()
}

pub fn homelab_view_degraded_fixture() -> TemplateContext {
    let mut ctx = homelab_context();
    ctx.set("rows", "sonarr DEGRADED 2h")
        .set("activity", "Service sonarr unavailable")
        .set("unseen", 3_i64);
    ctx
}

pub fn homelab_view_loading_fixture() -> TemplateContext {
    let mut ctx = homelab_context();
    ctx.set("rows", "jellyfin LOADING --")
        .set("activity", "Refreshing services");
    ctx
}

pub fn homelab_view_empty_fixture() -> TemplateContext {
    let mut ctx = homelab_context();
    ctx.set("rows", "")
        .set("empty", true)
        .set("activity", "")
        .set("journal", "");
    ctx
}

pub fn homelab_view_error_fixture() -> TemplateContext {
    let mut ctx = homelab_context();
    ctx.set("rows", "gateway OFFLINE --")
        .set("activity", "Connection failed");
    ctx
}

pub fn homelab_view_fixture() -> TemplateContext {
    TemplateContext::default()
}
