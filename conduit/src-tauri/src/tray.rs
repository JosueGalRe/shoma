use std::sync::{Arc, Mutex};

use serde::Deserialize;
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Listener, Manager,
};

#[derive(Default)]
struct TrayState {
    code: Option<String>,
    connection_state: Option<ConduitStatePayload>,
}

#[derive(Clone, Copy)]
enum Language {
    En,
    Es,
}

#[derive(Deserialize)]
struct AccessCodeChangedPayload {
    code: Option<String>,
}

#[derive(Deserialize)]
struct ConnectionStateChangedPayload {
    state: ConduitStatePayload,
}

#[derive(Clone, Deserialize)]
struct ConduitStatePayload {
    relay: String,
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn detect_language() -> Language {
    ["LC_ALL", "LC_MESSAGES", "LANG"]
        .iter()
        .filter_map(|key| std::env::var(key).ok())
        .map(|value| value.to_lowercase())
        .find(|value| !value.is_empty())
        .map(|value| {
            if value.starts_with("es") {
                Language::Es
            } else {
                Language::En
            }
        })
        .unwrap_or(Language::En)
}

fn t(language: Language, key: &str) -> &'static str {
    match (language, key) {
        (Language::Es, "app.name") => "Sho'ma Conduit",
        (Language::Es, "status.connected") => "Conectado",
        (Language::Es, "status.waiting") => "Esperando",
        (Language::Es, "tray.show") => "Mostrar Sho'ma Conduit",
        (_, "app.name") => "Sho'ma Conduit",
        (_, "status.connected") => "Connected",
        (_, "status.waiting") => "Waiting",
        (_, "tray.show") => "Show Sho'ma Conduit",
        (_, "tray.quit") => "Quit",
        _ => "",
    }
}

fn tooltip_for_state(state: &TrayState, language: Language) -> String {
    match (&state.connection_state, &state.code) {
        (Some(connection_state), Some(code)) if connection_state.relay == "connected" => {
            format!(
                "{} - {}: {code}",
                t(language, "app.name"),
                t(language, "status.connected")
            )
        }
        _ => format!(
            "{} - {}",
            t(language, "app.name"),
            t(language, "status.waiting")
        ),
    }
}

fn update_tooltip(tray: &TrayIcon, state: &Arc<Mutex<TrayState>>, language: Language) {
    let tooltip = state
        .lock()
        .map(|state| tooltip_for_state(&state, language))
        .unwrap_or_else(|_| {
            format!(
                "{} - {}",
                t(language, "app.name"),
                t(language, "status.waiting")
            )
        });

    let _ = tray.set_tooltip(Some(tooltip));
}

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let language = detect_language();
    let show = MenuItem::with_id(app, "show", t(language, "tray.show"), true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", t(language, "tray.quit"), true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &separator, &quit])?;

    #[cfg(target_os = "macos")]
    let icon = tauri::image::Image::from_bytes(include_bytes!("../icons/tray-mac-template.png"))
        .unwrap_or_else(|e| {
            eprintln!("Warning: failed to load embedded tray icon: {e}");
            app.default_window_icon()
                .cloned()
                .expect("default window icon not found")
        });

    #[cfg(not(target_os = "macos"))]
    let icon = app
        .default_window_icon()
        .cloned()
        .expect("default window icon not found");

    let tray_state = Arc::new(Mutex::new(TrayState {
        code: crate::persistence::get_hub_code().unwrap_or(None),
        connection_state: None,
    }));
    let initial_tooltip = tray_state
        .lock()
        .map(|state| tooltip_for_state(&state, language))
        .unwrap_or_else(|_| {
            format!(
                "{} - {}",
                t(language, "app.name"),
                t(language, "status.waiting")
            )
        });

    let tray = {
        let builder = TrayIconBuilder::new()
            .icon(icon)
            .tooltip(&initial_tooltip)
            .menu(&menu)
            .on_tray_icon_event(|tray, event| match event {
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                } => {
                    show_main_window(tray.app_handle());
                }
                _ => {}
            })
            .on_menu_event(|app, event| match event.id.as_ref() {
                "show" => {
                    show_main_window(app);
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            });

        #[cfg(target_os = "macos")]
        let builder = builder.icon_as_template(true);

        builder.build(app)?
    };

    let access_code_tray = tray.clone();
    let access_code_state = Arc::clone(&tray_state);
    app.listen("access-code-changed", move |event| {
        if let Ok(payload) = serde_json::from_str::<AccessCodeChangedPayload>(event.payload()) {
            if let Ok(mut state) = access_code_state.lock() {
                state.code = payload.code;
            }
            update_tooltip(&access_code_tray, &access_code_state, language);
        }
    });

    let connection_state_tray = tray.clone();
    let connection_state = Arc::clone(&tray_state);
    app.listen("connection-state-changed", move |event| {
        if let Ok(payload) = serde_json::from_str::<ConnectionStateChangedPayload>(event.payload())
        {
            if let Ok(mut state) = connection_state.lock() {
                state.connection_state = Some(payload.state);
            }
            update_tooltip(&connection_state_tray, &connection_state, language);
        }
    });

    Ok(())
}
