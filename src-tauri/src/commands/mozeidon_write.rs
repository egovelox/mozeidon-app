use tauri::AppHandle;
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn mozeidon_write(app: AppHandle, args: Vec<String>) -> Result<String, String> {
    // debug
    // println!("mozeidon_write {:?}", args);
    let sidecar_command = app.shell().sidecar("mozeidon-cli").unwrap();
    let (mut rx, _) = sidecar_command
        .args(args)
        .spawn()
        .expect("Failed to spawn sidecar");

    let res = tauri::async_runtime::spawn(async move {
        let mut response = String::from("[]");
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line_bytes) = event {
                let line = String::from_utf8_lossy(&line_bytes);
                response = line.to_string()
            }
        }
        response
    })
    .await
    .map_err(|e| format!("Failed to parse mozeidon output: {}", e));

    res
}
