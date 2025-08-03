use tauri::AppHandle;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use crate::commands::models::{BookmarkItem, Chunk, HistoryItem, TabItem};

#[tauri::command]
pub async fn mozeidon(app: AppHandle, context: String, args: String) -> Result<String, String> {
    println!("mozeidon {}", args);
    let args: Vec<&str> = args.split(' ').collect();
    let sidecar_command = app.shell().sidecar("mozeidon-cli").unwrap();
    let (mut rx, _) = sidecar_command
        .args(args)
        .spawn()
        .expect("Failed to spawn sidecar");

    let res = tauri::async_runtime::spawn(async move {
        let mut items = Vec::new();
        match context.as_str() {
            "tabs" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        let json: Chunk<TabItem> = serde_json::from_str(&line).unwrap();
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
            }
            "bookmarks" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        let json: Chunk<BookmarkItem> = serde_json::from_str(&line).unwrap();
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
            }
            "history" => {
                while let Some(event) = rx.recv().await {
                    if let CommandEvent::Stdout(line_bytes) = event {
                        let line = String::from_utf8_lossy(&line_bytes);
                        let json: Chunk<HistoryItem> = serde_json::from_str(&line).unwrap();
                        for item in json.data {
                            items.push(serde_json::to_string(&item).unwrap());
                        }
                    }
                }
            }
            _ => {}
        }
        format!("[{}]", items.join(","))
    })
    .await
    .map_err(|e| format!("Failed to parse mozeidon output: {}", e));

    res
}
