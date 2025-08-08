import { platform } from "@tauri-apps/plugin-os"

export function getPlatform(): string {
  return platform()
}

export function isLinuxPlatform(): boolean {
  const platform = getPlatform()
  switch (platform) {
    case "linux":
      return true
    default:
      return false
  }
}

export function getBrowserRedirectionCommand(platform: string): string {
  switch (platform) {
    case "macos":
      return "open -a"
    case "linux":
      return "wmctrl -xa"
    default:
      return ""
  }
}
