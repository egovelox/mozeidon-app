import { Settings } from "../domain/settings/models"
import { capitalize } from "../utils/strings"
import { NavContext } from "./SettingsView"

interface PanelsLauncherProps {
  settings: Settings
  setNavContext: React.Dispatch<React.SetStateAction<NavContext>>
  tabsHandler: (settings: Settings) => Promise<void>
  bookmarksHandler: () => Promise<void>
  historyHandler: () => Promise<void>
  recentlyClosedTabsHandler: () => Promise<void>
  settingsHandler: () => Promise<void>
}

enum PanelLauncher {
  TABS = "TABS",
  BOOKMARKS = "BOOKMARKS",
  HISTORY = "HISTORY",
  RECENTLY_CLOSED_TABS = "RECENTLY_CLOSED_TABS",
  SETTINGS = "SETTINGS",
}

export const PanelsLauncher = ({
  tabsHandler,
  bookmarksHandler,
  historyHandler,
  recentlyClosedTabsHandler,
  settingsHandler,
  settings,
  setNavContext,
}: PanelsLauncherProps) => {
  const getShortcut = (panel: PanelLauncher) => {
    const noShortCut = "Currently no global shortcut"
    const appSettings = settings.appSettings
    let shortCut = noShortCut
    switch (panel) {
      case PanelLauncher.TABS:
        shortCut = appSettings.global_shortcut_show_panel_tabs || noShortCut
        break
      case PanelLauncher.BOOKMARKS:
        shortCut =
          appSettings.global_shortcut_show_panel_bookmarks || noShortCut
        break
      case PanelLauncher.HISTORY:
        shortCut = appSettings.global_shortcut_show_panel_history || noShortCut
        break
      case PanelLauncher.RECENTLY_CLOSED_TABS:
        shortCut =
          appSettings.global_shortcut_show_panel_recently_closed || noShortCut
        break
      case PanelLauncher.SETTINGS:
        shortCut = appSettings.global_shortcut_show_panel_settings || noShortCut
        break
    }
    return shortCut.split("+").map(capitalize).join(" + ")
  }

  return (
    <div className="panelLauncherContainer">
      <div className="panelLauncher">
        <button
          className="actionButton panelLauncherButton"
          onClick={() => tabsHandler(settings)}
        >
          Tabs
        </button>
        <div className="panelLauncherDescription">
          <div> Show and manage your tabs </div>
          <div
            title="Edit shortcut"
            className="panelLauncherShortcut"
            onClick={() => setNavContext(NavContext.AppSettings)}
          >
            {getShortcut(PanelLauncher.TABS)}
          </div>
        </div>
      </div>
      <div className="panelLauncher">
        <button
          className="actionButton panelLauncherButton"
          onClick={recentlyClosedTabsHandler}
        >
          Recently closed tabs
        </button>
        <div className="panelLauncherDescription">
          <div> Show and manage your recently closed tabs </div>
          <div
            title="Edit shortcut"
            className="panelLauncherShortcut"
            onClick={() => setNavContext(NavContext.AppSettings)}
          >
            {getShortcut(PanelLauncher.RECENTLY_CLOSED_TABS)}
          </div>
        </div>
      </div>
      <div className="panelLauncher">
        <button
          className="actionButton panelLauncherButton"
          onClick={bookmarksHandler}
        >
          Bookmarks
        </button>
        <div className="panelLauncherDescription">
          <div> Show and manage your bookmarks </div>
          <div
            title="Edit shortcut"
            className="panelLauncherShortcut"
            onClick={() => setNavContext(NavContext.AppSettings)}
          >
            {getShortcut(PanelLauncher.BOOKMARKS)}
          </div>
        </div>
      </div>
      <div className="panelLauncher">
        <button
          className="actionButton panelLauncherButton"
          onClick={historyHandler}
        >
          History
        </button>
        <div className="panelLauncherDescription">
          <div> Show and manage your history </div>
          <div
            title="Edit shortcut"
            className="panelLauncherShortcut"
            onClick={() => setNavContext(NavContext.AppSettings)}
          >
            {getShortcut(PanelLauncher.HISTORY)}
          </div>
        </div>
      </div>
      <div className="panelLauncher">
        <button
          className="actionButton panelLauncherButton"
          onClick={settingsHandler}
        >
          Settings
        </button>
        <div className="panelLauncherDescription">
          <div> Show the settings panel </div>
          <div
            title="Edit shortcut"
            className="panelLauncherShortcut"
            onClick={() => setNavContext(NavContext.AppSettings)}
          >
            {getShortcut(PanelLauncher.SETTINGS)}
          </div>
        </div>
      </div>
    </div>
  )
}
