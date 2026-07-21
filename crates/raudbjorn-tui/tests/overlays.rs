use raudbjorn_tui::{
    browser::dump_story,
    profile::{ColorProfile, GlyphProfile, TerminalProfile},
    theme::DARK,
};

fn profile() -> TerminalProfile {
    TerminalProfile::new(ColorProfile::TrueColor, GlyphProfile::Unicode)
}

fn occupied(line: &str, start: usize, width: usize) -> bool {
    line.chars()
        .skip(start)
        .take(width)
        .any(|character| !character.is_whitespace())
}

#[test]
fn modal_is_centered_at_seventy_by_sixty_percent() {
    let output = dump_story("modal/open", 60, 16, profile(), DARK).unwrap();
    let lines: Vec<_> = output.lines().collect();

    assert!(lines[0].trim().is_empty(), "modal must leave top backdrop");
    assert!(
        lines
            .iter()
            .skip(3)
            .take(10)
            .any(|line| line.contains("Restart jellyfin?")),
        "modal body must render inside the centered overlay"
    );
    assert!(
        lines
            .iter()
            .skip(3)
            .take(10)
            .all(|line| !occupied(line, 0, 9)),
        "70%-wide modal must leave a nine-column left backdrop at width 60"
    );
}

#[test]
fn sheet_anchor_changes_the_occupied_edge() {
    let left = dump_story("sheet/left", 60, 16, profile(), DARK).unwrap();
    let right = dump_story("sheet/right", 60, 16, profile(), DARK).unwrap();
    let left_lines: Vec<_> = left.lines().collect();
    let right_lines: Vec<_> = right.lines().collect();

    assert!(left_lines.iter().any(|line| occupied(line, 0, 24)));
    assert!(left_lines.iter().all(|line| !occupied(line, 24, 36)));
    assert!(right_lines.iter().all(|line| !occupied(line, 0, 36)));
    assert!(right_lines.iter().any(|line| occupied(line, 36, 24)));
}
