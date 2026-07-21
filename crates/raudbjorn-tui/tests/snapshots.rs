mod support;

use std::{collections::BTreeSet, path::PathBuf};

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::{Color, Modifier, Style},
};
use raudbjorn_tui::{
    catalog::{CatalogTab, STORIES, StorySpec},
    component::ComponentId,
    profile::{ColorProfile, GlyphProfile, TerminalProfile},
    theme::{DARK, LIGHT, TerminalPalette},
};
use support::{
    assert_buffer_snapshot, frozen_story_context, profile, render_context_with_palette,
    serialize_buffer, snapshot_path,
};

const TRUECOLOR: TerminalProfile = profile(ColorProfile::TrueColor, GlyphProfile::Unicode);
const THEMES: [(&str, TerminalPalette); 2] = [("dark", DARK), ("light", LIGHT)];
const VIEW_COLORS: [ColorProfile; 3] = [
    ColorProfile::TrueColor,
    ColorProfile::Ansi16,
    ColorProfile::Mono,
];
const MAX_RELEASE_SNAPSHOTS: usize = 1_000;

#[derive(Clone, Copy)]
struct SnapshotCase {
    story: &'static StorySpec,
    theme_name: &'static str,
    palette: TerminalPalette,
    profile: TerminalProfile,
    size: (u16, u16),
}

fn add_case(cases: &mut Vec<SnapshotCase>, seen: &mut BTreeSet<PathBuf>, case: SnapshotCase) {
    let path = snapshot_path(case.story.id, case.theme_name, case.profile, case.size);
    if seen.insert(path) {
        cases.push(case);
    }
}

fn target_cases() -> Vec<SnapshotCase> {
    let mut cases = Vec::new();
    for story in STORIES {
        for (theme_name, palette) in THEMES {
            cases.push(SnapshotCase {
                story,
                theme_name,
                palette,
                profile: TRUECOLOR,
                size: (story.min_width, story.min_height),
            });
        }
    }
    cases
}

fn is_status_component(component: ComponentId) -> bool {
    matches!(
        component,
        ComponentId::Badge
            | ComponentId::Alert
            | ComponentId::Progress
            | ComponentId::Table
            | ComponentId::Timeline
    )
}

fn is_glyph_heavy(component: ComponentId) -> bool {
    matches!(
        component,
        ComponentId::Icon
            | ComponentId::Kbd
            | ComponentId::Spinner
            | ComponentId::Radio
            | ComponentId::Breadcrumb
            | ComponentId::Table
            | ComponentId::Timeline
    )
}

fn release_cases() -> Vec<SnapshotCase> {
    let mut cases = target_cases();
    let mut seen = cases
        .iter()
        .map(|case| snapshot_path(case.story.id, case.theme_name, case.profile, case.size))
        .collect::<BTreeSet<_>>();

    for story in STORIES {
        let minimum = (story.min_width, story.min_height);
        let expanded = (story.min_width.max(120), story.min_height.max(40));

        for (theme_name, palette) in THEMES {
            if story.handle_event.is_some() || story.animated {
                add_case(
                    &mut cases,
                    &mut seen,
                    SnapshotCase {
                        story,
                        theme_name,
                        palette,
                        profile: profile(ColorProfile::Mono, GlyphProfile::Unicode),
                        size: minimum,
                    },
                );
                add_case(
                    &mut cases,
                    &mut seen,
                    SnapshotCase {
                        story,
                        theme_name,
                        palette,
                        profile: TRUECOLOR,
                        size: expanded,
                    },
                );
            }

            if is_status_component(story.component) {
                for color in [
                    ColorProfile::Ansi16,
                    ColorProfile::Ansi8,
                    ColorProfile::Mono,
                    ColorProfile::NoColor,
                ] {
                    add_case(
                        &mut cases,
                        &mut seen,
                        SnapshotCase {
                            story,
                            theme_name,
                            palette,
                            profile: profile(color, GlyphProfile::Unicode),
                            size: minimum,
                        },
                    );
                }
            }

            if is_glyph_heavy(story.component) {
                add_case(
                    &mut cases,
                    &mut seen,
                    SnapshotCase {
                        story,
                        theme_name,
                        palette,
                        profile: profile(ColorProfile::TrueColor, GlyphProfile::Ascii),
                        size: minimum,
                    },
                );
            }
        }
    }

    for story in STORIES
        .iter()
        .filter(|story| story.tab == CatalogTab::Views)
    {
        for size in [(40, 12), (80, 24), (120, 30), (160, 50)] {
            for (theme_name, palette) in THEMES {
                for color in VIEW_COLORS {
                    add_case(
                        &mut cases,
                        &mut seen,
                        SnapshotCase {
                            story,
                            theme_name,
                            palette,
                            profile: profile(color, GlyphProfile::Unicode),
                            size,
                        },
                    );
                }
            }
        }
    }
    cases
}

fn render_case(case: SnapshotCase) {
    let ctx = frozen_story_context(case.story);
    let buffer =
        render_context_with_palette(case.story, &ctx, case.profile, case.size, case.palette);
    assert_buffer_snapshot(
        case.story.id,
        case.theme_name,
        case.profile,
        case.size,
        &buffer,
    );
}

fn verify_snapshot_manifest(cases: &[SnapshotCase]) {
    let expected = cases
        .iter()
        .map(|case| snapshot_path(case.story.id, case.theme_name, case.profile, case.size))
        .collect::<BTreeSet<_>>();
    let directory = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/snapshots");
    let actual = std::fs::read_dir(&directory)
        .unwrap_or_else(|error| panic!("failed to read {}: {error}", directory.display()))
        .map(|entry| {
            entry
                .expect("snapshot directory entry must be readable")
                .path()
        })
        .filter(|path| {
            path.extension()
                .is_some_and(|extension| extension == "snap")
        })
        .collect::<BTreeSet<_>>();

    if std::env::var_os("UPDATE_SNAPSHOTS").is_some() {
        for stale in actual.difference(&expected) {
            std::fs::remove_file(stale)
                .unwrap_or_else(|error| panic!("failed to remove {}: {error}", stale.display()));
        }
    } else {
        assert_eq!(
            actual, expected,
            "snapshot manifest contains missing or stale fixtures"
        );
    }
}

#[test]
fn structured_snapshot_serializes_every_cell_row_major() {
    let mut buffer = Buffer::empty(Rect::new(2, 3, 2, 1));
    buffer[(2, 3)].set_symbol("|").set_style(
        Style::default()
            .fg(Color::Red)
            .underline_color(Color::Blue)
            .add_modifier(Modifier::BOLD),
    );
    buffer[(3, 3)].set_symbol("\\");

    assert_eq!(
        serialize_buffer(&buffer),
        "width=2 height=1\n2,3:\\||Red|Reset|Blue|BOLD\n3,3:\\\\|Reset|Reset|Reset|NONE\n"
    );
}

#[test]
fn snapshot_target_matrix() {
    for case in target_cases() {
        render_case(case);
    }
}

#[test]
fn snapshot_plan_is_bounded_and_complete() {
    let cases = release_cases();
    assert!(
        cases.len() <= MAX_RELEASE_SNAPSHOTS,
        "risk-selected matrix unexpectedly grew to {} snapshots",
        cases.len()
    );

    for story in STORIES {
        let minimum = (story.min_width, story.min_height);
        let expanded = (story.min_width.max(120), story.min_height.max(40));

        for (theme_name, _) in THEMES {
            let contains = |terminal_profile, size| {
                cases.iter().any(|case| {
                    case.story.id == story.id
                        && case.theme_name == theme_name
                        && case.profile == terminal_profile
                        && case.size == size
                })
            };

            assert!(contains(TRUECOLOR, minimum));

            if story.handle_event.is_some() || story.animated {
                assert!(contains(
                    profile(ColorProfile::Mono, GlyphProfile::Unicode),
                    minimum
                ));
                assert!(contains(TRUECOLOR, expanded));
            }

            if is_status_component(story.component) {
                for color in [
                    ColorProfile::Ansi16,
                    ColorProfile::Ansi8,
                    ColorProfile::Mono,
                    ColorProfile::NoColor,
                ] {
                    assert!(contains(profile(color, GlyphProfile::Unicode), minimum));
                }
            }

            if is_glyph_heavy(story.component) {
                assert!(contains(
                    profile(ColorProfile::TrueColor, GlyphProfile::Ascii),
                    minimum
                ));
            }

            if story.tab == CatalogTab::Views {
                for size in [(40, 12), (80, 24), (120, 30), (160, 50)] {
                    for color in VIEW_COLORS {
                        assert!(contains(profile(color, GlyphProfile::Unicode), size));
                    }
                }
            }
        }
    }
}

#[test]
fn snapshot_release_matrix() {
    let cases = release_cases();
    for case in cases.iter().copied() {
        render_case(case);
    }
    verify_snapshot_manifest(&cases);
}
