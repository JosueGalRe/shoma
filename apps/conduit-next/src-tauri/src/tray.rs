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
    connection_state: Option<String>,
}

#[derive(Deserialize)]
struct AccessCodeChangedPayload {
    code: Option<String>,
}

#[derive(Deserialize)]
struct ConnectionStateChangedPayload {
    state: String,
}

fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn tooltip_for_state(state: &TrayState) -> String {
    match (&state.connection_state, &state.code) {
        (Some(connection_state), Some(code)) if connection_state == "Connected" => {
            format!("Mimic Conduit - Code: {code}")
        }
        _ => "Mimic Conduit - Not Connected".to_string(),
    }
}

fn update_tooltip(tray: &TrayIcon, state: &Arc<Mutex<TrayState>>) {
    let tooltip = state
        .lock()
        .map(|state| tooltip_for_state(&state))
        .unwrap_or_else(|_| "Mimic Conduit - Not Connected".to_string());

    let _ = tray.set_tooltip(Some(tooltip));
}

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show Mimic Conduit", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show, &separator, &quit])?;

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
        .map(|state| tooltip_for_state(&state))
        .unwrap_or_else(|_| "Mimic Conduit - Not Connected".to_string());

    let tray = TrayIconBuilder::new()
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
        })
        .build(app)?;

    let access_code_tray = tray.clone();
    let access_code_state = Arc::clone(&tray_state);
    app.listen("access-code-changed", move |event| {
        if let Ok(payload) = serde_json::from_str::<AccessCodeChangedPayload>(event.payload()) {
            if let Ok(mut state) = access_code_state.lock() {
                state.code = payload.code;
            }
            update_tooltip(&access_code_tray, &access_code_state);
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
            update_tooltip(&connection_state_tray, &connection_state);
        }
    });

    Ok(())
}
