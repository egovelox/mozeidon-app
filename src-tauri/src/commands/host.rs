use dirs::home_dir;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_user_home_dir(_app: AppHandle) -> String {
    let home = home_dir();
    home.unwrap_or_default().to_string_lossy().into_owned()
}

#[cfg(target_os = "linux")]
#[tauri::command]
pub async fn is_wmctrl_installed(_app: AppHandle) -> bool {
    use which::which;
    which("wmctrl").is_ok()
}
