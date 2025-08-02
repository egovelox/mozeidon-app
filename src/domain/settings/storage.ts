import { load } from "@tauri-apps/plugin-store"
import { Settings } from "./models"

export async function fetchSettings(): Promise<Settings | undefined> {
  const store = await load("settings.json", { autoSave: false })
  const settings = await store.get<Settings>("settings")
  return settings
}

export async function saveSettings(settings: Settings): Promise<void> {
  const store = await load("settings.json", { autoSave: false })
  await store.set("settings", settings)
  await store.save()
}
