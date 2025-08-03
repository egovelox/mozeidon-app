use std::{fs, io, path::PathBuf};

use dirs::{config_dir, data_local_dir};
use serde::Serialize;
use tauri::utils::platform::current_exe;
use tauri::{path::BaseDirectory, AppHandle, Manager};
use thiserror::Error;

const DIR_MACOS_FIREFOX: &str = "Mozilla/NativeMessagingHosts";
const DIR_MACOS_CHROME: &str = "Google/Chrome/NativeMessagingHosts";
const DIR_MACOS_EDGE: &str = "Microsoft Edge/NativeMessagingHosts";

const DIR_LINUX_FIREFOX: &str = ".mozilla/native-messaging-hosts";
const DIR_LINUX_CHROME: &str = ".config/google-chrome/NativeMessagingHosts";
const DIR_LINUX_EDGE: &str = ".config/microsoft-edge/NativeMessagingHosts";

const DIR_WINDOWS_FIREFOX: &str = r"Mozilla\NativeMessagingHosts";
const DIR_WINDOWS_CHROME: &str = r"Google\Chrome\NativeMessagingHosts";
const DIR_WINDOWS_EDGE: &str = r"Microsoft\Edge\NativeMessagingHosts";

const PATH_PLACEHOLDER: &str = "__NATIVE_HOST_EXECUTABLE_PATH__";
const NATIVE_HOST_NAME: &str = "mozeidon-native-app";

const MANIFEST_FIREFOX: &str = "firefox_native_manifest.json";
const MANIFEST_CHROME: &str = "chrome_native_manifest.json";
const MANIFEST_EDGE: &str = MANIFEST_CHROME;
pub const MANIFEST_FILENAME: &str = "mozeidon.json";

#[derive(Debug, Clone, Copy, Serialize)]
pub enum OS {
    MacOS,
    Linux,
    Windows,
}

impl OS {
    pub fn current() -> Option<Self> {
        #[cfg(target_os = "macos")]
        {
            Some(OS::MacOS)
        }
        #[cfg(target_os = "linux")]
        {
            Some(OS::Linux)
        }
        #[cfg(target_os = "windows")]
        {
            Some(OS::Windows)
        }
        #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
        {
            None
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
pub enum Browser {
    Firefox,
    Chrome,
    Edge,
}

impl Browser {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "firefox" => Some(Browser::Firefox),
            "chrome" => Some(Browser::Chrome),
            "edge" => Some(Browser::Edge),
            _ => None,
        }
    }

    pub fn all() -> &'static [Self] {
        &[Browser::Firefox, Browser::Chrome, Browser::Edge]
    }
}

#[derive(Debug, Error)]
pub enum NativeMessagingError {
    #[error("User directory not found")]
    UserDirNotFound,

    #[error("Failed to resolve resource path: {0}")]
    ResourceResolveError(String),

    #[error("IO error: {0}")]
    Io(#[from] io::Error),

    #[error("Failed to locate sidecar binary: {0}")]
    SidecarNotFound(String),

    #[error("Unsupported platform")]
    UnsupportedPlatform,
}

/// Returns the directory name relative to user config or local data dir
pub fn get_dir_name(os: OS, browser: Browser) -> &'static str {
    match os {
        OS::MacOS => match browser {
            Browser::Firefox => DIR_MACOS_FIREFOX,
            Browser::Chrome => DIR_MACOS_CHROME,
            Browser::Edge => DIR_MACOS_EDGE,
        },
        OS::Linux => match browser {
            Browser::Firefox => DIR_LINUX_FIREFOX,
            Browser::Chrome => DIR_LINUX_CHROME,
            Browser::Edge => DIR_LINUX_EDGE,
        },
        OS::Windows => match browser {
            Browser::Firefox => DIR_WINDOWS_FIREFOX,
            Browser::Chrome => DIR_WINDOWS_CHROME,
            Browser::Edge => DIR_WINDOWS_EDGE,
        },
    }
}

pub fn get_base_user_dir(os: OS, browser: Browser) -> Option<PathBuf> {
    match os {
        OS::Windows => match browser {
            Browser::Firefox => config_dir(),
            Browser::Chrome | Browser::Edge => data_local_dir(),
        },
        OS::MacOS | OS::Linux => match browser {
            Browser::Firefox => config_dir(),
            Browser::Chrome | Browser::Edge => data_local_dir(),
        },
    }
}

pub fn get_user_dir_path(os: OS, browser: Browser) -> Result<PathBuf, NativeMessagingError> {
    let base = get_base_user_dir(os, browser).ok_or(NativeMessagingError::UserDirNotFound)?;
    println!("base : {:#?}", base);

    Ok(base.join(get_dir_name(os, browser)))
}

pub fn get_resource_manifest_path(
    app: &AppHandle,
    manifest_filename: &str,
) -> Result<PathBuf, NativeMessagingError> {
    app.path()
        .resolve(
            &format!("native-manifests/{}", manifest_filename),
            BaseDirectory::Resource,
        )
        .map_err(|e| NativeMessagingError::ResourceResolveError(e.to_string()))
}

fn get_sidecar_path(_app: &AppHandle, sidecar_name: &str) -> Result<PathBuf, io::Error> {
    let exe_dir = current_exe()?
        .parent()
        .map(|p| p.to_path_buf())
        .ok_or_else(|| {
            io::Error::new(io::ErrorKind::Other, "Failed to get executable directory")
        })?;
    Ok(exe_dir.join(sidecar_name))
}

/// Struct for frontend response
#[derive(Debug, Clone, Serialize)]
pub struct ManifestWriteResult {
    pub browser: Browser,
    pub written: bool,
    pub path: Option<String>,
    pub content: Option<String>,
}

/// Only writes manifest if browser appears installed (based on parent dir existence)
/// and if the file does not exist.
pub fn write_manifest_file(
    app: &AppHandle,
    os: OS,
    browser: Browser,
) -> Result<ManifestWriteResult, NativeMessagingError> {
    let user_dir = get_user_dir_path(os, browser)?;

    let browser_parent_dir = user_dir
        .parent()
        .ok_or(NativeMessagingError::UserDirNotFound)?;

    println!("{:#?}", browser_parent_dir);
    // Skip if browser is not installed
    if !browser_parent_dir.exists() {
        return Ok(ManifestWriteResult {
            browser,
            written: false,
            path: None,
            content: None,
        });
    }

    let dest_path = user_dir.join(MANIFEST_FILENAME);

    if dest_path.exists() {
        // File already exists, read content and respond without rewriting
        let existing_content = fs::read_to_string(&dest_path)?;
        return Ok(ManifestWriteResult {
            browser,
            written: false, // no write, file was already there
            path: Some(dest_path.to_string_lossy().into_owned()),
            content: Some(existing_content),
        });
    }

    // File doesn't exist, proceed to write it
    let manifest_filename = match browser {
        Browser::Firefox => MANIFEST_FIREFOX,
        Browser::Chrome => MANIFEST_CHROME,
        Browser::Edge => MANIFEST_EDGE,
    };

    let manifest_template_path = get_resource_manifest_path(app, manifest_filename)?;
    let manifest_contents = fs::read_to_string(&manifest_template_path)?;

    let sidecar_path = get_sidecar_path(app, NATIVE_HOST_NAME)
        .map_err(|e| NativeMessagingError::SidecarNotFound(e.to_string()))?;

    let processed_contents =
        manifest_contents.replace(PATH_PLACEHOLDER, &sidecar_path.to_string_lossy());

    fs::create_dir_all(&user_dir)?;
    fs::write(&dest_path, &processed_contents)?;

    Ok(ManifestWriteResult {
        browser,
        written: true,
        path: Some(dest_path.to_string_lossy().into_owned()),
        content: Some(processed_contents),
    })
}

/// Batch write for all browsers
pub fn write_manifests_for_all_browsers(
    app: &AppHandle,
    os: OS,
) -> Result<Vec<ManifestWriteResult>, NativeMessagingError> {
    let mut results = Vec::new();

    for &browser in Browser::all() {
        let result = write_manifest_file(app, os, browser)?;
        results.push(result);
    }

    Ok(results)
}
