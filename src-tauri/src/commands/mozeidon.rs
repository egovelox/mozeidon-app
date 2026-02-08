use serde::de::DeserializeOwned;
use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

use crate::commands::models::{
    BookmarkItem, Chunk, GroupItem, HistoryItem, ProfileItem, TabItem, TabsWithWindowsAndGroups,
    WindowItem,
};

enum MozeidonResult {
    /// Tabs list
    Tabs(Vec<TabItem>),
    /// Bookmarks list
    Bookmarks(Vec<BookmarkItem>),
    /// History list
    History(Vec<HistoryItem>),
    /// Profiles list
    Profiles(Vec<ProfileItem>),
    /// Tabs with groups and windows (tabsWithGroups context)
    TabsWithGroups {
        tabs: Vec<TabItem>,
        groups: Vec<GroupItem>,
        windows: Vec<WindowItem>,
    },
    /// Bookmarks sync confirmation
    BookmarksSynchronized,
}

/// Parses a JSON chunk and extends the items vector.
/// Returns Err if parsing fails.
fn parse_chunk<T: DeserializeOwned>(line: &str, items: &mut Vec<T>) -> Result<(), String> {
    let chunk: Chunk<T> = serde_json::from_str(line)
        .map_err(|e| format!("Failed to parse chunk: {} - line: {}", e, line))?;
    items.extend(chunk.data);
    Ok(())
}

/// Checks if a stderr line contains an error and returns it
fn check_stderr_error(line_bytes: &[u8]) -> Option<String> {
    let line = String::from_utf8_lossy(line_bytes);
    if line.starts_with(r#"{"error""#) {
        Some(line.into_owned())
    } else {
        None
    }
}

/// Response struct for tabsWithGroups context - ensures valid JSON output
#[derive(Serialize)]
struct TabsWithGroupsResponse {
    tabs: Vec<TabItem>,
    groups: Vec<GroupItem>,
    windows: Vec<WindowItem>,
}

#[tauri::command]
pub async fn mozeidon(app: AppHandle, context: String, args: String) -> Result<String, String> {
    let args: Vec<&str> = args.split(' ').collect();

    let sidecar_command = app
        .shell()
        .sidecar("mozeidon-cli")
        .map_err(|e| format!("Failed to create sidecar command: {}", e))?;

    let (mut rx, _child) = sidecar_command
        .args(args)
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    // Process based on context
    // Note: We use tauri::async_runtime::spawn to ensure the async work
    // runs on Tauri's runtime, which is required for proper cleanup
    let result = tauri::async_runtime::spawn(async move {
        match context.as_str() {
            "tabs" => {
                let mut items: Vec<TabItem> = Vec::new();
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stderr(ref bytes) => {
                            if let Some(err) = check_stderr_error(bytes) {
                                return Err(err);
                            }
                        }
                        CommandEvent::Stdout(bytes) => {
                            let line = String::from_utf8_lossy(&bytes);
                            parse_chunk(&line, &mut items)?;
                        }
                        _ => {}
                    }
                }
                Ok(MozeidonResult::Tabs(items))
            }

            "tabsWithGroups" => {
                let mut tabs: Vec<TabItem> = Vec::new();
                let mut groups: Vec<GroupItem> = Vec::new();
                let mut windows: Vec<WindowItem> = Vec::new();

                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stderr(ref bytes) => {
                            if let Some(err) = check_stderr_error(bytes) {
                                return Err(err);
                            }
                        }
                        CommandEvent::Stdout(bytes) => {
                            let line = String::from_utf8_lossy(&bytes);
                            let data: TabsWithWindowsAndGroups = serde_json::from_str(&line)
                                .map_err(|e| {
                                    format!(
                                        "Failed to parse tabsWithGroups: {} - line: {}",
                                        e, line
                                    )
                                })?;
                            tabs.extend(data.data);
                            groups.extend(data.groups);
                            windows.extend(data.windows);
                        }
                        _ => {}
                    }
                }
                Ok(MozeidonResult::TabsWithGroups {
                    tabs,
                    groups,
                    windows,
                })
            }

            "bookmarks" => {
                let mut items: Vec<BookmarkItem> = Vec::new();

                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stderr(ref bytes) => {
                            if let Some(err) = check_stderr_error(bytes) {
                                return Err(err);
                            }
                        }
                        CommandEvent::Stdout(bytes) => {
                            let line = String::from_utf8_lossy(&bytes);
                            // Special case: bookmarks sync confirmation
                            if line.starts_with(r#"{"data":"bookmarks_synchronized"}"#) {
                                return Ok(MozeidonResult::BookmarksSynchronized);
                            }
                            parse_chunk(&line, &mut items)?;
                        }
                        _ => {}
                    }
                }
                Ok(MozeidonResult::Bookmarks(items))
            }

            "history" => {
                let mut items: Vec<HistoryItem> = Vec::new();
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stderr(ref bytes) => {
                            if let Some(err) = check_stderr_error(bytes) {
                                return Err(err);
                            }
                        }
                        CommandEvent::Stdout(bytes) => {
                            let line = String::from_utf8_lossy(&bytes);
                            parse_chunk(&line, &mut items)?;
                        }
                        _ => {}
                    }
                }
                Ok(MozeidonResult::History(items))
            }

            "profiles" => {
                let mut items: Vec<ProfileItem> = Vec::new();
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stderr(ref bytes) => {
                            if let Some(err) = check_stderr_error(bytes) {
                                return Err(err);
                            }
                        }
                        CommandEvent::Stdout(bytes) => {
                            let line = String::from_utf8_lossy(&bytes);
                            parse_chunk(&line, &mut items)?;
                        }
                        _ => {}
                    }
                }
                Ok(MozeidonResult::Profiles(items))
            }

            other => Err(format!("Unknown context: {}", other)),
        }
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))??;

    // Convert result to JSON string using proper serde serialization
    // Serializing typed structs directly preserves field order from struct definition
    match result {
        MozeidonResult::Tabs(items) => {
            serde_json::to_string(&items).map_err(|e| format!("Failed to serialize: {}", e))
        }
        MozeidonResult::Bookmarks(items) => {
            serde_json::to_string(&items).map_err(|e| format!("Failed to serialize: {}", e))
        }
        MozeidonResult::History(items) => {
            serde_json::to_string(&items).map_err(|e| format!("Failed to serialize: {}", e))
        }
        MozeidonResult::Profiles(items) => {
            serde_json::to_string(&items).map_err(|e| format!("Failed to serialize: {}", e))
        }
        MozeidonResult::TabsWithGroups {
            tabs,
            groups,
            windows,
        } => {
            let response = TabsWithGroupsResponse {
                tabs,
                groups,
                windows,
            };
            serde_json::to_string(&response)
                .map_err(|e| format!("Failed to serialize tabsWithGroups: {}", e))
        }
        MozeidonResult::BookmarksSynchronized => Ok("bookmarks_synchronized".to_string()),
    }
}
