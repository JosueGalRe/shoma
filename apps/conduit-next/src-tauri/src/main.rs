use conduit_next::{manager, persistence};
use tauri::Manager;

#[cfg(desktop)]
use conduit_next::tray;

#[tauri::command]
fn get_hub_code() -> Option<String> {
    persistence::get_hub_code().unwrap_or(None)
}

#[tauri::command]
async fn get_connection_state(
    manager: tauri::State<'_, manager::ConnectionManager>,
) -> Result<manager::ConnectionSnapshot, String> {
    let manager = manager.inner().clone();
    Ok(manager.connection_snapshot().await)
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

/// Resolves Rift hub URLs from (highest to lowest priority):
/// 1. CLI arguments (--rift-http-url, --rift-ws-url)
/// 2. Environment variables (RIFT_HUB_HTTP_URL, RIFT_HUB_WS_URL)
/// 3. `.env` file in the same directory as the executable
/// 4. Default values (localhost)
fn resolve_hub_urls() -> (String, String) {
    let args: Vec<String> = std::env::args().collect();

    let http_url = find_arg(&args, "--rift-http-url")
        .or_else(|| std::env::var("RIFT_HUB_HTTP_URL").ok())
        .or_else(|| read_env_file("RIFT_HUB_HTTP_URL"))
        .unwrap_or_else(|| "http://localhost:51001".to_string());

    let ws_url = find_arg(&args, "--rift-ws-url")
        .or_else(|| std::env::var("RIFT_HUB_WS_URL").ok())
        .or_else(|| read_env_file("RIFT_HUB_WS_URL"))
        .unwrap_or_else(|| "ws://localhost:51001/conduit".to_string());

    eprintln!("[DEBUG] Resolved Rift HTTP URL: {http_url}");
    eprintln!("[DEBUG] Resolved Rift WS URL: {ws_url}");

    (http_url, ws_url)
}

fn find_arg(args: &[String], flag: &str) -> Option<String> {
    args.iter().position(|arg| arg == flag).and_then(|i| args.get(i + 1).cloned())
}

fn read_env_file(key: &str) -> Option<String> {
    let exe_path = std::env::current_exe().ok()?;
    let env_path = exe_path.parent()?.join(".env");
    let contents = std::fs::read_to_string(env_path).ok()?;

    for line in contents.lines() {
        let line = line.trim();
        if line.starts_with('#') || line.is_empty() {
            continue;
        }
        if let Some((k, v)) = line.split_once('=') {
            if k.trim() == key {
                return Some(v.trim().to_string());
            }
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    let (hub_http_url, hub_ws_url) = resolve_hub_urls();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            #[cfg(desktop)]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.remove_menu();
            }
            tray::setup_tray(app.handle())?;
            let connection_manager = manager::ConnectionManager::with_urls(
                app.handle().clone(),
                hub_http_url.clone(),
                hub_ws_url.clone(),
            );
            app.manage(connection_manager.clone());
            let registration_manager = connection_manager.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = registration_manager.ensure_registered_access_code().await {
                    eprintln!("failed to register Rift access code on startup: {error}");
                }
            });
            connection_manager.spawn();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_connection_state,
            get_hub_code,
            open_about_window,
            show_notification
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Mimic Conduit");
}
