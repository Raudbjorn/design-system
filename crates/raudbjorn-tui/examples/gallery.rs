use std::{error::Error, io};

use raudbjorn_tui::{
    browser::{dump_story, list_text, run, run_story},
    profile::TerminalProfile,
    theme::DARK,
};

#[derive(Debug, Clone, PartialEq, Eq)]
enum Command {
    Run,
    RunStory(String),
    List,
    Dump {
        story_id: String,
        width: u16,
        height: u16,
    },
}

fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let profile = TerminalProfile::from_env()?;

    match parse_command(&args)? {
        Command::Run => run(profile)?,
        Command::RunStory(story_id) => run_story(profile, &story_id)?,
        Command::List => print!("{}", list_text()?),
        Command::Dump {
            story_id,
            width,
            height,
        } => print!("{}", dump_story(&story_id, width, height, profile, DARK)?),
    }

    Ok(())
}

fn parse_command(args: &[String]) -> Result<Command, io::Error> {
    let Some(option) = args.first().map(String::as_str) else {
        return Ok(Command::Run);
    };

    match option {
        "--list" if args.len() == 1 => Ok(Command::List),
        "--list" => Err(invalid("--list does not accept arguments")),
        "--story" if args.len() == 2 => Ok(Command::RunStory(args[1].clone())),
        "--story" => Err(invalid("--story requires exactly one story ID")),
        "--dump" if args.len() >= 2 => {
            let (width, height) = parse_size_flags(&args[2..])?;
            Ok(Command::Dump {
                story_id: args[1].clone(),
                width,
                height,
            })
        }
        "--dump" => Err(invalid("--dump requires a story ID")),
        _ => Err(invalid(&format!("unknown argument: {option}"))),
    }
}

fn parse_size_flags(args: &[String]) -> Result<(u16, u16), io::Error> {
    let mut width = 80_u16;
    let mut height = 24_u16;
    let mut index = 0;
    while index < args.len() {
        let value = args
            .get(index + 1)
            .ok_or_else(|| invalid(&format!("{} requires a value", args[index])))?;
        let parsed = value
            .parse::<u16>()
            .map_err(|_| invalid(&format!("invalid size value: {value}")))?;
        match args[index].as_str() {
            "--width" => width = parsed,
            "--height" => height = parsed,
            option => return Err(invalid(&format!("unknown dump argument: {option}"))),
        }
        index += 2;
    }
    Ok((width, height))
}

fn invalid(message: &str) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidInput, message)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_interactive_story_selection() {
        let args = vec!["--story".to_owned(), "modal/open".to_owned()];
        assert_eq!(
            parse_command(&args).unwrap(),
            Command::RunStory("modal/open".to_owned())
        );
    }

    #[test]
    fn parses_sized_dump() {
        let args = vec![
            "--dump".to_owned(),
            "text/default".to_owned(),
            "--width".to_owned(),
            "120".to_owned(),
            "--height".to_owned(),
            "30".to_owned(),
        ];
        assert_eq!(
            parse_command(&args).unwrap(),
            Command::Dump {
                story_id: "text/default".to_owned(),
                width: 120,
                height: 30,
            }
        );
    }

    #[test]
    fn rejects_extra_story_arguments() {
        let args = vec![
            "--story".to_owned(),
            "text/default".to_owned(),
            "extra".to_owned(),
        ];
        assert!(parse_command(&args).is_err());
    }
}
