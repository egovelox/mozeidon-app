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
import {
  fetchAppSettings,
  saveAppSettings,
  saveCustomBrowserManifests,
} from "../domain/settings/storage"
import {
  GlobalShortcutsKey,
  Settings,
  defaultSettings,
  getGlobalShortcuts,
} from "../domain/settings/models"
import { emit } from "@tauri-apps/api/event"
import {
  AUTO_CONFIGURED_BROWSERS,
  INACTIVE_SHORTCUT_VALUE,
} from "../utils/constants"
import { applyTheme } from "../utils/applyTheme"
import { getBrowserManifests, getUserHomeDir } from "../actions/actions"

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
    fetchAppSettings()
      .then((fetched) => {
        const appSettings = fetched
          ? { ...defaultSettings, ...fetched }
          : defaultSettings
        //setSettingsState(newAppSettings)
        applyTheme(appSettings.theme)
        return appSettings
      })
      .then(async (appSettings) => ({
        appSettings,
        browserManifests: await getBrowserManifests(),
        userHomeDir: await getUserHomeDir(),
      }))
      .then(({ appSettings, browserManifests, userHomeDir }) => {
        setSettingsState({
          appSettings,
          hostConfigurationSettings: { browserManifests, userHomeDir },
        })
        setShouldRegister(true)
      })
      .catch(() => {
        setSettingsState({
          appSettings: defaultSettings,
          hostConfigurationSettings: { browserManifests: [], userHomeDir: "" },
        })
        applyTheme(defaultSettings.theme)
      })
  }, [])

  // Save settings after the user changed them
  useEffect(() => {
    if (settings && isDirty) {
      applyTheme(settings.appSettings.theme)
      saveAppSettings(settings.appSettings)
        .then(() => setShouldRegister(true))
        .then(() =>
          saveCustomBrowserManifests(
            settings.hostConfigurationSettings.browserManifests
              .filter((m) => !AUTO_CONFIGURED_BROWSERS.includes(m.browser))
              .map((m) => ({
                browserName: m.browser,
                manifestRelativeDir: m.path,
              }))
          )
        )
        .catch(() => {})
    }
  }, [settings, isDirty])

  // Register global-shortcuts
  useEffect(() => {
    if (settings && shouldRegister) {
      const globalShortcuts = getGlobalShortcuts(settings.appSettings)
      const tasks = []
      for (const [key, globalShortcut] of Object.entries(globalShortcuts)) {
        const task = async () => {
          // 1. handle register
          if (globalShortcut !== INACTIVE_SHORTCUT_VALUE) {
            if (await isRegistered(globalShortcut)) {
              return
            }
            try {
              await register(globalShortcut, (event) => {
                if (event.state === "Pressed") {
                  shortcutsHandlers[key as GlobalShortcutsKey]()
                }
              })
            } catch (e) {
              await emit("js-message", { message: `${JSON.stringify(e)}` })
            }
          }

          // 2. handle unregister
          if (previousSettingsRef.current) {
            const k = key as GlobalShortcutsKey
            const oldGlobalShortcuts = getGlobalShortcuts(
              previousSettingsRef.current.appSettings
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
