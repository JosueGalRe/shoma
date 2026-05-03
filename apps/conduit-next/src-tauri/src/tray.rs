use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, WebviewWindowBuilder,
};

fn open_about_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("about") {
        let _ = window.show();
        let _ = window.set_focus();
        return;
    }

    let _ = WebviewWindowBuilder::new(app, "about", tauri::WebviewUrl::App("about.html".into()))
        .title("About Mimic")
        .inner_size(400.0, 500.0)
        .center()
        .decorations(true)
        .resizable(false)
        .build();
}

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let app_name = MenuItem::with_id(app, "app_name", "Mimic Conduit", false, None::<&str>)?;

    let code = crate::persistence::get_hub_code().unwrap_or(None);
    let code_text = match code {
        Some(c) => format!("Access Code: {}", c),
        None => "Start League to generate an access code!".to_string(),
    };
    let code_item = MenuItem::with_id(app, "code", &code_text, false, None::<&str>)?;

    let about = MenuItem::with_id(app, "about", "About", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&app_name, &code_item, &about, &quit])?;

    let icon = app
        .default_window_icon()
        .cloned()
        .expect("default window icon not found");

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                open_about_window(tray.app_handle());
            }
            _ => {}
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "about" => {
                open_about_window(app);
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
