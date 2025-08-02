import { platform } from "@tauri-apps/plugin-os"

export function getPlatform(): string {
  return platform()
}
