use std::future::Future;
use std::pin::Pin;

use tauri::{AppHandle, Runtime};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tokio::sync::oneshot;

const APPROVAL_TITLE: &str = "Sho'ma - Device Connection";

#[derive(Debug, Clone, PartialEq, Eq)]
struct ApprovalPrompt {
    title: String,
    body: String,
}

trait DeviceApprovalDialog {
    fn ask<'a>(&'a self, prompt: ApprovalPrompt)
        -> Pin<Box<dyn Future<Output = bool> + Send + 'a>>;
}

struct NativeDeviceApprovalDialog<R: Runtime> {
    app: AppHandle<R>,
}

impl<R: Runtime> DeviceApprovalDialog for NativeDeviceApprovalDialog<R> {
    fn ask<'a>(
        &'a self,
        prompt: ApprovalPrompt,
    ) -> Pin<Box<dyn Future<Output = bool> + Send + 'a>> {
        Box::pin(async move {
            let (sender, receiver) = oneshot::channel();

            self.app
                .dialog()
                .message(prompt.body)
                .title(prompt.title)
                .buttons(MessageDialogButtons::OkCancelCustom(
                    "Approve".to_string(),
                    "Reject".to_string(),
                ))
                .show(move |approved| {
                    let _ = sender.send(approved);
                });

            receiver.await.unwrap_or(false)
        })
    }
}

pub async fn request_device_approval<R: Runtime>(
    app: &AppHandle<R>,
    device_name: &str,
    browser: &str,
) -> bool {
    let dialog = NativeDeviceApprovalDialog { app: app.clone() };

    request_device_approval_with_dialog(&dialog, device_name, browser).await
}

async fn request_device_approval_with_dialog(
    dialog: &impl DeviceApprovalDialog,
    device_name: &str,
    browser: &str,
) -> bool {
    dialog
        .ask(build_approval_prompt(device_name, browser))
        .await
}

fn build_approval_prompt(device_name: &str, browser: &str) -> ApprovalPrompt {
    ApprovalPrompt {
        title: APPROVAL_TITLE.to_string(),
        body: format!("Device '{device_name}' ({browser}) wants to connect. Approve?"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    struct MockDeviceApprovalDialog {
        response: bool,
        prompts: Arc<Mutex<Vec<ApprovalPrompt>>>,
    }

    impl MockDeviceApprovalDialog {
        fn new(response: bool) -> Self {
            Self {
                response,
                prompts: Arc::new(Mutex::new(Vec::new())),
            }
        }

        fn prompts(&self) -> Vec<ApprovalPrompt> {
            self.prompts
                .lock()
                .expect("mock prompts should not be poisoned")
                .clone()
        }
    }

    impl DeviceApprovalDialog for MockDeviceApprovalDialog {
        fn ask<'a>(
            &'a self,
            prompt: ApprovalPrompt,
        ) -> Pin<Box<dyn Future<Output = bool> + Send + 'a>> {
            Box::pin(async move {
                self.prompts
                    .lock()
                    .expect("mock prompts should not be poisoned")
                    .push(prompt);

                self.response
            })
        }
    }

    #[test]
    fn builds_expected_prompt_text() {
        let prompt = build_approval_prompt("Josue's Phone", "Mobile Safari");

        assert_eq!(prompt.title, "Sho'ma - Device Connection");
        assert_eq!(
            prompt.body,
            "Device 'Josue's Phone' (Mobile Safari) wants to connect. Approve?"
        );
    }

    #[tokio::test]
    async fn returns_true_when_dialog_approves() {
        let dialog = MockDeviceApprovalDialog::new(true);

        let approved = request_device_approval_with_dialog(&dialog, "Pixel", "Chrome").await;

        assert!(approved);
        assert_eq!(
            dialog.prompts(),
            vec![ApprovalPrompt {
                title: "Sho'ma - Device Connection".to_string(),
                body: "Device 'Pixel' (Chrome) wants to connect. Approve?".to_string(),
            }]
        );
    }

    #[tokio::test]
    async fn returns_false_when_dialog_rejects() {
        let dialog = MockDeviceApprovalDialog::new(false);

        let approved = request_device_approval_with_dialog(&dialog, "iPhone", "Firefox").await;

        assert!(!approved);
    }
}
