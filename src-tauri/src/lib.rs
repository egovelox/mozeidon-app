use tauri::{Listener, Manager};
use window::WebviewWindowExt;

mod command;
mod tray;
mod window;

pub(crate) const SPOTLIGHT_LABEL: &str = "main";
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            command::init,
            command::mozeidon,
            command::mozeidon_write,
            command::show,
            command::hide,
        ])
        .plugin(tauri_nspanel::init())
        .setup(move |app| {
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let handle = app.app_handle();

            tray::create(handle)?;
            let window = handle.get_webview_window(SPOTLIGHT_LABEL).unwrap();

            // Convert the window to a spotlight panel
            let panel = window.to_spotlight_panel()?;

            let _id = app.listen("js-message", |event| {
                println!("got js-message with payload {:?}", event.payload());
            });
            handle.listen(
                format!("{}_panel_did_resign_key", SPOTLIGHT_LABEL),
                move |_| {
                    // Hide the panel when it's no longer the key window
                    // This ensures the panel doesn't remain visible when it's not actively being used
                    panel.order_out(None);
                },
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
