use crate::common::MAIN_WINDOW_LABEL;
/* import trait Manager */
use tauri::{AppHandle, Manager};
#[cfg(target_os = "macos")]
use tauri_nspanel::ManagerExt;

#[tauri::command]
pub fn hide(app_handle: AppHandle) {
    println!("hide");
    #[cfg(not(target_os = "macos"))]
    {
        let window = app_handle.get_webview_window(MAIN_WINDOW_LABEL).unwrap();
        if window.is_visible().unwrap() {
            window.hide();
        }
    }
    #[cfg(target_os = "macos")]
    {
        let panel = app_handle.get_webview_panel(MAIN_WINDOW_LABEL).unwrap();
        if panel.is_visible() {
            panel.order_out(None);
        }
    }
}
