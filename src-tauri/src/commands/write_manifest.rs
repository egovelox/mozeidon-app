use tauri::AppHandle;

use crate::common::{
    get_base_user_dir, write_manifest_file, write_manifests_for_all_browsers, Browser,
    ManifestWriteResult, MANIFEST_FILENAME, OS,
};

#[tauri::command]
pub async fn write_manifest(
    app: AppHandle,
    browser_str: &str,
) -> Result<ManifestWriteResult, String> {
    let os = OS::current().ok_or("Unsupported platform")?;
    let browser = Browser::from_str(browser_str).ok_or("Invalid browser string")?;

    write_manifest_file(&app, os, browser).map_err(|e| format!("Failed to write manifest: {}", e))
}

#[tauri::command]
pub async fn write_all_manifests(app: AppHandle) -> Result<Vec<ManifestWriteResult>, String> {
    let os = OS::current().ok_or("Unsupported platform")?;

    write_manifests_for_all_browsers(&app, os)
        .map_err(|e| format!("Failed to write manifests: {}", e))
}

#[tauri::command]
pub async fn write_custom_manifest(
    relative_dir: String,
    content: String,
    browser_str: &str,
) -> Result<ManifestWriteResult, String> {
    let browser = Browser::from_str(browser_str).ok_or("Invalid browser string")?;

    let base_dir = get_base_user_dir(OS::current().ok_or("Unsupported platform")?, browser)
        .ok_or("Failed to get base user directory")?;

    let full_path = base_dir.join(&relative_dir);

    if !full_path.exists() || !full_path.is_dir() {
        return Err(format!("Directory does not exist: {}", full_path.display()));
    }

    let dest_path = full_path.join(MANIFEST_FILENAME);

    std::fs::write(&dest_path, &content).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(ManifestWriteResult {
        browser,
        written: true,
        path: Some(dest_path.to_string_lossy().into_owned()),
        content: Some(content),
    })
}
