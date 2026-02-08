use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter,
};
#[allow(unused_imports)]
use tauri::Manager;
#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

use crate::common::{ToggleVisible, MAIN_WINDOW_LABEL};

pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    let icon = Image::from_bytes(include_bytes!("../icons/mozeidon.png"))?;

    let quit_entry = MenuItem::with_id(app_handle, "quitSwell", "quit swell", true, None::<&str>)?;

    #[cfg(target_os = "linux")]
    let toggle_settings_entry = MenuItem::with_id(
        app_handle,
        "toggleSwell",
        "toggle swell",
        true,
        None::<&str>,
    )?;

    #[cfg(target_os = "linux")]
    let menu = Menu::with_items(app_handle, &[&toggle_settings_entry, &quit_entry])?;

    #[cfg(not(target_os = "linux"))]
    let menu = Menu::with_items(app_handle, &[&quit_entry])?;

    TrayIconBuilder::with_id("tray")
        .menu(&menu)
        /* works only for windows and macos */
        .show_menu_on_left_click(false)
        .icon(icon)
        .icon_as_template(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quitSwell" => {
                println!("quit menu item was clicked");
                app.exit(0);
            }
            "toggleSwell" => {
                #[cfg(target_os = "linux")]
                {
                    println!("toggle menu item was clicked");
                    let window = app.get_webview_window(MAIN_WINDOW_LABEL).unwrap();
                    if window.is_visible().unwrap() {
                        let _ = window.hide();
                        return;
                    }
                    app.emit("toggle-visible", ToggleVisible { is_visible: true })
                        .unwrap();

                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {
                println!("menu item {:?} not handled", event.id);
            }
        })
        .on_tray_icon_event(|tray, event| {
            let app_handle = tray.app_handle();
            #[cfg(not(target_os = "macos"))]
            {
                if let TrayIconEvent::Click { button_state, .. } = event {
                    if button_state == MouseButtonState::Up {
                        let window = app_handle.get_webview_window(MAIN_WINDOW_LABEL).unwrap();

                        if window.is_visible().unwrap() {
                            let _ = window.hide();
                            return;
                        }

                        app_handle
                            .emit("toggle-visible", ToggleVisible { is_visible: true })
                            .unwrap();

                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
            #[cfg(target_os = "macos")]
            {
                if let TrayIconEvent::Click { button_state, .. } = event {
                    if button_state == MouseButtonState::Up {
                        let panel = app_handle.get_webview_panel(MAIN_WINDOW_LABEL).unwrap();

                        if panel.is_visible() {
                            app_handle
                                .emit("toggle-visible", ToggleVisible { is_visible: false })
                                .unwrap();
                            return;
                        }

                        app_handle
                            .emit("toggle-visible", ToggleVisible { is_visible: true })
                            .unwrap();

                        panel.show();
                    }
                }
            }
        })
        .build(app_handle)
}
