use std::{future::Future, pin::Pin, sync::Arc};

use base64::{engine::general_purpose::STANDARD, Engine as _};
use reqwest::{header, Client, Method, Response};
use serde::Serialize;
use thiserror::Error;
use tokio::sync::RwLock;

use crate::lcu::lockfile::{find_lockfile, parse_lockfile, LockfileError, LockfileInfo};

type LockfileRefresher = Arc<dyn Fn() -> Result<LockfileInfo> + Send + Sync>;
type RequestFuture = Pin<Box<dyn Future<Output = reqwest::Result<Response>> + Send>>;

pub type Result<T> = std::result::Result<T, LcuHttpError>;

#[derive(Clone)]
pub struct LcuHttpClient {
    client: Client,
    lockfile: Arc<RwLock<LockfileInfo>>,
    refresh_lockfile: LockfileRefresher,
}

#[derive(Debug, Error)]
pub enum LcuHttpError {
    #[error("failed to create LCU HTTP client")]
    CreateClient(#[source] reqwest::Error),
    #[error("LCU lockfile was not found")]
    MissingLockfile,
    #[error("failed to read LCU lockfile")]
    Lockfile(#[from] LockfileError),
    #[error("LCU HTTP request failed")]
    Request(#[from] reqwest::Error),
}

impl LcuHttpClient {
    pub fn new(lockfile: LockfileInfo) -> Result<Self> {
        Self::with_refresher(lockfile, read_current_lockfile)
    }

    pub fn from_current_lockfile() -> Result<Self> {
        Self::new(read_current_lockfile()?)
    }

    pub fn with_refresher(
        lockfile: LockfileInfo,
        refresh_lockfile: impl Fn() -> Result<LockfileInfo> + Send + Sync + 'static,
    ) -> Result<Self> {
        let client = Client::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .map_err(LcuHttpError::CreateClient)?;

        Ok(Self {
            client,
            lockfile: Arc::new(RwLock::new(lockfile)),
            refresh_lockfile: Arc::new(refresh_lockfile),
        })
    }

    pub async fn get(&self, path: &str) -> Result<Response> {
        self.request(Method::GET, path, Option::<&()>::None).await
    }

    pub async fn post<T>(&self, path: &str, body: T) -> Result<Response>
    where
        T: Serialize + Send + Sync,
    {
        self.request(Method::POST, path, Some(body)).await
    }

    pub async fn patch<T>(&self, path: &str, body: T) -> Result<Response>
    where
        T: Serialize + Send + Sync,
    {
        self.request(Method::PATCH, path, Some(body)).await
    }

    pub async fn delete(&self, path: &str) -> Result<Response> {
        self.request(Method::DELETE, path, Option::<&()>::None)
            .await
    }

    pub async fn request<T>(&self, method: Method, path: &str, body: Option<T>) -> Result<Response>
    where
        T: Serialize + Send + Sync,
    {
        self.send_with_current_lockfile(method, path, body).await
    }

    async fn send_with_current_lockfile<T>(
        &self,
        method: Method,
        path: &str,
        body: Option<T>,
    ) -> Result<Response>
    where
        T: Serialize + Send + Sync,
    {
        let lockfile = self.lockfile.read().await.clone();
        let first_attempt = self
            .send_once(&lockfile, method.clone(), path, body.as_ref())
            .await;

        match first_attempt {
            Ok(response) => Ok(response),
            Err(error) => {
                let refreshed = (self.refresh_lockfile)()?;
                if refreshed == lockfile {
                    return Err(LcuHttpError::Request(error));
                }

                *self.lockfile.write().await = refreshed.clone();
                self.send_once(&refreshed, method, path, body.as_ref())
                    .await
                    .map_err(LcuHttpError::Request)
            }
        }
    }

    fn send_once<'a, T>(
        &'a self,
        lockfile: &'a LockfileInfo,
        method: Method,
        path: &'a str,
        body: Option<&'a T>,
    ) -> RequestFuture
    where
        T: Serialize + Send + Sync + 'a,
    {
        let builder = self.request_builder(lockfile, method, path, body);
        Box::pin(async move { builder.send().await })
    }

    fn request_builder<T>(
        &self,
        lockfile: &LockfileInfo,
        method: Method,
        path: &str,
        body: Option<&T>,
    ) -> reqwest::RequestBuilder
    where
        T: Serialize + ?Sized,
    {
        let url = lcu_url(lockfile.port, path);
        let mut builder = self.client.request(method, url).header(
            header::AUTHORIZATION,
            authorization_header(&lockfile.password),
        );

        if let Some(body) = body {
            builder = builder.json(body);
        }

        builder
    }
}

fn read_current_lockfile() -> Result<LockfileInfo> {
    let path = find_lockfile().ok_or(LcuHttpError::MissingLockfile)?;

    Ok(parse_lockfile(path)?)
}

fn lcu_url(port: u16, path: &str) -> String {
    let path = path.strip_prefix('/').unwrap_or(path);

    format!("https://127.0.0.1:{port}/{path}")
}

fn authorization_header(token: &str) -> String {
    format!("Basic {}", STANDARD.encode(format!("riot:{token}")))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn builds_basic_auth_header_from_lockfile_password() {
        let request = client()
            .request_builder(
                &lockfile(2999, "secret"),
                Method::GET,
                "/lol-test",
                None::<&()>,
            )
            .build()
            .unwrap();

        assert_eq!(
            request.headers().get(header::AUTHORIZATION).unwrap(),
            "Basic cmlvdDpzZWNyZXQ="
        );
    }

    #[test]
    fn prepends_lcu_base_url_to_paths() {
        let request = client()
            .request_builder(
                &lockfile(4567, "token"),
                Method::GET,
                "lol-summoner/v1/current-summoner",
                None::<&()>,
            )
            .build()
            .unwrap();

        assert_eq!(
            request.url().as_str(),
            "https://127.0.0.1:4567/lol-summoner/v1/current-summoner"
        );
    }

    #[test]
    fn builds_get_post_patch_and_delete_requests() {
        let client = client();
        let lockfile = lockfile(8080, "token");

        let get = client
            .request_builder(&lockfile, Method::GET, "/get", None::<&()>)
            .build()
            .unwrap();
        let post = client
            .request_builder(
                &lockfile,
                Method::POST,
                "/post",
                Some(&json!({ "ready": true })),
            )
            .build()
            .unwrap();
        let patch = client
            .request_builder(
                &lockfile,
                Method::PATCH,
                "/patch",
                Some(&json!({ "value": 1 })),
            )
            .build()
            .unwrap();
        let delete = client
            .request_builder(&lockfile, Method::DELETE, "/delete", None::<&()>)
            .build()
            .unwrap();

        assert_eq!(get.method(), Method::GET);
        assert_eq!(post.method(), Method::POST);
        assert_eq!(patch.method(), Method::PATCH);
        assert_eq!(delete.method(), Method::DELETE);
        assert!(post.body().is_some());
        assert!(patch.body().is_some());
    }

    fn client() -> LcuHttpClient {
        LcuHttpClient::with_refresher(lockfile(2999, "secret"), || Ok(lockfile(2999, "secret")))
            .unwrap()
    }

    fn lockfile(port: u16, password: &str) -> LockfileInfo {
        LockfileInfo {
            name: "LeagueClient".to_string(),
            pid: 1234,
            port,
            password: password.to_string(),
            protocol: "https".to_string(),
        }
    }
}
