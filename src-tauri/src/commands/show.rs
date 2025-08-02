use crate::common::MAIN_WINDOW_LABEL;
/* import trait Manager */
use tauri::{AppHandle, Manager};
#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[tauri::command]
pub fn show(app: AppHandle) {
    println!("show");
    #[cfg(not(target_os = "macos"))]
    {
        let window = app.get_webview_window(MAIN_WINDOW_LABEL).unwrap();
        window.show().ok();
        window.unminimize().ok();
        window.set_focus().ok();
    }
    #[cfg(target_os = "macos")]
    {
        let panel = app.get_webview_panel(MAIN_WINDOW_LABEL).unwrap();
        if !panel.is_visible() {
            panel.show();
        }
    }
}
