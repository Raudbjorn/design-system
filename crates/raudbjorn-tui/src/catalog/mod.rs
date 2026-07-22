pub mod fixtures;
pub mod handlers;

use crate::component::{ComponentId, TemplateFile, TemplateRef};
use crepuscularity_tui::TemplateContext;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CatalogTab {
    Widgets,
    Panes,
    Views,
}

impl CatalogTab {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Widgets => "Widgets",
            Self::Panes => "Panes",
            Self::Views => "Views",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SheetSide {
    Left,
    Right,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Presentation {
    Inline,
    Fullscreen,
    Modal {
        width_percent: u16,
        height_percent: u16,
    },
    Sheet {
        side: SheetSide,
        width_percent: u16,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PropSpec {
    pub name: &'static str,
    pub ty: &'static str,
    pub description: &'static str,
}

pub type StoryEventHandler = fn(&mut TemplateContext, &crossterm::event::Event) -> bool;

pub struct StorySpec {
    pub id: &'static str,
    pub component: ComponentId,
    pub group: &'static str,
    pub name: &'static str,
    pub tab: CatalogTab,
    pub section: &'static str,
    pub description: &'static str,
    pub source: TemplateRef,
    pub props: &'static [PropSpec],
    pub min_width: u16,
    pub min_height: u16,
    pub presentation: Presentation,
    pub animated: bool,
    pub fixture: fn() -> TemplateContext,
    pub handle_event: Option<StoryEventHandler>,
}

impl StorySpec {
    pub fn context(&self) -> TemplateContext {
        let mut ctx = (self.fixture)();
        ctx.set("story_id", self.id);
        ctx.set(
            "variant",
            self.id
                .rsplit_once('/')
                .map_or(self.id, |(_, variant)| variant),
        );
        fixtures::apply_story_variant(&mut ctx, self.id);
        ctx
    }
}

macro_rules! s {
    (
        $id:expr, $comp:ident, $group:expr, $name:expr, $tab:expr, $section:expr,
        $desc:expr, $props:expr, $min_w:expr, $min_h:expr,
        $pres:expr, $anim:expr, $fixture:expr
    ) => {
        StorySpec {
            id: $id,
            component: ComponentId::$comp,
            group: $group,
            name: $name,
            tab: $tab,
            section: $section,
            description: $desc,
            source: ComponentId::$comp.template_ref(),
            props: $props,
            min_width: $min_w,
            min_height: $min_h,
            presentation: $pres,
            animated: $anim,
            fixture: $fixture,
            handle_event: None,
        }
    };
    (
        $id:expr, $comp:ident, $group:expr, $name:expr, $tab:expr, $section:expr,
        $desc:expr, $props:expr, $min_w:expr, $min_h:expr,
        $pres:expr, $anim:expr, $fixture:expr, $handler:expr
    ) => {
        StorySpec {
            id: $id,
            component: ComponentId::$comp,
            group: $group,
            name: $name,
            tab: $tab,
            section: $section,
            description: $desc,
            source: ComponentId::$comp.template_ref(),
            props: $props,
            min_width: $min_w,
            min_height: $min_h,
            presentation: $pres,
            animated: $anim,
            fixture: $fixture,
            handle_event: Some($handler),
        }
    };
}
macro_rules! cv {
    (
        $id:expr, $group:expr, $name:expr, $tab:expr,
        $section:expr, $desc:expr, $props:expr, $min_w:expr, $min_h:expr,
        $pres:expr, $anim:expr, $fixture:expr
    ) => {
        StorySpec {
            id: $id,
            component: ComponentId::Stack,
            group: $group,
            name: $name,
            tab: $tab,
            section: $section,
            description: $desc,
            source: TemplateRef {
                file: TemplateFile::Views,
                section: $section,
            },
            props: $props,
            min_width: $min_w,
            min_height: $min_h,
            presentation: $pres,
            animated: $anim,
            fixture: $fixture,
            handle_event: None,
        }
    };
    (
        $id:expr, $group:expr, $name:expr, $tab:expr,
        $section:expr, $desc:expr, $props:expr, $min_w:expr, $min_h:expr,
        $pres:expr, $anim:expr, $fixture:expr, $handler:expr
    ) => {
        StorySpec {
            id: $id,
            component: ComponentId::Stack,
            group: $group,
            name: $name,
            tab: $tab,
            section: $section,
            description: $desc,
            source: TemplateRef {
                file: TemplateFile::Views,
                section: $section,
            },
            props: $props,
            min_width: $min_w,
            min_height: $min_h,
            presentation: $pres,
            animated: $anim,
            fixture: $fixture,
            handle_event: Some($handler),
        }
    };
}

pub static STORIES: &[StorySpec] = &[
    s!(
        "text/default",
        Text,
        "Text",
        "Default",
        CatalogTab::Widgets,
        "Hierarchy",
        "Text default",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::text_fixture
    ),
    s!(
        "text/strong",
        Text,
        "Text",
        "Strong",
        CatalogTab::Widgets,
        "Hierarchy",
        "Text strong",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::text_fixture
    ),
    s!(
        "text/muted",
        Text,
        "Text",
        "Muted",
        CatalogTab::Widgets,
        "Hierarchy",
        "Text muted",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::text_fixture
    ),
    s!(
        "text/faint",
        Text,
        "Text",
        "Faint",
        CatalogTab::Widgets,
        "Hierarchy",
        "Text faint",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::text_fixture
    ),
    s!(
        "text/mono",
        Text,
        "Text",
        "Mono",
        CatalogTab::Widgets,
        "Hierarchy",
        "Text mono",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::text_fixture
    ),
    s!(
        "heading/level-1",
        Heading,
        "Heading",
        "Level-1",
        CatalogTab::Widgets,
        "Hierarchy",
        "Heading level-1",
        &[],
        24,
        2,
        Presentation::Inline,
        false,
        fixtures::heading_fixture
    ),
    s!(
        "heading/level-2",
        Heading,
        "Heading",
        "Level-2",
        CatalogTab::Widgets,
        "Hierarchy",
        "Heading level-2",
        &[],
        24,
        2,
        Presentation::Inline,
        false,
        fixtures::heading_fixture
    ),
    s!(
        "heading/level-3",
        Heading,
        "Heading",
        "Level-3",
        CatalogTab::Widgets,
        "Hierarchy",
        "Heading level-3",
        &[],
        24,
        2,
        Presentation::Inline,
        false,
        fixtures::heading_fixture
    ),
    s!(
        "heading/level-4",
        Heading,
        "Heading",
        "Level-4",
        CatalogTab::Widgets,
        "Hierarchy",
        "Heading level-4",
        &[],
        24,
        2,
        Presentation::Inline,
        false,
        fixtures::heading_fixture
    ),
    s!(
        "icon/unicode",
        Icon,
        "Icon",
        "Unicode",
        CatalogTab::Widgets,
        "Hierarchy",
        "Icon unicode",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::icon_fixture
    ),
    s!(
        "icon/ascii",
        Icon,
        "Icon",
        "Ascii",
        CatalogTab::Widgets,
        "Hierarchy",
        "Icon ascii",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::icon_fixture
    ),
    s!(
        "kbd/single",
        Kbd,
        "Kbd",
        "Single",
        CatalogTab::Widgets,
        "Hierarchy",
        "Kbd single",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::kbd_fixture
    ),
    s!(
        "kbd/chord",
        Kbd,
        "Kbd",
        "Chord",
        CatalogTab::Widgets,
        "Hierarchy",
        "Kbd chord",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::kbd_fixture
    ),
    s!(
        "badge/neutral",
        Badge,
        "Badge",
        "Neutral",
        CatalogTab::Widgets,
        "Hierarchy",
        "Badge neutral",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::badge_fixture
    ),
    s!(
        "badge/accent",
        Badge,
        "Badge",
        "Accent",
        CatalogTab::Widgets,
        "Hierarchy",
        "Badge accent",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::badge_fixture
    ),
    s!(
        "badge/success",
        Badge,
        "Badge",
        "Success",
        CatalogTab::Widgets,
        "Hierarchy",
        "Badge success",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::badge_fixture
    ),
    s!(
        "badge/warning",
        Badge,
        "Badge",
        "Warning",
        CatalogTab::Widgets,
        "Hierarchy",
        "Badge warning",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::badge_fixture
    ),
    s!(
        "badge/error",
        Badge,
        "Badge",
        "Error",
        CatalogTab::Widgets,
        "Hierarchy",
        "Badge error",
        &[],
        20,
        1,
        Presentation::Inline,
        false,
        fixtures::badge_fixture
    ),
    s!(
        "avatar/initials",
        Avatar,
        "Avatar",
        "Initials",
        CatalogTab::Widgets,
        "Hierarchy",
        "Avatar initials",
        &[],
        20,
        3,
        Presentation::Inline,
        false,
        fixtures::avatar_fixture
    ),
    s!(
        "avatar/image-fallback",
        Avatar,
        "Avatar",
        "Image-fallback",
        CatalogTab::Widgets,
        "Hierarchy",
        "Avatar image-fallback",
        &[],
        20,
        3,
        Presentation::Inline,
        false,
        fixtures::avatar_fixture
    ),
    s!(
        "button/primary",
        Button,
        "Button",
        "Primary",
        CatalogTab::Widgets,
        "Actions",
        "Button primary",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "button/secondary",
        Button,
        "Button",
        "Secondary",
        CatalogTab::Widgets,
        "Actions",
        "Button secondary",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "button/ghost",
        Button,
        "Button",
        "Ghost",
        CatalogTab::Widgets,
        "Actions",
        "Button ghost",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "button/danger",
        Button,
        "Button",
        "Danger",
        CatalogTab::Widgets,
        "Actions",
        "Button danger",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "button/focused",
        Button,
        "Button",
        "Focused",
        CatalogTab::Widgets,
        "Actions",
        "Button focused",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "button/disabled",
        Button,
        "Button",
        "Disabled",
        CatalogTab::Widgets,
        "Actions",
        "Button disabled",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "button/loading",
        Button,
        "Button",
        "Loading",
        CatalogTab::Widgets,
        "Actions",
        "Button loading",
        &[],
        24,
        3,
        Presentation::Inline,
        false,
        fixtures::button_fixture,
        handlers::handle_button
    ),
    s!(
        "link/internal",
        Link,
        "Link",
        "Internal",
        CatalogTab::Widgets,
        "Actions",
        "Link internal",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::link_fixture,
        handlers::handle_link
    ),
    s!(
        "link/external",
        Link,
        "Link",
        "External",
        CatalogTab::Widgets,
        "Actions",
        "Link external",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::link_fixture,
        handlers::handle_link
    ),
    s!(
        "link/focused",
        Link,
        "Link",
        "Focused",
        CatalogTab::Widgets,
        "Actions",
        "Link focused",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::link_fixture,
        handlers::handle_link
    ),
    s!(
        "stack/column",
        Stack,
        "Stack",
        "Column",
        CatalogTab::Widgets,
        "Layout",
        "Stack column",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::stack_fixture
    ),
    s!(
        "stack/row",
        Stack,
        "Stack",
        "Row",
        CatalogTab::Widgets,
        "Layout",
        "Stack row",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::stack_fixture
    ),
    s!(
        "stack/wrap",
        Stack,
        "Stack",
        "Wrap",
        CatalogTab::Widgets,
        "Layout",
        "Stack wrap",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::stack_fixture
    ),
    s!(
        "card/basic",
        Card,
        "Card",
        "Basic",
        CatalogTab::Widgets,
        "Containment",
        "Card basic",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::card_fixture
    ),
    s!(
        "card/header-footer",
        Card,
        "Card",
        "Header-footer",
        CatalogTab::Widgets,
        "Containment",
        "Card header-footer",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::card_fixture
    ),
    s!(
        "card/emphasis",
        Card,
        "Card",
        "Emphasis",
        CatalogTab::Widgets,
        "Containment",
        "Card emphasis",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::card_fixture
    ),
    s!(
        "card/dense",
        Card,
        "Card",
        "Dense",
        CatalogTab::Widgets,
        "Containment",
        "Card dense",
        &[],
        40,
        8,
        Presentation::Inline,
        false,
        fixtures::card_fixture
    ),
    s!(
        "stat-card/default",
        StatCard,
        "StatCard",
        "Default",
        CatalogTab::Widgets,
        "Containment",
        "StatCard default",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::stat_card_fixture
    ),
    s!(
        "stat-card/accent",
        StatCard,
        "StatCard",
        "Accent",
        CatalogTab::Widgets,
        "Containment",
        "StatCard accent",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::stat_card_fixture
    ),
    s!(
        "stat-card/accent-2",
        StatCard,
        "StatCard",
        "Accent-2",
        CatalogTab::Widgets,
        "Containment",
        "StatCard accent-2",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::stat_card_fixture
    ),
    s!(
        "stat-card/row",
        StatCard,
        "StatCard",
        "Row",
        CatalogTab::Widgets,
        "Containment",
        "StatCard row",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::stat_card_fixture
    ),
    s!(
        "alert/info",
        Alert,
        "Alert",
        "Info",
        CatalogTab::Widgets,
        "Feedback",
        "Alert info",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::alert_fixture
    ),
    s!(
        "alert/success",
        Alert,
        "Alert",
        "Success",
        CatalogTab::Widgets,
        "Feedback",
        "Alert success",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::alert_fixture
    ),
    s!(
        "alert/warning",
        Alert,
        "Alert",
        "Warning",
        CatalogTab::Widgets,
        "Feedback",
        "Alert warning",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::alert_fixture
    ),
    s!(
        "alert/error",
        Alert,
        "Alert",
        "Error",
        CatalogTab::Widgets,
        "Feedback",
        "Alert error",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::alert_fixture
    ),
    s!(
        "spinner/frozen",
        Spinner,
        "Spinner",
        "Frozen",
        CatalogTab::Widgets,
        "Feedback",
        "Spinner frozen",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::spinner_fixture
    ),
    s!(
        "spinner/animated",
        Spinner,
        "Spinner",
        "Animated",
        CatalogTab::Widgets,
        "Feedback",
        "Spinner animated",
        &[],
        24,
        1,
        Presentation::Inline,
        true,
        fixtures::spinner_fixture
    ),
    s!(
        "spinner/ascii",
        Spinner,
        "Spinner",
        "Ascii",
        CatalogTab::Widgets,
        "Feedback",
        "Spinner ascii",
        &[],
        24,
        1,
        Presentation::Inline,
        false,
        fixtures::spinner_fixture
    ),
    s!(
        "progress/determinate",
        Progress,
        "Progress",
        "Determinate",
        CatalogTab::Widgets,
        "Feedback",
        "Progress determinate",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::progress_fixture
    ),
    s!(
        "progress/indeterminate",
        Progress,
        "Progress",
        "Indeterminate",
        CatalogTab::Widgets,
        "Feedback",
        "Progress indeterminate",
        &[],
        40,
        3,
        Presentation::Inline,
        true,
        fixtures::progress_fixture
    ),
    s!(
        "progress/complete",
        Progress,
        "Progress",
        "Complete",
        CatalogTab::Widgets,
        "Feedback",
        "Progress complete",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::progress_fixture
    ),
    s!(
        "progress/error",
        Progress,
        "Progress",
        "Error",
        CatalogTab::Widgets,
        "Feedback",
        "Progress error",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::progress_fixture
    ),
    s!(
        "input/default",
        Input,
        "Input",
        "Default",
        CatalogTab::Widgets,
        "Forms",
        "Input default",
        &[],
        36,
        5,
        Presentation::Inline,
        false,
        fixtures::input_fixture,
        handlers::handle_input
    ),
    s!(
        "input/hint",
        Input,
        "Input",
        "Hint",
        CatalogTab::Widgets,
        "Forms",
        "Input hint",
        &[],
        36,
        5,
        Presentation::Inline,
        false,
        fixtures::input_fixture,
        handlers::handle_input
    ),
    s!(
        "input/error",
        Input,
        "Input",
        "Error",
        CatalogTab::Widgets,
        "Forms",
        "Input error",
        &[],
        36,
        5,
        Presentation::Inline,
        false,
        fixtures::input_fixture,
        handlers::handle_input
    ),
    s!(
        "input/focused",
        Input,
        "Input",
        "Focused",
        CatalogTab::Widgets,
        "Forms",
        "Input focused",
        &[],
        36,
        5,
        Presentation::Inline,
        false,
        fixtures::input_fixture,
        handlers::handle_input
    ),
    s!(
        "input/disabled",
        Input,
        "Input",
        "Disabled",
        CatalogTab::Widgets,
        "Forms",
        "Input disabled",
        &[],
        36,
        5,
        Presentation::Inline,
        false,
        fixtures::input_fixture,
        handlers::handle_input
    ),
    s!(
        "select/closed",
        Select,
        "Select",
        "Closed",
        CatalogTab::Widgets,
        "Forms",
        "Select closed",
        &[],
        36,
        9,
        Presentation::Inline,
        false,
        fixtures::select_fixture,
        handlers::handle_select
    ),
    s!(
        "select/open",
        Select,
        "Select",
        "Open",
        CatalogTab::Widgets,
        "Forms",
        "Select open",
        &[],
        36,
        9,
        Presentation::Inline,
        false,
        fixtures::select_fixture,
        handlers::handle_select
    ),
    s!(
        "select/selected",
        Select,
        "Select",
        "Selected",
        CatalogTab::Widgets,
        "Forms",
        "Select selected",
        &[],
        36,
        9,
        Presentation::Inline,
        false,
        fixtures::select_fixture,
        handlers::handle_select
    ),
    s!(
        "select/focused",
        Select,
        "Select",
        "Focused",
        CatalogTab::Widgets,
        "Forms",
        "Select focused",
        &[],
        36,
        9,
        Presentation::Inline,
        false,
        fixtures::select_fixture,
        handlers::handle_select
    ),
    s!(
        "select/disabled",
        Select,
        "Select",
        "Disabled",
        CatalogTab::Widgets,
        "Forms",
        "Select disabled",
        &[],
        36,
        9,
        Presentation::Inline,
        false,
        fixtures::select_fixture,
        handlers::handle_select
    ),
    s!(
        "checkbox/unchecked",
        Checkbox,
        "Checkbox",
        "Unchecked",
        CatalogTab::Widgets,
        "Forms",
        "Checkbox unchecked",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::checkbox_fixture,
        handlers::handle_checkbox
    ),
    s!(
        "checkbox/checked",
        Checkbox,
        "Checkbox",
        "Checked",
        CatalogTab::Widgets,
        "Forms",
        "Checkbox checked",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::checkbox_fixture,
        handlers::handle_checkbox
    ),
    s!(
        "checkbox/focused",
        Checkbox,
        "Checkbox",
        "Focused",
        CatalogTab::Widgets,
        "Forms",
        "Checkbox focused",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::checkbox_fixture,
        handlers::handle_checkbox
    ),
    s!(
        "checkbox/disabled-checked",
        Checkbox,
        "Checkbox",
        "Disabled-checked",
        CatalogTab::Widgets,
        "Forms",
        "Checkbox disabled-checked",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::checkbox_fixture,
        handlers::handle_checkbox
    ),
    s!(
        "radio/group",
        Radio,
        "Radio",
        "Group",
        CatalogTab::Widgets,
        "Forms",
        "Radio group",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::radio_fixture,
        handlers::handle_radio
    ),
    s!(
        "radio/selected",
        Radio,
        "Radio",
        "Selected",
        CatalogTab::Widgets,
        "Forms",
        "Radio selected",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::radio_fixture,
        handlers::handle_radio
    ),
    s!(
        "radio/focused",
        Radio,
        "Radio",
        "Focused",
        CatalogTab::Widgets,
        "Forms",
        "Radio focused",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::radio_fixture,
        handlers::handle_radio
    ),
    s!(
        "radio/disabled",
        Radio,
        "Radio",
        "Disabled",
        CatalogTab::Widgets,
        "Forms",
        "Radio disabled",
        &[],
        32,
        5,
        Presentation::Inline,
        false,
        fixtures::radio_fixture,
        handlers::handle_radio
    ),
    s!(
        "switch/off",
        Switch,
        "Switch",
        "Off",
        CatalogTab::Widgets,
        "Forms",
        "Switch off",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::switch_fixture,
        handlers::handle_switch
    ),
    s!(
        "switch/on",
        Switch,
        "Switch",
        "On",
        CatalogTab::Widgets,
        "Forms",
        "Switch on",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::switch_fixture,
        handlers::handle_switch
    ),
    s!(
        "switch/focused",
        Switch,
        "Switch",
        "Focused",
        CatalogTab::Widgets,
        "Forms",
        "Switch focused",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::switch_fixture,
        handlers::handle_switch
    ),
    s!(
        "switch/disabled",
        Switch,
        "Switch",
        "Disabled",
        CatalogTab::Widgets,
        "Forms",
        "Switch disabled",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::switch_fixture,
        handlers::handle_switch
    ),
    s!(
        "switch/labeled",
        Switch,
        "Switch",
        "Labeled",
        CatalogTab::Widgets,
        "Forms",
        "Switch labeled",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::switch_fixture,
        handlers::handle_switch
    ),
    s!(
        "tabs/first-active",
        Tabs,
        "Tabs",
        "First-active",
        CatalogTab::Widgets,
        "Navigation",
        "Tabs first-active",
        &[],
        48,
        3,
        Presentation::Inline,
        false,
        fixtures::tabs_fixture,
        handlers::handle_tabs
    ),
    s!(
        "tabs/second-active",
        Tabs,
        "Tabs",
        "Second-active",
        CatalogTab::Widgets,
        "Navigation",
        "Tabs second-active",
        &[],
        48,
        3,
        Presentation::Inline,
        false,
        fixtures::tabs_fixture,
        handlers::handle_tabs
    ),
    s!(
        "tabs/narrow",
        Tabs,
        "Tabs",
        "Narrow",
        CatalogTab::Widgets,
        "Navigation",
        "Tabs narrow",
        &[],
        48,
        3,
        Presentation::Inline,
        false,
        fixtures::tabs_fixture,
        handlers::handle_tabs
    ),
    s!(
        "breadcrumb/default",
        Breadcrumb,
        "Breadcrumb",
        "Default",
        CatalogTab::Widgets,
        "Navigation",
        "Breadcrumb default",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::breadcrumb_fixture
    ),
    s!(
        "breadcrumb/truncated",
        Breadcrumb,
        "Breadcrumb",
        "Truncated",
        CatalogTab::Widgets,
        "Navigation",
        "Breadcrumb truncated",
        &[],
        32,
        1,
        Presentation::Inline,
        false,
        fixtures::breadcrumb_fixture
    ),
    s!(
        "nav-bar/default",
        NavBar,
        "NavBar",
        "Default",
        CatalogTab::Widgets,
        "Navigation",
        "NavBar default",
        &[],
        60,
        3,
        Presentation::Inline,
        false,
        fixtures::nav_bar_fixture
    ),
    s!(
        "nav-bar/narrow",
        NavBar,
        "NavBar",
        "Narrow",
        CatalogTab::Widgets,
        "Navigation",
        "NavBar narrow",
        &[],
        60,
        3,
        Presentation::Inline,
        false,
        fixtures::nav_bar_fixture
    ),
    s!(
        "table/default",
        Table,
        "Table",
        "Default",
        CatalogTab::Widgets,
        "Data",
        "Table default",
        &[],
        60,
        10,
        Presentation::Inline,
        false,
        fixtures::table_fixture,
        handlers::handle_table
    ),
    s!(
        "table/rich-cells",
        Table,
        "Table",
        "Rich-cells",
        CatalogTab::Widgets,
        "Data",
        "Table rich-cells",
        &[],
        60,
        10,
        Presentation::Inline,
        false,
        fixtures::table_fixture,
        handlers::handle_table
    ),
    s!(
        "table/selected",
        Table,
        "Table",
        "Selected",
        CatalogTab::Widgets,
        "Data",
        "Table selected",
        &[],
        60,
        10,
        Presentation::Inline,
        false,
        fixtures::table_fixture,
        handlers::handle_table
    ),
    s!(
        "table/empty",
        Table,
        "Table",
        "Empty",
        CatalogTab::Widgets,
        "Data",
        "Table empty",
        &[],
        60,
        10,
        Presentation::Inline,
        false,
        fixtures::table_fixture,
        handlers::handle_table
    ),
    s!(
        "table/narrow",
        Table,
        "Table",
        "Narrow",
        CatalogTab::Widgets,
        "Data",
        "Table narrow",
        &[],
        60,
        10,
        Presentation::Inline,
        false,
        fixtures::table_fixture,
        handlers::handle_table
    ),
    s!(
        "timeline/basic",
        Timeline,
        "Timeline",
        "Basic",
        CatalogTab::Widgets,
        "Data",
        "Timeline basic",
        &[],
        48,
        10,
        Presentation::Inline,
        false,
        fixtures::timeline_fixture
    ),
    s!(
        "timeline/status",
        Timeline,
        "Timeline",
        "Status",
        CatalogTab::Widgets,
        "Data",
        "Timeline status",
        &[],
        48,
        10,
        Presentation::Inline,
        false,
        fixtures::timeline_fixture
    ),
    s!(
        "timeline/reverse",
        Timeline,
        "Timeline",
        "Reverse",
        CatalogTab::Widgets,
        "Data",
        "Timeline reverse",
        &[],
        48,
        10,
        Presentation::Inline,
        false,
        fixtures::timeline_fixture
    ),
    s!(
        "code-block/highlighted",
        CodeBlock,
        "CodeBlock",
        "Highlighted",
        CatalogTab::Widgets,
        "Data",
        "CodeBlock highlighted",
        &[],
        60,
        12,
        Presentation::Inline,
        false,
        fixtures::code_block_fixture
    ),
    s!(
        "code-block/plain",
        CodeBlock,
        "CodeBlock",
        "Plain",
        CatalogTab::Widgets,
        "Data",
        "CodeBlock plain",
        &[],
        60,
        12,
        Presentation::Inline,
        false,
        fixtures::code_block_fixture
    ),
    s!(
        "code-block/long-line",
        CodeBlock,
        "CodeBlock",
        "Long-line",
        CatalogTab::Widgets,
        "Data",
        "CodeBlock long-line",
        &[],
        60,
        12,
        Presentation::Inline,
        false,
        fixtures::code_block_fixture
    ),
    s!(
        "code-block/ascii",
        CodeBlock,
        "CodeBlock",
        "Ascii",
        CatalogTab::Widgets,
        "Data",
        "CodeBlock ascii",
        &[],
        60,
        12,
        Presentation::Inline,
        false,
        fixtures::code_block_fixture
    ),
    s!(
        "tooltip/closed",
        Tooltip,
        "Tooltip",
        "Closed",
        CatalogTab::Widgets,
        "Help",
        "Tooltip closed",
        &[],
        32,
        3,
        Presentation::Inline,
        false,
        fixtures::tooltip_fixture,
        handlers::handle_tooltip
    ),
    s!(
        "tooltip/help-open",
        Tooltip,
        "Tooltip",
        "Help-open",
        CatalogTab::Widgets,
        "Help",
        "Tooltip help-open",
        &[],
        32,
        3,
        Presentation::Inline,
        false,
        fixtures::tooltip_fixture,
        handlers::handle_tooltip
    ),
    s!(
        "tooltip/focused",
        Tooltip,
        "Tooltip",
        "Focused",
        CatalogTab::Widgets,
        "Help",
        "Tooltip focused",
        &[],
        32,
        3,
        Presentation::Inline,
        false,
        fixtures::tooltip_fixture,
        handlers::handle_tooltip
    ),
    s!(
        "modal/open",
        Modal,
        "Modal",
        "Open",
        CatalogTab::Widgets,
        "Layers",
        "Modal open",
        &[],
        60,
        16,
        Presentation::Modal {
            width_percent: 70,
            height_percent: 60
        },
        false,
        fixtures::modal_fixture,
        handlers::handle_modal
    ),
    s!(
        "modal/validation-error",
        Modal,
        "Modal",
        "Validation-error",
        CatalogTab::Widgets,
        "Layers",
        "Modal validation-error",
        &[],
        60,
        16,
        Presentation::Modal {
            width_percent: 70,
            height_percent: 60
        },
        false,
        fixtures::modal_fixture,
        handlers::handle_modal
    ),
    s!(
        "modal/minimum-size",
        Modal,
        "Modal",
        "Minimum-size",
        CatalogTab::Widgets,
        "Layers",
        "Modal minimum-size",
        &[],
        60,
        16,
        Presentation::Modal {
            width_percent: 70,
            height_percent: 60
        },
        false,
        fixtures::modal_fixture,
        handlers::handle_modal
    ),
    s!(
        "sheet/right",
        Sheet,
        "Sheet",
        "Right",
        CatalogTab::Widgets,
        "Layers",
        "Sheet right",
        &[],
        60,
        16,
        Presentation::Sheet {
            side: SheetSide::Right,
            width_percent: 40
        },
        false,
        fixtures::sheet_fixture,
        handlers::handle_sheet
    ),
    s!(
        "sheet/left",
        Sheet,
        "Sheet",
        "Left",
        CatalogTab::Widgets,
        "Layers",
        "Sheet left",
        &[],
        60,
        16,
        Presentation::Sheet {
            side: SheetSide::Left,
            width_percent: 40
        },
        false,
        fixtures::sheet_fixture,
        handlers::handle_sheet
    ),
    s!(
        "sheet/minimum-size",
        Sheet,
        "Sheet",
        "Minimum-size",
        CatalogTab::Widgets,
        "Layers",
        "Sheet minimum-size",
        &[],
        60,
        16,
        Presentation::Sheet {
            side: SheetSide::Right,
            width_percent: 40
        },
        false,
        fixtures::sheet_fixture,
        handlers::handle_sheet
    ),
    cv!(
        "pane/service-table",
        "Panes",
        "Service Table",
        CatalogTab::Panes,
        "PaneServiceTable",
        "Service table",
        &[],
        40,
        7,
        Presentation::Inline,
        false,
        fixtures::pane_service_table_fixture
    ),
    cv!(
        "pane/stat-row",
        "Panes",
        "Stat Row",
        CatalogTab::Panes,
        "PaneStatRow",
        "Stats row",
        &[],
        40,
        4,
        Presentation::Inline,
        false,
        fixtures::pane_stat_row_fixture
    ),
    cv!(
        "pane/activity",
        "Panes",
        "Activity",
        CatalogTab::Panes,
        "PaneActivity",
        "Activity feed",
        &[],
        40,
        5,
        Presentation::Inline,
        false,
        fixtures::pane_activity_fixture
    ),
    cv!(
        "pane/journal-following",
        "Panes",
        "Journal Following",
        CatalogTab::Panes,
        "PaneJournalFollowing",
        "Following journal",
        &[],
        40,
        5,
        Presentation::Inline,
        false,
        fixtures::pane_journal_fixture,
        handlers::handle_journal
    ),
    cv!(
        "pane/journal-pinned",
        "Panes",
        "Journal Pinned",
        CatalogTab::Panes,
        "PaneJournalPinned",
        "Pinned journal",
        &[],
        40,
        5,
        Presentation::Inline,
        false,
        fixtures::pane_journal_pinned_fixture,
        handlers::handle_journal
    ),
    cv!(
        "pane/actions",
        "Panes",
        "Actions",
        CatalogTab::Panes,
        "PaneActions",
        "Action buttons",
        &[],
        40,
        3,
        Presentation::Inline,
        false,
        fixtures::pane_actions_fixture
    ),
    cv!(
        "view/homelab-healthy",
        "Views",
        "Homelab Healthy",
        CatalogTab::Views,
        "ViewHomelabHealthy",
        "Healthy dashboard",
        &[],
        80,
        24,
        Presentation::Fullscreen,
        false,
        fixtures::homelab_view_healthy_fixture
    ),
    cv!(
        "view/homelab-degraded",
        "Views",
        "Homelab Degraded",
        CatalogTab::Views,
        "ViewHomelabDegraded",
        "Degraded dashboard",
        &[],
        80,
        24,
        Presentation::Fullscreen,
        false,
        fixtures::homelab_view_degraded_fixture
    ),
    cv!(
        "view/homelab-loading",
        "Views",
        "Homelab Loading",
        CatalogTab::Views,
        "ViewHomelabLoading",
        "Loading state",
        &[],
        80,
        24,
        Presentation::Fullscreen,
        false,
        fixtures::homelab_view_loading_fixture
    ),
    cv!(
        "view/homelab-empty",
        "Views",
        "Homelab Empty",
        CatalogTab::Views,
        "ViewHomelabEmpty",
        "Empty state",
        &[],
        80,
        24,
        Presentation::Fullscreen,
        false,
        fixtures::homelab_view_empty_fixture
    ),
    cv!(
        "view/homelab-error",
        "Views",
        "Homelab Error",
        CatalogTab::Views,
        "ViewHomelabError",
        "Error state",
        &[],
        80,
        24,
        Presentation::Fullscreen,
        false,
        fixtures::homelab_view_error_fixture
    ),
    cv!(
        "view/minimum-size",
        "Views",
        "Minimum Size",
        CatalogTab::Views,
        "ViewMinimumSize",
        "Minimum size fallback",
        &[],
        40,
        12,
        Presentation::Fullscreen,
        false,
        fixtures::homelab_view_fixture
    ),
];
pub(crate) fn validate_specs(
    store: &crate::component::TemplateStore,
    stories: &[StorySpec],
) -> Result<(), CatalogError> {
    let mut issues = Vec::new();

    let mut ids = std::collections::HashSet::new();
    for story in stories {
        if !ids.insert(story.id) {
            issues.push(CatalogIssue::DuplicateId(story.id));
        }
    }

    let mut labels = std::collections::HashSet::new();
    for story in stories {
        if !labels.insert((story.group, story.name)) {
            issues.push(CatalogIssue::DuplicateLabel {
                group: story.group,
                name: story.name,
            });
        }
    }

    for comp in ComponentId::ALL {
        if !stories.iter().any(|s| s.component == comp) {
            issues.push(CatalogIssue::MissingComponent(comp));
        }
    }

    for story in stories {
        if store.component(story.source).is_err() {
            issues.push(CatalogIssue::MissingTemplate {
                id: story.id,
                source: story.source,
            });
        }
        if story.min_width == 0 || story.min_height == 0 {
            issues.push(CatalogIssue::ZeroMinimumSize(story.id));
        }
        if is_interactive(story.component) && story.handle_event.is_none() {
            issues.push(CatalogIssue::MissingEventHandler(story.id));
        }
    }

    if issues.is_empty() {
        Ok(())
    } else {
        Err(CatalogError::Invalid(issues))
    }
}

pub fn validate_catalog() -> Result<(), CatalogError> {
    let store = crate::component::TemplateStore::load_embedded()?;
    validate_specs(&store, STORIES)
}

fn is_interactive(comp: ComponentId) -> bool {
    matches!(
        comp,
        ComponentId::Button
            | ComponentId::Input
            | ComponentId::Select
            | ComponentId::Checkbox
            | ComponentId::Radio
            | ComponentId::Switch
            | ComponentId::Tabs
            | ComponentId::Link
            | ComponentId::Table
            | ComponentId::Tooltip
            | ComponentId::Modal
            | ComponentId::Sheet
    )
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CatalogIssue {
    DuplicateId(&'static str),
    DuplicateLabel {
        group: &'static str,
        name: &'static str,
    },
    MissingComponent(ComponentId),
    MissingTemplate {
        id: &'static str,
        source: TemplateRef,
    },
    ZeroMinimumSize(&'static str),
    MissingEventHandler(&'static str),
}

#[derive(Debug, thiserror::Error)]
pub enum CatalogError {
    #[error("catalog validation failed")]
    Invalid(Vec<CatalogIssue>),
    #[error(transparent)]
    Component(#[from] crate::component::ComponentError),
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fixture() -> TemplateContext {
        TemplateContext::default()
    }

    #[test]
    fn validator_aggregates_independent_catalog_issues() {
        let stories = [
            StorySpec {
                id: "duplicate",
                component: ComponentId::Button,
                group: "Button",
                name: "Same",
                tab: CatalogTab::Widgets,
                section: "Actions",
                description: "invalid fixture",
                source: TemplateRef {
                    file: crate::component::TemplateFile::Atoms,
                    section: "Missing",
                },
                props: &[],
                min_width: 0,
                min_height: 1,
                presentation: Presentation::Inline,
                animated: false,
                fixture,
                handle_event: None,
            },
            StorySpec {
                id: "duplicate",
                component: ComponentId::Text,
                group: "Button",
                name: "Same",
                tab: CatalogTab::Widgets,
                section: "Hierarchy",
                description: "duplicate fixture",
                source: ComponentId::Text.template_ref(),
                props: &[],
                min_width: 1,
                min_height: 1,
                presentation: Presentation::Inline,
                animated: false,
                fixture,
                handle_event: None,
            },
        ];
        let store = crate::component::TemplateStore::load_embedded().unwrap();
        let CatalogError::Invalid(issues) = validate_specs(&store, &stories).unwrap_err() else {
            panic!("expected aggregated catalog issues");
        };

        assert!(issues.contains(&CatalogIssue::DuplicateId("duplicate")));
        assert!(issues.contains(&CatalogIssue::DuplicateLabel {
            group: "Button",
            name: "Same",
        }));
        assert!(issues.contains(&CatalogIssue::ZeroMinimumSize("duplicate")));
        assert!(issues.contains(&CatalogIssue::MissingEventHandler("duplicate")));
        assert!(issues.iter().any(|issue| matches!(
            issue,
            CatalogIssue::MissingTemplate {
                id: "duplicate",
                ..
            }
        )));
        assert!(issues.contains(&CatalogIssue::MissingComponent(ComponentId::Heading)));
    }
}
