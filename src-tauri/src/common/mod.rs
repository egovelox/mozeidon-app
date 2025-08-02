use serde::Serialize;

pub static MAIN_WINDOW_LABEL: &str = "main";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ToggleVisible {
    pub is_visible: bool,
}

mod native_manifests;

pub use native_manifests::*;
