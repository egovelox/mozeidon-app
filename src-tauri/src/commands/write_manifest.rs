use serde::Deserialize;
use std::{fs, path::PathBuf};
use tauri::AppHandle;

use crate::common::{
    delete_custom_manifest_file, write_custom_manifest_file, write_manifest_file,
    write_manifests_for_all_browsers, Browser, BrowserFamily, ManifestWriteResult, OS,
};

#[tauri::command]
pub async fn write_manifest(
    app: AppHandle,
    browser_str: &str,
) -> Result<ManifestWriteResult, String> {
    let os = OS::current().ok_or("Unsupported platform")?;
    let browser = Browser::try_from_str(browser_str).ok_or("Invalid browser string")?;

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
    app: AppHandle,
    native_manifest_dir: String,
    browser_family: String,
) -> Result<ManifestWriteResult, String> {
    let browser = BrowserFamily::try_from_str(browser_family).ok_or("Invalid browser string")?;
    println!(" received path {}", &native_manifest_dir);
    let res = write_custom_manifest_file(&app, native_manifest_dir, browser)
        .map_err(|e| format!("Failed to create manifest: {}", e));
    res
}

#[tauri::command]
pub async fn delete_custom_manifest(
    app: AppHandle,
    native_manifest_path: String,
) -> Result<(), String> {
    delete_custom_manifest_file(&app, native_manifest_path)
        .map_err(|e| format!("Failed to delete manifest: {}", e))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomManifest {
    pub browser_name: String,
    pub manifest_relative_dir: String,
}

#[tauri::command]
pub async fn get_browser_manifests(
    app: AppHandle,
    custom_manifests: Option<Vec<CustomManifest>>,
) -> Result<Vec<ManifestWriteResult>, String> {
    let os = OS::current().ok_or("Unsupported platform")?;
    println!("get_browser_manifests for {:#?}", os);

    // Built-in browsers
    let mut results = write_manifests_for_all_browsers(&app, os)
        .map_err(|e| format!("Failed to get built-in browser manifests: {}", e))?;

    println!("{:#?}", results);
    // Handle custom manifests if provided
    if let Some(customs) = custom_manifests {
        for custom in customs {
            let browser = Browser::from_str(&custom.browser_name);
            let manifest_path = PathBuf::from(&custom.manifest_relative_dir);

            if manifest_path.exists() {
                match fs::read_to_string(&manifest_path) {
                    Ok(content_str) => {
                        results.push(ManifestWriteResult {
                            browser,
                            written: false,
                            path: Some(manifest_path.to_string_lossy().into_owned()),
                            content: Some(content_str),
                        });
                    }
                    Err(err) => {
                        eprintln!(
                            "Failed to read custom manifest {}: {}",
                            custom.manifest_relative_dir, err
                        );
                        continue;
                    }
                }
            } else {
                eprintln!(
                    "Custom manifest path does not exist: {}",
                    custom.manifest_relative_dir
                );
            }
        }
    }

    Ok(results)
}
