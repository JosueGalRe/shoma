use reqwest::{Client, Method, Response};
use serde::Serialize;
use thiserror::Error;

const LIVE_CLIENT_BASE_URL: &str = "https://127.0.0.1:2999";

pub type Result<T> = std::result::Result<T, LiveClientHttpError>;

#[derive(Clone)]
pub struct LiveClientHttpClient {
    client: Client,
}

#[derive(Debug, Error)]
pub enum LiveClientHttpError {
    #[error("failed to create Live Client HTTP client")]
    CreateClient(#[source] reqwest::Error),
    #[error("Live Client HTTP request failed")]
    Request(#[from] reqwest::Error),
}

impl LiveClientHttpClient {
    pub fn new() -> Result<Self> {
        let client = Client::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .map_err(LiveClientHttpError::CreateClient)?;

        Ok(Self { client })
    }

    pub async fn get(&self, path: &str) -> Result<Response> {
        self.request(Method::GET, path, Option::<&()>::None).await
    }

    pub async fn request<T>(&self, method: Method, path: &str, body: Option<T>) -> Result<Response>
    where
        T: Serialize + Send + Sync,
    {
        let mut builder = self.client.request(method, live_client_url(path));

        if let Some(body) = body {
            builder = builder.json(&body);
        }

        builder.send().await.map_err(LiveClientHttpError::Request)
    }
}

fn live_client_url(path: &str) -> String {
    let path = path.strip_prefix('/').unwrap_or(path);

    format!("{LIVE_CLIENT_BASE_URL}/{path}")
}
