//! credits to: https://github.com/ayangweb/ayangweb-EcoPaste/blob/169323dbe6365ffe4abb64d867439ed2ea84c6d1/src-tauri/src/core/setup/mac.rs

use tauri::{App, Emitter, Listener, Manager, WebviewWindow};
#[allow(deprecated)]
use tauri_nspanel::{
    cocoa::appkit::{NSMainMenuWindowLevel, NSWindowCollectionBehavior},
    panel_delegate, WebviewWindowExt,
};

use crate::common::MAIN_WINDOW_LABEL;

#[allow(non_upper_case_globals)]
const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;

pub fn platform(_app: &mut App, main_window: WebviewWindow) {
    // Convert ns_window to ns_panel
    let panel = main_window.to_panel().unwrap();

    // Make the window above the dock
    #[allow(deprecated)]
    panel.set_level(NSMainMenuWindowLevel + 1);

    // Do not steal focus from other windows
    panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel);

    // Open the window in the active workspace and full screen
    #[allow(deprecated)]
    panel.set_collection_behaviour(
        NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
    );

    // Set up a delegate to handle key window events for the panel
    //
    // This delegate listens for two specific events:
    // 1. When the panel becomes the key window
    // 2. When the panel resigns as the key window
    //
    // For each event, it emits a corresponding custom event to the app,
    // allowing other parts of the application to react to these panel state changes.
    #[allow(deprecated)]
    #[allow(unexpected_cfgs)]
    let delegate = panel_delegate!(SpotlightPanelDelegate {
        window_did_resign_key,
        window_did_become_key,
        exit
    });

    // Define the panel's delegate to listen to panel window events
    let app_handle = main_window.app_handle().clone();
    let label = main_window.label().to_string();
    // Set event listeners for the delegate
    delegate.set_listener(Box::new(move |delegate_name: String| {
        match delegate_name.as_str() {
            "window_did_become_key" => {
                println!("got event did become key");
                let _ = app_handle.emit(format!("{}_panel_did_become_key", label).as_str(), ());
            }
            "window_did_resign_key" => {
                println!("got event did resign key");
                let _ = app_handle.emit(format!("{}_panel_did_resign_key", label).as_str(), ());
            }
            "exit" => {
                println!("got event");
                let _ = app_handle.emit(format!("{}_panel_did_exit", label).as_str(), ());
                ()
            }
            _ => (),
        }
    }));

    // Set the delegate object for the window to handle window events
    panel.set_delegate(delegate);
    main_window.app_handle().listen(
        format!("{}_panel_did_resign_key", MAIN_WINDOW_LABEL),
        move |_| {
            // Hide the panel when it's no longer the key window
            // This ensures the panel doesn't remain visible when it's not actively being used
            panel.order_out(None);
        },
    );
}
