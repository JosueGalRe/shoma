#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use conduit::{manager, persistence};
use tauri::Manager;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[cfg(desktop)]
use conduit::tray;

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
/// 2. Environment variables (LEYLINE_HUB_HTTP_URL, LEYLINE_HUB_WS_URL)
/// 3. `.env` file in the same directory as the executable
/// 4. Default values (localhost)
fn init_logging() {
    let log_dir = dirs::data_dir()
        .unwrap_or_else(|| std::env::temp_dir())
        .join("Mimic")
        .join("logs");

    let file_appender = tracing_appender::rolling::daily(&log_dir, "conduit.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    let fmt_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false)
        .with_target(false)
        .with_thread_ids(false)
        .with_level(true)
        .with_timer(fmt::time::LocalTime::rfc_3339());

    let stderr_layer = fmt::layer()
        .with_writer(std::io::stderr)
        .with_ansi(true)
        .with_target(false)
        .with_thread_ids(false)
        .with_level(true)
        .with_timer(fmt::time::LocalTime::rfc_3339());

    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("conduit=info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .with(stderr_layer)
        .init();
}

fn resolve_hub_urls() -> (String, String) {
    let args: Vec<String> = std::env::args().collect();

    let http_url = find_arg(&args, "--leyline-http-url")
        .or_else(|| std::env::var("LEYLINE_HUB_HTTP_URL").ok())
        .or_else(|| read_env_file("LEYLINE_HUB_HTTP_URL"))
        .unwrap_or_else(|| "http://localhost:51001".to_string());

    let ws_url = find_arg(&args, "--leyline-ws-url")
        .or_else(|| std::env::var("LEYLINE_HUB_WS_URL").ok())
        .or_else(|| read_env_file("LEYLINE_HUB_WS_URL"))
        .unwrap_or_else(|| "ws://localhost:51001/conduit".to_string());

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

const APP_ID: &str = "com.mimic.conduit";
const APP_NAME: &str = "Mimic Conduit";

#[cfg(windows)]
fn set_app_user_model_id() {
    use std::os::windows::ffi::OsStrExt;

    #[link(name = "shell32")]
    extern "system" {
        fn SetCurrentProcessExplicitAppUserModelID(app_id: *const u16) -> i32;
    }

    let wide: Vec<u16> = std::ffi::OsStr::new(APP_ID)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    unsafe {
        SetCurrentProcessExplicitAppUserModelID(wide.as_ptr());
    }
}

#[cfg(not(windows))]
fn set_app_user_model_id() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    set_app_user_model_id();
    init_logging();
    let (hub_http_url, hub_ws_url) = resolve_hub_urls();
    tracing::info!("Rift HTTP URL: {hub_http_url}");
    tracing::info!("Rift WS URL: {hub_ws_url}");

    let is_autostart = std::env::args().any(|arg| arg == "--autostart");

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            let window = app.get_webview_window("main");
            if let Some(window) = window {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--autostart"])))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                tracing::info!("main window hidden to system tray");
            }
        })
        .setup(move |app| {
            #[cfg(desktop)]
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.remove_menu();

                if is_autostart {
                    let _ = window.hide();
                    tracing::info!("app launched via autostart, keeping window hidden");
                } else if let Ok(Some(monitor)) = window.primary_monitor() {
                    let work_area = monitor.work_area();
                    let window_size = window.outer_size().unwrap_or(tauri::PhysicalSize::new(400, 320));
                    let x = work_area.position.x + (work_area.size.width as i32) - (window_size.width as i32);
                    let y = work_area.position.y + (work_area.size.height as i32) - (window_size.height as i32);
                    let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition::new(x, y)));
                }
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
                    tracing::error!("failed to register Rift access code on startup: {error}");
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
        .build(tauri::generate_context!())
        .expect("failed to build Mimic Conduit");

    app.run(|_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}
