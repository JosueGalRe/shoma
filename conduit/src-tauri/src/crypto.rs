use aes::{Aes128, Aes192, Aes256};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use cbc::cipher::block_padding::Pkcs7;
use cbc::cipher::{BlockDecryptMut, BlockEncryptMut, KeyIvInit};
use rand::{rngs::OsRng, RngCore};
use rsa::pkcs8::EncodePublicKey;
use rsa::{Oaep, RsaPrivateKey, RsaPublicKey};
use sha1::Sha1;
use thiserror::Error;

type Aes256CbcEnc = cbc::Encryptor<Aes256>;
type Aes256CbcDec = cbc::Decryptor<Aes256>;
type Aes192CbcEnc = cbc::Encryptor<Aes192>;
type Aes192CbcDec = cbc::Decryptor<Aes192>;
type Aes128CbcEnc = cbc::Encryptor<Aes128>;
type Aes128CbcDec = cbc::Decryptor<Aes128>;

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("invalid encrypted payload format")]
    InvalidFormat,
    #[error("invalid base64 payload")]
    InvalidBase64,
    #[error("invalid AES key")]
    InvalidAesKey,
    #[error("invalid AES padding")]
    InvalidPadding,
    #[error("invalid UTF-8 plaintext")]
    InvalidUtf8,
}

pub fn export_public_key(rsa: &RsaPrivateKey) -> Result<String, CryptoError> {
    let public_key = RsaPublicKey::from(rsa);
    let der = public_key
        .to_public_key_der()
        .map_err(|_| CryptoError::InvalidFormat)?;

    Ok(STANDARD.encode(der.as_bytes()))
}

pub fn decrypt_rsa(private_key: &RsaPrivateKey, base64: &str) -> Option<String> {
    let ciphertext = STANDARD.decode(base64).ok()?;
    let plaintext = private_key.decrypt(Oaep::new::<Sha1>(), &ciphertext).ok()?;

    String::from_utf8(plaintext).ok()
}

pub fn decrypt_aes(key: &[u8], base64: &str) -> Result<String, CryptoError> {
    let (iv, payload) = base64.split_once(':').ok_or(CryptoError::InvalidFormat)?;
    let iv = STANDARD
        .decode(iv)
        .map_err(|_| CryptoError::InvalidBase64)?;
    let ciphertext = STANDARD
        .decode(payload)
        .map_err(|_| CryptoError::InvalidBase64)?;
    let mut buffer = ciphertext;
    let plaintext = match key.len() {
        16 => Aes128CbcDec::new_from_slices(key, &iv)
            .map_err(|_| CryptoError::InvalidFormat)?
            .decrypt_padded_mut::<Pkcs7>(&mut buffer)
            .map_err(|_| CryptoError::InvalidPadding)?,
        24 => Aes192CbcDec::new_from_slices(key, &iv)
            .map_err(|_| CryptoError::InvalidFormat)?
            .decrypt_padded_mut::<Pkcs7>(&mut buffer)
            .map_err(|_| CryptoError::InvalidPadding)?,
        32 => Aes256CbcDec::new_from_slices(key, &iv)
            .map_err(|_| CryptoError::InvalidFormat)?
            .decrypt_padded_mut::<Pkcs7>(&mut buffer)
            .map_err(|_| CryptoError::InvalidPadding)?,
        _ => return Err(CryptoError::InvalidAesKey),
    };

    String::from_utf8(plaintext.to_vec()).map_err(|_| CryptoError::InvalidUtf8)
}

pub fn encrypt_aes(key: &[u8], payload: &str) -> Result<String, CryptoError> {
    let mut iv = [0_u8; 16];
    OsRng.fill_bytes(&mut iv);

    let payload_bytes = payload.as_bytes();
    let mut buffer = vec![0_u8; payload_bytes.len() + 16];
    buffer[..payload_bytes.len()].copy_from_slice(payload_bytes);

    let ciphertext = match key.len() {
        16 => Aes128CbcEnc::new_from_slices(key, &iv)
            .map_err(|_| CryptoError::InvalidAesKey)?
            .encrypt_padded_mut::<Pkcs7>(&mut buffer, payload_bytes.len())
            .map_err(|_| CryptoError::InvalidPadding)?,
        24 => Aes192CbcEnc::new_from_slices(key, &iv)
            .map_err(|_| CryptoError::InvalidAesKey)?
            .encrypt_padded_mut::<Pkcs7>(&mut buffer, payload_bytes.len())
            .map_err(|_| CryptoError::InvalidPadding)?,
        32 => Aes256CbcEnc::new_from_slices(key, &iv)
            .map_err(|_| CryptoError::InvalidAesKey)?
            .encrypt_padded_mut::<Pkcs7>(&mut buffer, payload_bytes.len())
            .map_err(|_| CryptoError::InvalidPadding)?,
        _ => return Err(CryptoError::InvalidAesKey),
    };

    Ok(format!(
        "{}:{}",
        STANDARD.encode(iv),
        STANDARD.encode(ciphertext)
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rsa::pkcs1v15::Pkcs1v15Encrypt;
    use rsa::pkcs8::{DecodePrivateKey, DecodePublicKey, EncodePrivateKey, LineEnding};

    #[test]
    fn aes_roundtrip_encrypts_and_decrypts_payload() {
        let key = [7_u8; 32];
        let payload = "{\"type\":\"hello\",\"message\":\"Shoma ✅\"}";

        let encrypted = encrypt_aes(&key, payload).unwrap();
        let decrypted = decrypt_aes(&key, &encrypted).unwrap();

        assert_eq!(decrypted, payload);
        assert_ne!(encrypted, encrypt_aes(&key, payload).unwrap());
    }

    #[test]
    fn aes_decrypts_known_cbc_pkcs7_fixture() {
        let key = [0_u8; 32];
        let encrypted = "AAAAAAAAAAAAAAAAAAAAAA==:Dly7YF2p06KmUNz8dwDtRA==";

        assert_eq!(decrypt_aes(&key, encrypted).unwrap(), "hello conduit");
    }

    #[test]
    fn rsa_exports_spki_public_key_and_decrypts_oaep_sha1() {
        let mut rng = OsRng;
        let private_key =
            RsaPrivateKey::new(&mut rng, 2048).expect("RSA key generation should work");
        let public_der = STANDARD
            .decode(export_public_key(&private_key).unwrap())
            .expect("public key should be base64 DER");

        RsaPublicKey::from_public_key_der(&public_der).expect("public key should be SPKI DER");

        let public_key = RsaPublicKey::from(&private_key);
        let encrypted = public_key
            .encrypt(&mut rng, Oaep::new::<Sha1>(), b"shared secret")
            .expect("RSA encryption should work");

        assert_eq!(
            decrypt_rsa(&private_key, &STANDARD.encode(encrypted)),
            Some("shared secret".to_string())
        );
    }

    #[test]
    fn rsa_decrypt_returns_none_for_invalid_payloads() {
        let mut rng = OsRng;
        let private_key =
            RsaPrivateKey::new(&mut rng, 2048).expect("RSA key generation should work");

        assert_eq!(decrypt_rsa(&private_key, "not base64"), None);

        let wrong_padding_ciphertext = RsaPublicKey::from(&private_key)
            .encrypt(&mut rng, Pkcs1v15Encrypt, b"not oaep")
            .expect("RSA encryption should work");
        assert_eq!(
            decrypt_rsa(&private_key, &STANDARD.encode(wrong_padding_ciphertext)),
            None
        );
    }

    #[test]
    fn rsa_private_key_pkcs8_pem_roundtrip_keeps_public_export() {
        let mut rng = OsRng;
        let private_key =
            RsaPrivateKey::new(&mut rng, 2048).expect("RSA key generation should work");
        let pem = private_key
            .to_pkcs8_pem(LineEnding::LF)
            .expect("PKCS#8 PEM encoding should work");
        let loaded = RsaPrivateKey::from_pkcs8_pem(&pem).expect("PKCS#8 PEM decoding should work");

        assert_eq!(
            export_public_key(&loaded).unwrap(),
            export_public_key(&private_key).unwrap()
        );
    }
}
