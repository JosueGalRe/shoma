use rsa::pkcs8::{DecodePrivateKey, EncodePrivateKey, LineEnding};
use rsa::RsaPrivateKey;
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

#[cfg(test)]
use std::sync::{Mutex, MutexGuard, OnceLock};

#[cfg(test)]
static DEVICE_PATH_OVERRIDE: OnceLock<Mutex<Option<PathBuf>>> = OnceLock::new();
#[cfg(test)]
static DEVICE_PATH_TEST_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub type Result<T> = std::result::Result<T, PersistenceError>;

#[derive(Debug, thiserror::Error)]
pub enum PersistenceError {
    #[error("could not determine user config directory")]
    MissingConfigDir,
    #[error("I/O error while accessing persisted RSA keys")]
    Io(#[from] std::io::Error),
    #[error("failed to encode RSA key as PKCS#8 PEM")]
    EncodeKey(#[from] rsa::pkcs8::Error),
}

pub fn get_or_generate_rsa_keys() -> Result<RsaPrivateKey> {
    let key_path = key_path()?;

    if key_path.exists() {
        if let Ok(contents) = fs::read_to_string(&key_path) {
            if let Ok(private_key) = RsaPrivateKey::from_pkcs8_pem(&contents) {
                return Ok(private_key);
            }
        }
    }

    generate_and_store_keys(&key_path)
}

pub fn get_hub_code() -> Result<Option<String>> {
    let Some(token) = get_hub_token()? else {
        return Ok(None);
    };

    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() != 3 {
        return Ok(None);
    }

    let payload = parts[1];

    // We need to pad to the nearest multiple of 4
    let mut padded = payload.to_string();
    while padded.len() % 4 != 0 {
        padded.push('=');
    }

    use base64::{engine::general_purpose::URL_SAFE, Engine as _};
    let decoded = URL_SAFE.decode(padded).unwrap_or_default();

    let json: serde_json::Value =
        serde_json::from_slice(&decoded).unwrap_or(serde_json::Value::Null);
    if let Some(code) = json.get("code").and_then(|c| c.as_str()) {
        Ok(Some(code.to_string()))
    } else {
        Ok(None)
    }
}

pub fn get_hub_token() -> Result<Option<String>> {
    let token_path = token_path()?;

    if !token_path.exists() {
        return Ok(None);
    }

    Ok(Some(fs::read_to_string(token_path)?))
}

pub fn set_hub_token(token: &str) -> Result<()> {
    let token_path = token_path()?;

    if let Some(parent) = token_path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(token_path, token)?;
    Ok(())
}

pub fn is_device_approved(identity: &str) -> bool {
    let Ok(device_path) = device_path() else {
        return false;
    };

    let Ok(contents) = fs::read_to_string(device_path) else {
        return false;
    };

    contents.lines().any(|approved| approved == identity)
}

pub fn approve_device(identity: &str) -> Result<()> {
    let device_path = device_path()?;

    if let Some(parent) = device_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let mut devices = OpenOptions::new()
        .create(true)
        .append(true)
        .open(device_path)?;
    writeln!(devices, "{identity}")?;

    Ok(())
}

fn key_path() -> Result<PathBuf> {
    Ok(dirs::config_dir()
        .ok_or(PersistenceError::MissingConfigDir)?
        .join("Shoma")
        .join("keys.pem"))
}

fn token_path() -> Result<PathBuf> {
    Ok(dirs::config_dir()
        .ok_or(PersistenceError::MissingConfigDir)?
        .join("Shoma")
        .join("token"))
}

fn device_path() -> Result<PathBuf> {
    #[cfg(test)]
    if let Some(path) = DEVICE_PATH_OVERRIDE
        .get_or_init(|| Mutex::new(None))
        .lock()
        .expect("device path override should not be poisoned")
        .clone()
    {
        return Ok(path);
    }

    Ok(dirs::config_dir()
        .ok_or(PersistenceError::MissingConfigDir)?
        .join("Shoma")
        .join("devices"))
}

#[cfg(test)]
pub(crate) fn set_device_path_override(path: Option<PathBuf>) {
    *DEVICE_PATH_OVERRIDE
        .get_or_init(|| Mutex::new(None))
        .lock()
        .expect("device path override should not be poisoned") = path;
}

#[cfg(test)]
pub(crate) fn device_path_test_guard() -> MutexGuard<'static, ()> {
    DEVICE_PATH_TEST_LOCK
        .get_or_init(|| Mutex::new(()))
        .lock()
        .expect("device path test lock should not be poisoned")
}

fn generate_and_store_keys(key_path: &PathBuf) -> Result<RsaPrivateKey> {
    let mut rng = rand::rngs::OsRng;
    let private_key = RsaPrivateKey::new(&mut rng, 2048).map_err(|error| {
        std::io::Error::new(
            std::io::ErrorKind::Other,
            format!("RSA key generation failed: {error}"),
        )
    })?;
    let pem = private_key.to_pkcs8_pem(LineEnding::LF)?;

    if let Some(parent) = key_path.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(key_path, pem.as_bytes())?;

    Ok(private_key)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::export_public_key;
    use rsa::pkcs8::DecodePrivateKey;
    #[test]
    fn generated_keys_are_pkcs8_pem_and_reloadable() {
        let temp_dir = std::env::temp_dir().join(format!(
            "mimic-rsa-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock should be after epoch")
                .as_nanos()
        ));
        let key_path = temp_dir.join("Shoma").join("keys.pem");

        let generated = generate_and_store_keys(&key_path).expect("key generation should work");
        let pem = fs::read_to_string(&key_path).expect("key file should be written");
        let loaded = RsaPrivateKey::from_pkcs8_pem(&pem).expect("key file should be PKCS#8 PEM");

        assert!(pem.starts_with("-----BEGIN PRIVATE KEY-----"));
        assert_eq!(
            export_public_key(&generated).unwrap(),
            export_public_key(&loaded).unwrap()
        );

        fs::remove_dir_all(temp_dir).expect("temporary key directory should be removed");
    }

    #[test]
    fn is_device_approved_reads_identity_from_devices_file() {
        let _guard = device_path_test_guard();
        let temp_dir = temp_config_dir("mimic-devices-read-test");
        set_device_path_override(Some(temp_dir.join("Shoma").join("devices")));

        let devices_dir = temp_dir.join("Shoma");
        fs::create_dir_all(&devices_dir).expect("devices directory should be created");
        fs::write(devices_dir.join("devices"), "device-a\ndevice-b\n")
            .expect("devices file should be written");

        assert!(is_device_approved("device-b"));
        assert!(!is_device_approved("device-c"));

        set_device_path_override(None);
        fs::remove_dir_all(temp_dir).expect("temporary devices directory should be removed");
    }

    #[test]
    fn approve_device_appends_identity_to_devices_file() {
        let _guard = device_path_test_guard();
        let temp_dir = temp_config_dir("mimic-devices-approve-test");
        set_device_path_override(Some(temp_dir.join("Shoma").join("devices")));

        approve_device("device-a").expect("device should be approved");
        approve_device("device-b").expect("second device should be approved");

        let devices = fs::read_to_string(temp_dir.join("Shoma").join("devices"))
            .expect("devices file should be readable");
        assert_eq!(devices, "device-a\ndevice-b\n");
        assert!(is_device_approved("device-a"));

        set_device_path_override(None);
        fs::remove_dir_all(temp_dir).expect("temporary devices directory should be removed");
    }

    fn temp_config_dir(prefix: &str) -> PathBuf {
        std::env::temp_dir().join(format!(
            "{prefix}-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("system clock should be after epoch")
                .as_nanos()
        ))
    }
}
