export type GlobalShortcutsKey =
  | "global_shortcut_show_panel_tabs"
  | "global_shortcut_show_panel_bookmarks"
  | "global_shortcut_show_panel_recently_closed"
  | "global_shortcut_show_panel_history"
  | "global_shortcut_show_panel_settings"
  | "global_shortcut_switch_last_visited_tab"
  | "global_shortcut_close_current_tab"

type GlobalShortcuts = {
  [K in GlobalShortcutsKey]: string
}

type Shortcuts = {
  shortcut_copy_selected_item_url: string
  shortcut_hide_panel: string
  shortcut_close_item: string
  shortcut_list_down: string
  shortcut_list_up: string
  shortcut_edit_bookmark: string
}

export type AppSettings = { web_browser: string } & GlobalShortcuts &
  Shortcuts & {
    theme: string
    show_favicons: boolean
    date_locale: string
    web_search_engine_urls: string[]
  }

export type BrowserManifest = {
  browser: string
  written: boolean
  path?: string
  content?: string
}

export type HostConfigurationSettings = {
  browserManifests: BrowserManifest[]
  userHomeDir: string
}
export type Settings = {
  appSettings: AppSettings
  hostConfigurationSettings: HostConfigurationSettings
}

export const defaultSettings: AppSettings = {
  web_browser: "firefox",
  global_shortcut_show_panel_tabs: "",
  global_shortcut_show_panel_bookmarks: "",
  global_shortcut_show_panel_recently_closed: "",
  global_shortcut_show_panel_history: "",
  global_shortcut_show_panel_settings: "",
  global_shortcut_switch_last_visited_tab: "",
  global_shortcut_close_current_tab: "",
  shortcut_copy_selected_item_url: "",
  shortcut_hide_panel: "",
  shortcut_close_item: "",
  shortcut_list_down: "",
  shortcut_list_up: "",
  shortcut_edit_bookmark: "",
  theme: "system",
  show_favicons: true,
  date_locale: "en-EN",
  web_search_engine_urls: [
    "https://www.google.com/search?q=",
    "https://addons.mozilla.org/en-US/firefox/search/?q=",
  ],
}

export function getGlobalShortcuts(settings: AppSettings): GlobalShortcuts {
  return {
    global_shortcut_show_panel_tabs: settings.global_shortcut_show_panel_tabs,
    global_shortcut_show_panel_bookmarks:
      settings.global_shortcut_show_panel_bookmarks,
    global_shortcut_show_panel_recently_closed:
      settings.global_shortcut_show_panel_recently_closed,
    global_shortcut_show_panel_history:
      settings.global_shortcut_show_panel_history,
    global_shortcut_show_panel_settings:
      settings.global_shortcut_show_panel_settings,
    global_shortcut_switch_last_visited_tab:
      settings.global_shortcut_switch_last_visited_tab,
    global_shortcut_close_current_tab:
      settings.global_shortcut_close_current_tab,
  }
}

export function getShortcuts(settings: AppSettings): Shortcuts {
  return {
    shortcut_copy_selected_item_url: settings.shortcut_copy_selected_item_url,
    shortcut_hide_panel: settings.shortcut_hide_panel,
    shortcut_close_item: settings.shortcut_close_item,
    shortcut_list_up: settings.shortcut_list_up,
    shortcut_list_down: settings.shortcut_list_down,
    shortcut_edit_bookmark: settings.shortcut_edit_bookmark,
  }
}
