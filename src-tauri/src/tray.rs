use serde::Serialize;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};
#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

use crate::common::MAIN_WINDOW_LABEL;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ToggleSettings {
    show_settings: bool,
}

pub fn create(app_handle: &AppHandle) -> tauri::Result<TrayIcon> {
    let icon = Image::from_bytes(include_bytes!("../icons/mozeidon_small.png"))?;

    let quit_i = MenuItem::with_id(app_handle, "quit", "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app_handle, &[&quit_i])?;
    TrayIconBuilder::with_id("tray")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .icon(icon)
        .icon_as_template(true)
        // DEBUG
        .on_tray_icon_event(|_, event| println!("TRAY EVENT: {:?}", event))
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                println!("quit menu item was clicked");
                app.exit(0);
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
                            .emit(
                                "toggle-settings",
                                ToggleSettings {
                                    show_settings: true,
                                },
                            )
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
                            panel.order_out(None);
                            return;
                        }

                        app_handle
                            .emit(
                                "toggle-settings",
                                ToggleSettings {
                                    show_settings: true,
                                },
                            )
                            .unwrap();

                        panel.show();
                    }
                }
            }
        })
        .build(app_handle)
}
