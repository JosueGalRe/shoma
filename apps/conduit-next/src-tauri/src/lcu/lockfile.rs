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
    let paths = lockfile_paths();
    eprintln!("[DEBUG] Searching for lockfile in {} paths", paths.len());
    for path in &paths {
        eprintln!("[DEBUG] Checking lockfile path: {}", path.display());
        if path.is_file() {
            eprintln!("[DEBUG] Found lockfile at: {}", path.display());
            return Some(path.clone());
        }
    }
    eprintln!("[DEBUG] No lockfile found in any path");
    None
}

pub fn parse_lockfile(path: impl AsRef<Path>) -> Result<LockfileInfo, LockfileError> {
    let path = path.as_ref();
    eprintln!("[DEBUG] Reading lockfile at: {}", path.display());
    let contents = read_lockfile(path).map_err(|source| {
        eprintln!("[DEBUG] Failed to read lockfile at {}: {}", path.display(), source);
        LockfileError::Read {
            path: path.to_path_buf(),
            source,
        }
    })?;
    eprintln!("[DEBUG] Lockfile contents length: {}", contents.len());

    parse_lockfile_contents(&contents).map_err(|e| {
        eprintln!("[DEBUG] Failed to parse lockfile: {}", e);
        e
    })
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
        eprintln!("[DEBUG] Polling for lockfile...");

        let current = match find_lockfile() {
            Some(path) => match parse_lockfile(&path) {
                Ok(info) => {
                    eprintln!("[DEBUG] Parsed lockfile: port={}, protocol={}", info.port, info.protocol);
                    Some(info)
                }
                Err(e) => {
                    eprintln!("[DEBUG] Failed to parse lockfile at {}: {}", path.display(), e);
                    None
                }
            },
            None => {
                eprintln!("[DEBUG] No lockfile found during poll");
                None
            }
        };

        match (&last_seen, &current) {
            (None, Some(info)) => {
                eprintln!("[DEBUG] Lockfile appeared");
                emit(LockfileEvent::Appeared(info.clone()));
            }
            (Some(previous), Some(info)) if previous != info => {
                eprintln!("[DEBUG] Lockfile changed");
                emit(LockfileEvent::Changed(info.clone()));
            }
            (Some(_), None) => {
                eprintln!("[DEBUG] Lockfile disappeared");
                emit(LockfileEvent::Disappeared);
            }
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

    if let Some(install_paths) = find_install_paths_from_riot_client_installs() {
        eprintln!("[DEBUG] Found {} install path(s) from RiotClientInstalls.json", install_paths.len());
        for install_path in install_paths {
            paths.push(install_path.join("lockfile"));
        }
    }

    if let Some(process_path) = find_install_path_from_process() {
        eprintln!("[DEBUG] Found install path from running process: {}", process_path.display());
        paths.push(process_path.join("lockfile"));
    }

    let static_paths = lockfile_paths_from_env(
        std::env::var("PROGRAMDATA").ok(),
        std::env::var("LOCALAPPDATA").ok(),
        dirs::home_dir(),
    );
    paths.extend(static_paths);

    paths
}

fn find_install_paths_from_riot_client_installs() -> Option<Vec<PathBuf>> {
    let program_data = std::env::var("PROGRAMDATA").ok()?;
    let installs_path = PathBuf::from(program_data)
        .join("Riot Games")
        .join("RiotClientInstalls.json");

    eprintln!("[DEBUG] Checking RiotClientInstalls.json at: {}", installs_path.display());

    if !installs_path.is_file() {
        eprintln!("[DEBUG] RiotClientInstalls.json not found");
        return None;
    }

    let contents = fs::read_to_string(&installs_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&contents).ok()?;

    let associated_client = json.get("associated_client")?.as_object()?;
    let mut install_paths = Vec::new();

    for (key, value) in associated_client {
        let value_str = value.as_str().unwrap_or("");
        if value_str.contains("LeagueClient") {
            let install_root = PathBuf::from(key);
            eprintln!("[DEBUG] Found League install path in RiotClientInstalls.json: {}", install_root.display());
            install_paths.push(install_root);
        }
    }

    if install_paths.is_empty() {
        None
    } else {
        Some(install_paths)
    }
}

fn find_install_path_from_process() -> Option<PathBuf> {
    let output = std::process::Command::new("powershell")
        .args(&[
            "-NoProfile",
            "-Command",
            "Get-Process LeagueClient -ErrorAction SilentlyContinue | Select-Object -First 1 | ForEach-Object { Split-Path $_.Path -Parent }"
        ])
        .output()
        .ok()?;

    let path_str = String::from_utf8(output.stdout).ok()?;
    let path_str = path_str.trim();

    if path_str.is_empty() {
        return None;
    }

    let path = PathBuf::from(path_str);
    if path.exists() {
        Some(path)
    } else {
        None
    }
}

fn lockfile_paths_from_env(
    program_data: Option<String>,
    local_app_data: Option<String>,
    home_dir: Option<PathBuf>,
) -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Some(program_data) = program_data {
        paths.push(
            PathBuf::from(program_data)
                .join("Riot Games")
                .join("League of Legends")
                .join("lockfile"),
        );
    }

    if let Some(local_app_data) = local_app_data {
        paths.push(
            PathBuf::from(local_app_data)
                .join("Riot Games")
                .join("League of Legends")
                .join("lockfile"),
        );
    }

    if let Some(home_dir) = home_dir {
        paths.push(
            home_dir
                .join("Library")
                .join("Application Support")
                .join("League of Legends")
                .join("lockfile"),
        );
    }

    for drive in 'C'..='Z' {
        paths.push(PathBuf::from(format!(r"{}:\Riot Games\League of Legends\lockfile", drive)));
        paths.push(PathBuf::from(format!(r"{}:\Program Files\Riot Games\League of Legends\lockfile", drive)));
        paths.push(PathBuf::from(format!(r"{}:\Program Files (x86)\Riot Games\League of Legends\lockfile", drive)));
    }

    paths.push(PathBuf::from("/Applications/League of Legends.app/Contents/LoL/lockfile"));

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

    #[test]
    fn includes_windows_local_app_data_lockfile_path() {
        let local_app_data = PathBuf::from(r"C:\Users\player\AppData\Local");
        let paths = lockfile_paths_from_env(
            None,
            Some(local_app_data.to_string_lossy().to_string()),
            None,
        );
        let expected = local_app_data
            .join("Riot Games")
            .join("League of Legends")
            .join("lockfile");

        assert!(paths.contains(&expected));
    }

    fn temp_lockfile_path(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "mimic-{name}-{}-{}",
            std::process::id(),
            unique_suffix()
        ))
    }
}
