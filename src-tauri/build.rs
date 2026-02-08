use std::env;
use std::fs::{self, File};
use std::io::{self, Read};
use std::path::{Path, PathBuf};

const MOZEIDON_CLI_RELEASE_URL: &str =
    "https://github.com/egovelox/mozeidon/releases/download/v4.0.0";
const MOZEIDON_NATIVE_APP_RELEASE_URL: &str =
    "https://github.com/egovelox/mozeidon-native-app/releases/download/v4.0.0";

fn main() {
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let binaries_dir = manifest_dir.join("binaries");

    // Ensure binaries directory exists
    fs::create_dir_all(&binaries_dir).unwrap();

    let target = env::var("TARGET").unwrap();
    let target_arch = map_target_to_arch(&target);

    // Only download binaries for supported platforms
    if let Some(arch) = target_arch {
        println!("cargo:warning=Building for target: {} ({})", target, arch);

        // Check and download mozeidon if needed (the binary is called "mozeidon" in releases)
        ensure_binary_exists(
            &binaries_dir,
            "mozeidon",
            arch,
            MOZEIDON_CLI_RELEASE_URL,
            "tar.gz",
            "mozeidon-cli", // Rename to mozeidon-cli
        );

        // Check and download mozeidon-native-app if needed
        ensure_binary_exists(
            &binaries_dir,
            "mozeidon-native-app",
            arch,
            MOZEIDON_NATIVE_APP_RELEASE_URL,
            "tar.gz",
            "mozeidon-native-app", // Keep same name
        );
    } else {
        println!(
            "cargo:warning=Skipping binary download for unsupported target: {}",
            target
        );
    }

    tauri_build::build()
}

fn map_target_to_arch(target: &str) -> Option<&str> {
    match target {
        "aarch64-apple-darwin" => Some("aarch64-apple-darwin"),
        "x86_64-apple-darwin" => Some("x86_64-apple-darwin"),
        "x86_64-unknown-linux-gnu" => Some("x86_64-unknown-linux-gnu"),
        _ => None,
    }
}

fn map_target_to_release_name(target: &str) -> &str {
    match target {
        "aarch64-apple-darwin" | "x86_64-apple-darwin" => "Darwin_all",
        "x86_64-unknown-linux-gnu" => "Linux_x86_64",
        _ => panic!("Unsupported target: {}", target),
    }
}

fn ensure_binary_exists(
    binaries_dir: &Path,
    binary_name: &str,
    target_arch: &str,
    release_url: &str,
    archive_type: &str,
    extract_as: &str, // The name to use when saving the extracted binary
) {
    let binary_path = binaries_dir.join(format!("{}-{}", extract_as, target_arch));

    // CHECK IF BINARY ALREADY EXISTS
    if binary_path.exists() {
        println!(
            "cargo:warning=✓ {} already exists, skipping download",
            extract_as
        );
        return;
    }

    // Binary doesn't exist, download it
    println!(
        "cargo:warning=↓ Downloading {} for {}...",
        binary_name, target_arch
    );

    if let Err(e) = download_and_extract(
        binaries_dir,
        binary_name,
        target_arch,
        release_url,
        archive_type,
        extract_as,
    ) {
        panic!("Failed to download {}: {}", binary_name, e);
    }

    println!("cargo:warning=✓ Successfully downloaded {}", binary_name);
}

fn download_and_extract(
    binaries_dir: &Path,
    binary_name: &str,
    target_arch: &str,
    release_url: &str,
    archive_type: &str,
    extract_as: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Get the target from the environment to map to release naming
    let target = env::var("TARGET").unwrap();
    let release_name = map_target_to_release_name(&target);

    let archive_name = format!("{}_{}.{}", binary_name, release_name, archive_type);
    let download_url = format!("{}/{}", release_url, archive_name);

    println!("cargo:warning=  Downloading from: {}", download_url);

    // Download the archive
    let response = ureq::get(&download_url)
        .call()
        .map_err(|e| format!("Failed to download: {}", e))?;

    let mut archive_data = Vec::new();
    response
        .into_reader()
        .read_to_end(&mut archive_data)
        .map_err(|e| format!("Failed to read response: {}", e))?;

    // Extract based on archive type
    match archive_type {
        "tar.gz" => extract_tar_gz(
            &archive_data,
            binaries_dir,
            binary_name,
            target_arch,
            extract_as,
        )?,
        "zip" => extract_zip(
            &archive_data,
            binaries_dir,
            binary_name,
            target_arch,
            extract_as,
        )?,
        _ => return Err(format!("Unsupported archive type: {}", archive_type).into()),
    }

    // Set executable permissions on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let binary_path = binaries_dir.join(format!("{}-{}", extract_as, target_arch));
        if binary_path.exists() {
            let mut perms = fs::metadata(&binary_path)?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&binary_path, perms)?;
            println!("cargo:warning=  Set executable permissions");
        }
    }

    Ok(())
}

fn extract_tar_gz(
    archive_data: &[u8],
    binaries_dir: &Path,
    binary_name: &str,
    target_arch: &str,
    extract_as: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    use flate2::read::GzDecoder;
    use tar::Archive;

    let decoder = GzDecoder::new(archive_data);
    let mut archive = Archive::new(decoder);

    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?;

        // Look for the binary file (might be in root or subdirectory)
        if let Some(filename) = path.file_name() {
            let filename_str = filename.to_string_lossy();
            // Match files that start with the binary name (handles with or without extensions)
            if filename_str.starts_with(binary_name) || filename_str == binary_name {
                let output_path = binaries_dir.join(format!("{}-{}", extract_as, target_arch));
                let mut output_file = File::create(&output_path)?;
                io::copy(&mut entry, &mut output_file)?;
                println!("cargo:warning=  Extracted to: {}", output_path.display());
                return Ok(());
            }
        }
    }

    Err(format!("Binary '{}' not found in tar.gz archive", binary_name).into())
}

fn extract_zip(
    archive_data: &[u8],
    binaries_dir: &Path,
    binary_name: &str,
    target_arch: &str,
    extract_as: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    use std::io::Cursor;
    use zip::ZipArchive;

    let reader = Cursor::new(archive_data);
    let mut archive = ZipArchive::new(reader)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;

        if let Some(filename) = file.name().split('/').last() {
            // Match files that start with the binary name
            if filename.starts_with(binary_name) || filename == binary_name {
                let output_path = binaries_dir.join(format!("{}-{}", extract_as, target_arch));
                let mut output_file = File::create(&output_path)?;
                io::copy(&mut file, &mut output_file)?;
                println!("cargo:warning=  Extracted to: {}", output_path.display());
                return Ok(());
            }
        }
    }

    Err(format!("Binary '{}' not found in zip archive", binary_name).into())
}
