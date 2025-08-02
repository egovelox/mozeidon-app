import {
  register,
  isRegistered,
  unregister,
} from "@tauri-apps/plugin-global-shortcut"
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { fetchSettings, saveSettings } from "../domain/settings/storage"
import {
  GlobalShortcutsKey,
  Settings,
  defaultSettings,
  getGlobalShortcuts,
} from "../domain/settings/models"
import { emit } from "@tauri-apps/api/event"
import { INACTIVE_SHORTCUT_VALUE } from "../utils/constants"
import { applyTheme } from "../utils/applyTheme"

type SettingsContextType = {
  settings: Settings
  setSettings: (settings: Settings) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
)

type SettingsProviderProps = {
  children: React.ReactNode
  shortcutsHandlers: {
    [K in GlobalShortcutsKey]: () => Promise<void>
  }
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  shortcutsHandlers,
}) => {
  /* initialize settings to undefined */
  const [settings, setSettingsState] = useState<Settings | undefined>(undefined)
  const [isDirty, setIsDirty] = useState(false)
  const [shouldRegister, setShouldRegister] = useState(false)
  const previousSettingsRef = useRef<Settings | undefined>(undefined)

  // At start, load settings from server
  useEffect(() => {
    fetchSettings()
      .then((fetched) => {
        const newSettings = fetched
          ? { ...defaultSettings, ...fetched }
          : defaultSettings
        setSettingsState(newSettings)
        applyTheme(newSettings.theme)
      })
      .then(() => setShouldRegister(true))
      .catch(() => {
        setSettingsState(defaultSettings)
        applyTheme(defaultSettings.theme)
      })
  }, [])

  // Save settings after the user changed them
  useEffect(() => {
    if (settings && isDirty) {
      applyTheme(settings.theme)
      saveSettings(settings)
        .then(() => setShouldRegister(true))
        .catch(() => {})
    }
  }, [settings, isDirty])

  // Register global-shortcuts
  useEffect(() => {
    if (settings && shouldRegister) {
      const globalShortcuts = getGlobalShortcuts(settings)
      const tasks = []
      for (const [key, globalShortcut] of Object.entries(globalShortcuts)) {
        const task = async () => {
          // 1. handle register
          if (globalShortcut !== INACTIVE_SHORTCUT_VALUE) {
            if (await isRegistered(globalShortcut)) {
              return
            }
            await register(globalShortcut, (event) => {
              if (event.state === "Pressed") {
                shortcutsHandlers[key as GlobalShortcutsKey]()
              }
            })
          }

          // 2. handle unregister
          if (previousSettingsRef.current) {
            const k = key as GlobalShortcutsKey
            const oldGlobalShortcuts = getGlobalShortcuts(
              previousSettingsRef.current
            )
            if (
              oldGlobalShortcuts[k] !== INACTIVE_SHORTCUT_VALUE &&
              globalShortcut !== oldGlobalShortcuts[k] &&
              (await isRegistered(oldGlobalShortcuts[k]))
            ) {
              await unregister(oldGlobalShortcuts[k]).then((_) =>
                emit("js-message", {
                  message: `unregistered ${oldGlobalShortcuts[k]}`,
                })
              )
            }
          }
        }
        tasks.push(task())
      }
      Promise.all(tasks)
        .then((_) => {
          setShouldRegister(false)
        })
        .catch((_) => {})
      return
    }
  }, [shouldRegister])

  // Wrap setSettings to track user changes
  const setSettings = (newSettings: Settings) => {
    previousSettingsRef.current = settings
    setIsDirty(true)
    setSettingsState(newSettings)
  }

  // Don't render children until settings are loaded
  if (!settings) return null

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
