use objc::runtime::Object;
use serde::{Deserialize, Serialize};
use std::sync::Once;
use tauri::{AppHandle, Manager, WebviewWindow};
#[allow(deprecated)]
use tauri_nspanel::{
    cocoa::{
        appkit::{NSColor, NSView, NSWindow},
        base::id,
    },
    objc::{msg_send, sel, sel_impl},
    ManagerExt,
};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use crate::SPOTLIGHT_LABEL;

#[derive(Debug, Deserialize)]
struct Chunk<T> {
    data: Vec<T>,
}

#[derive(Debug, Deserialize, Serialize)]
struct BookmarkItem {
    url: String,
    title: String,
    id: String,
    parent: String,
}

#[derive(Debug, Deserialize, Serialize)]
#[allow(non_snake_case)]
struct TabItem {
    id: u64,
    domain: String,
    title: String,
    url: String,
    windowId: u64,
}

#[derive(Debug, Deserialize, Serialize)]
struct HistoryItem {
    url: String,
    title: String,
    id: String,
    tc: u64,
    vc: u64,
    t: u64,
}

#[tauri::command]
pub async fn mozeidon_write(app: AppHandle, args: Vec<String>) -> Result<String, String> {
    println!("mozeidon {:#?}", args);
    let sidecar_command = app.shell().sidecar("mozeidon-cli").unwrap();
    let (mut rx, _) = sidecar_command
        .args(args)
        .spawn()
        .expect("Failed to spawn sidecar");
    //println!("running mozeidon {}", name);
    //println!("child pid: {}", child.pid());
    let res = tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line_bytes) = event {
                let line = String::from_utf8_lossy(&line_bytes);
                println!("NEWLINE: {}", line);
            }
        }
        format!("[]")
    })
    .await
    .map_err(|e| format!("Failed to parse mozeidon output: {}", e));
    res
}

#[tauri::command]
pub async fn mozeidon(app: AppHandle, context: String, args: String) -> Result<String, String> {
    println!("mozeidon {}", args);
    let args: Vec<&str> = args.split(' ').collect();
    let sidecar_command = app.shell().sidecar("mozeidon-cli").unwrap();
    let (mut rx, _) = sidecar_command
        .args(args)
        .spawn()
        .expect("Failed to spawn sidecar");
    //println!("running mozeidon {}", name);
    //println!("child pid: {}", child.pid());
    let res = tauri::async_runtime::spawn(async move {
        // read events from stdout
        let mut items: Vec<String> = Vec::new();
        match context.as_str() {
            "tabs" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        // println!("NEWLINE: {}", line);
                        let json: Chunk<TabItem> =
                            serde_json::from_str(&line).expect("JSON mozeidon output is not valid");
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
                format!("[{}]", items.join(","))
            }
            "bookmarks" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        //println!("NEWLINE: {}", line)
                        let json: Chunk<BookmarkItem> =
                            serde_json::from_str(&line).expect("JSON mozeidon output is not valid");
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
                format!("[{}]", items.join(","))
            }
            "history" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        //println!("NEWLINE: {}", line)
                        let json: Chunk<HistoryItem> =
                            serde_json::from_str(&line).expect("JSON mozeidon output is not valid");
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
                format!("[{}]", items.join(","))
            }
            _ => format!("[]"),
        }
    })
    .await
    .map_err(|e| format!("Failed to parse mozeidon output: {}", e));
    res
}

#[tauri::command]
pub fn show(app_handle: AppHandle) {
    println!("show");
    let panel = app_handle.get_webview_panel(SPOTLIGHT_LABEL).unwrap();

    if !panel.is_visible() {
        panel.show();
    }
}

#[tauri::command]
pub fn hide(app_handle: AppHandle) {
    println!("hide");
    let panel = app_handle.get_webview_panel(SPOTLIGHT_LABEL).unwrap();

    if panel.is_visible() {
        panel.order_out(None);
    }
}

static INIT: Once = Once::new();

#[tauri::command]
pub fn init(app_handle: tauri::AppHandle) {
    println!("init");
    INIT.call_once(|| {
        update_window_appearance(&app_handle);
    });
}

pub fn update_window_appearance(app_handle: &AppHandle) {
    let window = app_handle.get_webview_window("main").unwrap();

    set_window_border(&window, 13.0, 0.3, 102.0, 102.0, 102.0, 0.5);
}

pub fn set_window_border(
    window: &WebviewWindow,
    radius: f64,
    border_width: f64,
    red: f64,
    green: f64,
    blue: f64,
    alpha: f64,
) {
    #[allow(deprecated)]
    let win: id = window.ns_window().unwrap() as _;
    let nil: *mut Object = std::ptr::null_mut();

    unsafe {
        #[allow(deprecated)]
        let view: id = win.contentView();

        #[allow(deprecated)]
        view.wantsLayer();

        #[allow(deprecated)]
        let layer: id = view.layer();

        #[allow(unexpected_cfgs)]
        let _: () = msg_send![layer, setCornerRadius: radius];

        // Set border width
        #[allow(unexpected_cfgs)]
        let _: () = msg_send![layer, setBorderWidth: border_width];

        // Create NSColor for border
        #[allow(deprecated)]
        let color: id =
            NSColor::colorWithCalibratedRed_green_blue_alpha_(nil, red, green, blue, alpha);

        // Set border color
        #[allow(unexpected_cfgs)]
        #[allow(deprecated)]
        let cg_color: id = msg_send![color, CGColor];
        #[allow(unexpected_cfgs)]
        let _: () = msg_send![layer, setBorderColor: cg_color];
    }
}
