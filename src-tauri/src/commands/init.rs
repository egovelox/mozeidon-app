use std::sync::Once;

static INIT: Once = Once::new();

#[tauri::command]
pub fn init(_app_handle: tauri::AppHandle) {
    println!("init");
    INIT.call_once(|| {});
}
