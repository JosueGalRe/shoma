use std::{
    fs, io,
    path::{Path, PathBuf},
    time::Duration,
};

use thiserror::Error;
use tokio::time::{interval, MissedTickBehavior};

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LockfileInfo {
    pub name: String,
    pub pid: u32,
    pub port: u16,
    pub password: String,
    pub protocol: String,
}

#[derive(Debug, Error)]
pub enum LockfileError {
    #[error("failed to read lockfile at {path}: {source}")]
    Read { path: PathBuf, source: io::Error },
    #[error("invalid lockfile format: expected name:pid:port:password:protocol")]
    InvalidFormat,
    #[error("invalid process id in lockfile: {0}")]
    InvalidPid(#[source] std::num::ParseIntError),
    #[error("invalid port in lockfile: {0}")]
    InvalidPort(#[source] std::num::ParseIntError),
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LockfileEvent {
    Appeared(LockfileInfo),
    Changed(LockfileInfo),
    Disappeared,
}

pub fn find_lockfile() -> Option<PathBuf> {
    lockfile_paths().into_iter().find(|path| path.is_file())
}

pub fn parse_lockfile(path: impl AsRef<Path>) -> Result<LockfileInfo, LockfileError> {
    let path = path.as_ref();
    let contents = read_lockfile(path).map_err(|source| LockfileError::Read {
        path: path.to_path_buf(),
        source,
    })?;

    parse_lockfile_contents(&contents)
}

pub async fn watch_lockfile<F>(poll_interval: Duration, mut emit: F)
where
    F: FnMut(LockfileEvent),
{
    let mut ticker = interval(poll_interval);
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

    let mut last_seen: Option<LockfileInfo> = None;

    loop {
        ticker.tick().await;

        let current = find_lockfile().and_then(|path| parse_lockfile(path).ok());

        match (&last_seen, &current) {
            (None, Some(info)) => emit(LockfileEvent::Appeared(info.clone())),
            (Some(previous), Some(info)) if previous != info => {
                emit(LockfileEvent::Changed(info.clone()))
            }
            (Some(_), None) => emit(LockfileEvent::Disappeared),
            _ => {}
        }

        last_seen = current;
    }
}

fn parse_lockfile_contents(contents: &str) -> Result<LockfileInfo, LockfileError> {
    let parts = contents.trim().split(':').collect::<Vec<_>>();

    if parts.len() != 5 || parts.iter().any(|part| part.is_empty()) {
        return Err(LockfileError::InvalidFormat);
    }

    Ok(LockfileInfo {
        name: parts[0].to_string(),
        pid: parts[1].parse().map_err(LockfileError::InvalidPid)?,
        port: parts[2].parse().map_err(LockfileError::InvalidPort)?,
        password: parts[3].to_string(),
        protocol: parts[4].to_string(),
    })
}

fn read_lockfile(path: &Path) -> io::Result<String> {
    match fs::read_to_string(path) {
        Ok(contents) => Ok(contents),
        Err(primary_error) => read_lockfile_via_copy(path).map_err(|_| primary_error),
    }
}

fn read_lockfile_via_copy(path: &Path) -> io::Result<String> {
    let copy_path = std::env::temp_dir().join(format!(
        "mimic-lcu-lockfile-{}-{}",
        std::process::id(),
        unique_suffix()
    ));

    fs::copy(path, &copy_path)?;
    let contents = fs::read_to_string(&copy_path);
    let _ = fs::remove_file(&copy_path);

    contents
}

fn unique_suffix() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default()
}

fn lockfile_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(program_data) = std::env::var("PROGRAMDATA") {
        paths.push(
            PathBuf::from(program_data)
                .join("Riot Games")
                .join("League of Legends")
                .join("lockfile"),
        );
    }

    if let Some(home_dir) = dirs::home_dir() {
        paths.push(
            home_dir
                .join("Library")
                .join("Application Support")
                .join("League of Legends")
                .join("lockfile"),
        );
    }

    paths.extend([
        PathBuf::from(r"C:\Riot Games\League of Legends\lockfile"),
        PathBuf::from(r"C:\Program Files\Riot Games\League of Legends\lockfile"),
        PathBuf::from("/Applications/League of Legends.app/Contents/LoL/lockfile"),
    ]);

    paths
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_lockfile_content() {
        let info = parse_lockfile_contents("LeagueClient:1234:5678:secret:https").unwrap();

        assert_eq!(
            info,
            LockfileInfo {
                name: "LeagueClient".to_string(),
                pid: 1234,
                port: 5678,
                password: "secret".to_string(),
                protocol: "https".to_string(),
            }
        );
    }

    #[test]
    fn parses_lockfile_from_path() {
        let path = temp_lockfile_path("parse-lockfile");
        fs::write(&path, "LeagueClientUx:4321:2999:password:http\n").unwrap();

        let info = parse_lockfile(&path).unwrap();
        let _ = fs::remove_file(&path);

        assert_eq!(info.name, "LeagueClientUx");
        assert_eq!(info.pid, 4321);
        assert_eq!(info.port, 2999);
        assert_eq!(info.password, "password");
        assert_eq!(info.protocol, "http");
    }

    #[test]
    fn rejects_missing_fields() {
        let error = parse_lockfile_contents("LeagueClient:1234:5678:secret").unwrap_err();

        assert!(matches!(error, LockfileError::InvalidFormat));
    }

    #[test]
    fn rejects_invalid_pid() {
        let error =
            parse_lockfile_contents("LeagueClient:not-a-pid:5678:secret:https").unwrap_err();

        assert!(matches!(error, LockfileError::InvalidPid(_)));
    }

    #[test]
    fn rejects_invalid_port() {
        let error =
            parse_lockfile_contents("LeagueClient:1234:not-a-port:secret:https").unwrap_err();

        assert!(matches!(error, LockfileError::InvalidPort(_)));
    }

    fn temp_lockfile_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "mimic-{name}-{}-{}",
            std::process::id(),
            unique_suffix()
        ))
    }
}
