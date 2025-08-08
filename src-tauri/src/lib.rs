use common::MAIN_WINDOW_LABEL;
use tauri::{Listener, Manager};

mod commands;
mod common;
mod setup;
mod tray;

pub fn run() {
    let ctx = tauri::generate_context!();
    let mut app_builder = tauri::Builder::default();
    app_builder = app_builder
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init());

    #[cfg(target_os = "macos")]
    {
        app_builder = app_builder.plugin(tauri_nspanel::init());
    }

    let app = app_builder
        .invoke_handler(tauri::generate_handler![
            commands::init,
            commands::mozeidon,
            commands::mozeidon_write,
            commands::show,
            commands::hide,
            commands::write_manifest,
            commands::write_all_manifests,
            commands::get_browser_manifests,
            commands::get_user_home_dir,
            #[cfg(target_os = "linux")]
            commands::is_wmctrl_installed,
        ])
        .setup(move |app| {
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            let handle = app.handle().clone();

            tray::create(&handle)?;
            let main_window = handle.get_webview_window(MAIN_WINDOW_LABEL).unwrap();

            setup::default(app, main_window.clone());

            let _id = app.listen("js-message", |event| {
                println!("got js-message with payload {:?}", event.payload());
            });
            Ok(())
        })
        .build(ctx)
        .expect("error while running tauri application");

    app.run(|_app_handle, _event| {});
}
