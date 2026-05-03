use conduit_next::{manager, persistence};

#[cfg(desktop)]
use conduit_next::tray;

#[tauri::command]
fn get_hub_code() -> Option<String> {
    persistence::get_hub_code().unwrap_or(None)
}

#[tauri::command]
async fn open_about_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::{Manager, WebviewWindowBuilder};

    if let Some(window) = app.get_webview_window("about") {
        let _ = window.set_focus();
        return Ok(());
    }

    let _window =
        WebviewWindowBuilder::new(&app, "about", tauri::WebviewUrl::App("about.html".into()))
            .title("About Mimic")
            .inner_size(400.0, 500.0)
            .center()
            .decorations(true)
            .resizable(false)
            .build()
            .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn show_notification(app: tauri::AppHandle, text: String) {
    use tauri_plugin_notification::NotificationExt;
    let _ = app
        .notification()
        .builder()
        .title("Mimic Conduit")
        .body(text)
        .show();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(desktop)]
            tray::setup_tray(app.handle())?;
            manager::ConnectionManager::new(app.handle().clone()).spawn();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_hub_code,
            open_about_window,
            show_notification
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Mimic Conduit");
}
