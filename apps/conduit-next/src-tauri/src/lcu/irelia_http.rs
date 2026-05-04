use irelia::{rest::LCUClient, Error as IreliaError};
use serde_json::{json, Value};

use crate::mobile::session::{
    MobileHttpClient, MobileHttpFuture, MobileHttpResponse, Result as MobileResult,
};

pub struct IreliaHttpAdapter {
    client: LCUClient,
}

impl IreliaHttpAdapter {
    pub fn new(client: LCUClient) -> Self {
        Self { client }
    }
}

impl MobileHttpClient for IreliaHttpAdapter {
    fn request<'a>(
        &'a self,
        method: &'a str,
        path: &'a str,
        body: Option<Value>,
    ) -> MobileHttpFuture<'a> {
        Box::pin(async move { request_lcu(&self.client, method, path, body).await })
    }
}

async fn request_lcu(
    client: &LCUClient,
    method: &str,
    path: &str,
    body: Option<Value>,
) -> MobileResult<MobileHttpResponse> {
    let response = match method {
        "GET" => client.get::<Value>(path).await,
        "POST" => {
            client
                .post::<Value, Value>(path, body.unwrap_or(Value::Null))
                .await
        }
        "PATCH" => {
            client
                .patch::<Value, Value>(path, body.unwrap_or(Value::Null))
                .await
        }
        "DELETE" => client.delete::<Value>(path).await,
        other => return Ok(unsupported_method_response(other)),
    };

    Ok(match response {
        Ok(body) => success_response(body),
        Err(error) => error_response(error),
    })
}

fn success_response(body: Option<Value>) -> MobileHttpResponse {
    MobileHttpResponse {
        status_code: if body.is_some() { 200 } else { 204 },
        body: body.unwrap_or(Value::Null),
    }
}

fn error_response(error: IreliaError) -> MobileHttpResponse {
    MobileHttpResponse {
        status_code: irelia_error_status(error),
        body: json!({ "error": format!("{error:?}") }),
    }
}

fn unsupported_method_response(method: &str) -> MobileHttpResponse {
    MobileHttpResponse {
        status_code: 405,
        body: json!({ "error": format!("unsupported LCU HTTP method: {method}") }),
    }
}

fn irelia_error_status(error: IreliaError) -> u16 {
    match error {
        IreliaError::LCUProcessNotRunning
        | IreliaError::LCUStoppedRunning
        | IreliaError::PortNotFound
        | IreliaError::AuthTokenNotFound => 503,
        _ => 500,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_some_json_response_to_mobile_response() {
        assert_eq!(
            success_response(Some(json!({ "summonerLevel": 30 }))),
            MobileHttpResponse {
                status_code: 200,
                body: json!({ "summonerLevel": 30 }),
            }
        );
    }

    #[test]
    fn converts_empty_irelia_response_to_null_body() {
        assert_eq!(
            success_response(None),
            MobileHttpResponse {
                status_code: 204,
                body: Value::Null,
            }
        );
    }

    #[test]
    fn maps_lcu_availability_errors_to_service_unavailable() {
        assert_eq!(irelia_error_status(IreliaError::LCUProcessNotRunning), 503);
        assert_eq!(irelia_error_status(IreliaError::LCUStoppedRunning), 503);
        assert_eq!(irelia_error_status(IreliaError::PortNotFound), 503);
        assert_eq!(irelia_error_status(IreliaError::AuthTokenNotFound), 503);
    }

    #[test]
    fn maps_other_irelia_errors_to_internal_server_error() {
        assert_eq!(irelia_error_status(IreliaError::FailedParseJson), 500);
        assert_eq!(irelia_error_status(IreliaError::InvalidRequest), 500);
        assert_eq!(irelia_error_status(IreliaError::InvalidBody), 500);
    }

    #[test]
    fn reports_unsupported_methods_without_leaking_irelia_errors() {
        assert_eq!(
            unsupported_method_response("PUT"),
            MobileHttpResponse {
                status_code: 405,
                body: json!({ "error": "unsupported LCU HTTP method: PUT" }),
            }
        );
    }
}
