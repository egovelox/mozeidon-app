import { load } from "@tauri-apps/plugin-store"
import { AppSettings } from "./models"

export async function fetchAppSettings(): Promise<AppSettings | undefined> {
  const store = await load("settings.json", { autoSave: false })
  const settings = await store.get<AppSettings>("app_settings")
  return settings
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const store = await load("settings.json", { autoSave: false })
  await store.set("app_settings", settings)
  await store.save()
}

export type CustomManifest = {
  browserName: string
  manifestRelativeDir: string
}

export async function fetchCustomBrowserManifests(): Promise<CustomManifest[]> {
  const store = await load("settings.json", { autoSave: false })
  const customManifests = await store.get<CustomManifest[]>(
    "custom_browser_manifests"
  )
  return customManifests ?? []
}

export async function saveCustomBrowserManifests(
  customManifests: CustomManifest[]
): Promise<void> {
  const store = await load("settings.json", { autoSave: false })
  await store.set("custom_browser_manifests", customManifests)
  await store.save()
}
