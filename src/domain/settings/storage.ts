import { load } from "@tauri-apps/plugin-store"

import { AppSettings, BrowserManifest } from "./models"

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
