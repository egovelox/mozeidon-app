use dirs::home_dir;
use tauri::AppHandle;

#[tauri::command]
pub async fn get_user_home_dir(_app: AppHandle) -> String {
    let home = home_dir();
    home.unwrap_or_default().to_string_lossy().into_owned()
}
