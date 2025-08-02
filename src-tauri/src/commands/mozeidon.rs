use std::str::FromStr;

use tauri::AppHandle;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use crate::commands::models::{BookmarkItem, Chunk, HistoryItem, TabItem, TabsWithGroups};

#[tauri::command]
pub async fn mozeidon(app: AppHandle, context: String, args: String) -> Result<String, String> {
    // debug
    //println!("mozeidon {}", args);
    let args: Vec<&str> = args.split(' ').collect();
    let sidecar_command = app.shell().sidecar("mozeidon-cli").unwrap();
    let (mut rx, _) = sidecar_command
        .args(args)
        .spawn()
        .expect("Failed to spawn sidecar");

    let res = tauri::async_runtime::spawn(async move {
        let mut items = Vec::new();
        let mut groups = Vec::new();
        let mut is_bookmarks_sync = false;
        let mut is_tabs_with_groups = false;
        let mut error = String::from("");
        let sync_res = String::from("bookmarks_synchronized");
        match context.as_str() {
            "tabs" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stderr(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        if line.starts_with(r#"{"error""#) {
                            error = String::from_str(&line).unwrap();
                        }
                    } else if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        let json: Chunk<TabItem> = serde_json::from_str(&line).unwrap();
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
            }
            "tabsWithGroups" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stderr(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        if line.starts_with(r#"{"error""#) {
                            error = String::from_str(&line).unwrap();
                        }
                    } else if let CommandEvent::Stdout(line_bytes) = event {
                        is_tabs_with_groups = true;
                        let line = String::from_utf8_lossy(&line_bytes);
                        let json: TabsWithGroups = serde_json::from_str(&line).unwrap();
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                        for item in json.groups {
                            groups.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
            }
            "bookmarks" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stderr(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        if line.starts_with(r#"{"error""#) {
                            error = String::from_str(&line).unwrap();
                        }
                    } else if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        if line.starts_with(r#"{"data":"bookmarks_synchronized"}"#) {
                            is_bookmarks_sync = true;
                        } else {
                            let json: Chunk<BookmarkItem> = serde_json::from_str(&line).unwrap();
                            for item in json.data {
                                items.push(serde_json::to_string(&item).unwrap());
                            }
                        }
                    }
                }
            }
            "history" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stderr(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        if line.starts_with(r#"{"error""#) {
                            error = String::from_str(&line).unwrap();
                        }
                    } else if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        let json: Chunk<HistoryItem> = serde_json::from_str(&line).unwrap();
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
            }
            _ => {}
        };

        if error.len() > 0 {
            return error;
        }
        if is_bookmarks_sync {
            return sync_res;
        }
        if is_tabs_with_groups {
            return format!(
                r#"{{"tabs": [{}], "groups": [{}]}}"#,
                items.join(","),
                groups.join(",")
            );
        }

        format!("[{}]", items.join(","))
    })
    .await
    .map_err(|e| format!("Failed to parse mozeidon output: {}", e));

    // for debug
    // println!("mozeidon command result {:?}", res);
    res
}
