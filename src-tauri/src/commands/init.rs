use crate::common::{write_manifests_for_all_browsers, ManifestWriteResult, OS};
use serde::Serialize;
use std::sync::{Once, OnceLock};
use tauri::AppHandle;

#[derive(Serialize)]
pub struct InitResponse {
    pub was_first_call: bool,
    pub results: Vec<ManifestWriteResult>,
}

static INIT: Once = Once::new();
static INIT_RESULTS: OnceLock<Result<Vec<ManifestWriteResult>, String>> = OnceLock::new();

#[tauri::command]
pub fn init(app_handle: AppHandle) -> Result<InitResponse, String> {
    println!("{}", "init");
    let os = OS::current().ok_or("Unsupported platform")?;
    let app_handle = app_handle.clone();

    let mut was_first_call = false;

    INIT.call_once(|| {
        was_first_call = true;
        let result = write_manifests_for_all_browsers(&app_handle, os)
            .map_err(|e| format!("Initialization failed: {}", e));
        println!("{:#?}", result);
        INIT_RESULTS.set(result).ok();
    });

    let results = INIT_RESULTS
        .get()
        .cloned()
        .ok_or_else(|| "Initialization logic did not run".to_string())?;

    println!("{:#?}", results);
    Ok(InitResponse {
        was_first_call,
        results: results?, // propagate possible error here
    })
}
