export type GlobalShortcutsKey =
  | "global_shortcut_show_panel_tabs"
  | "global_shortcut_show_panel_bookmarks"
  | "global_shortcut_show_panel_recently_closed"
  | "global_shortcut_show_panel_history"

type GlobalShortcuts = {
  [K in GlobalShortcutsKey]: string
}

type Shortcuts = {
  shortcut_copy_selected_item_url: string
  shortcut_close_mozeidon_window: string
  shortcut_close_a_tab: string
  shortcut_list_down: string
  shortcut_list_up: string
  shortcut_edit_bookmark: string
}

export type Settings = {
  theme: string
  web_browser: string
  web_search_engine_urls: string[]
  date_locale: string
  show_favicons: boolean
} & GlobalShortcuts &
  Shortcuts

export const defaultSettings: Settings = {
  theme: "system",
  web_browser: "firefox",
  web_search_engine_urls: [
    "https://www.google.com?q=",
    "https://www.duckduckgo.com?q=",
    "https://www.qwant.com?q=",
  ],
  date_locale: "en-EN",
  show_favicons: true,
  global_shortcut_show_panel_tabs: "Control+;",
  global_shortcut_show_panel_bookmarks: "Control+'",
  global_shortcut_show_panel_recently_closed: "",
  global_shortcut_show_panel_history: "",
  shortcut_copy_selected_item_url: "",
  shortcut_close_mozeidon_window: "Control+x",
  shortcut_close_a_tab: "Control+l",
  shortcut_list_down: "ArrowDown",
  shortcut_list_up: "ArrowUp",
  shortcut_edit_bookmark: "Control+m",
}

export function getGlobalShortcuts(settings: Settings): GlobalShortcuts {
  return {
    global_shortcut_show_panel_tabs: settings.global_shortcut_show_panel_tabs,
    global_shortcut_show_panel_bookmarks:
      settings.global_shortcut_show_panel_bookmarks,
    global_shortcut_show_panel_recently_closed:
      settings.global_shortcut_show_panel_recently_closed,
    global_shortcut_show_panel_history:
      settings.global_shortcut_show_panel_history,
  }
}

export function getShortcuts(settings: Settings): Shortcuts {
  return {
    shortcut_copy_selected_item_url: settings.shortcut_copy_selected_item_url,
    shortcut_close_mozeidon_window: settings.shortcut_close_mozeidon_window,
    shortcut_close_a_tab: settings.shortcut_close_a_tab,
    shortcut_list_up: settings.shortcut_list_up,
    shortcut_list_down: settings.shortcut_list_down,
    shortcut_edit_bookmark: settings.shortcut_edit_bookmark,
  }
}
