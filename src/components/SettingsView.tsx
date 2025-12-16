import { useEffect, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import mozeidonLogo from "../assets/trident.svg"
import { ValidationError } from "../domain/settings/validation"
import { VersionRequirements } from "./VersionRequirements"
import { AppSettingsJsonEditor } from "./AppSettingsJsonEditor"
import { AppSettingsValidationErrors } from "./AppSettingsValidationErrors"
import { HostConfigJsonEditor } from "./HostConfigJsonEditor"
import { PanelsLauncher } from "./PanelsLauncher"
import { Context } from "../utils/constants"
import { Settings } from "../domain/settings/models"

export enum NavContext {
  Panels = "Panels",
  AppSettings = "App settings",
  HostConfig = "Host Configuration",
  About = "About",
}

export function SettingsView({
  restoreDefaults,
  onBackToList,
  showBackButton,
  context,
  tabsHandler,
  bookmarksHandler,
  historyHandler,
  recentlyClosedTabsHandler,
  settingsHandler,
}: {
  restoreDefaults: () => void
  onBackToList: () => void
  tabsHandler: (settings: Settings) => Promise<void>
  bookmarksHandler: () => Promise<void>
  historyHandler: () => Promise<void>
  recentlyClosedTabsHandler: () => Promise<void>
  settingsHandler: () => Promise<void>
  showBackButton: boolean
  context: Context
}) {
  const [navContext, setNavContext] = useState<NavContext>(NavContext.Panels)
  const { settings, setSettings } = useSettings()
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null)

  useEffect(() => {
    setNavContext(NavContext.Panels)
  }, [context])

  const renderContent = () => {
    switch (navContext) {
      case NavContext.Panels:
        return (
          <PanelsLauncher
            setNavContext={setNavContext}
            settings={settings}
            tabsHandler={tabsHandler}
            bookmarksHandler={bookmarksHandler}
            historyHandler={historyHandler}
            recentlyClosedTabsHandler={recentlyClosedTabsHandler}
            settingsHandler={settingsHandler}
          />
        )
      case NavContext.AppSettings:
        if (!settings) {
          return <div className="container">Unexpected error...</div>
        }
        return (
          <AppSettingsJsonEditor
            settings={settings}
            setSettings={setSettings}
            setValidationErrors={setValidationErrors}
          />
        )
      case NavContext.HostConfig:
        return <HostConfigJsonEditor settings={settings} />
      case NavContext.About:
        return (
          <div>
            <VersionRequirements
              restoreDefaults={restoreDefaults}
              webBrowser={settings.appSettings.web_browser}
            />
          </div>
        )
    }
  }

  return validationErrors ? (
    <AppSettingsValidationErrors
      validationErrors={validationErrors}
      onBack={() => setValidationErrors(null)}
    />
  ) : (
    <>
      <div className="settingsView">
        <div className="settingsNavbar">
          <div></div>
          <nav>
            <ul className="settingsNavbarLinks">
              <li
                tabIndex={navContext === NavContext.Panels ? -1 : 0}
                className={navContext === NavContext.Panels ? "active" : ""}
                onClick={() => setNavContext(NavContext.Panels)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setNavContext(NavContext.Panels)
                  }
                }}
              >
                {NavContext.Panels}
              </li>
              <li
                tabIndex={navContext === NavContext.AppSettings ? -1 : 0}
                className={
                  navContext === NavContext.AppSettings ? "active" : ""
                }
                onClick={() => setNavContext(NavContext.AppSettings)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setNavContext(NavContext.AppSettings)
                  }
                }}
              >
                {NavContext.AppSettings}
              </li>
              <li
                tabIndex={navContext === NavContext.HostConfig ? -1 : 0}
                className={navContext === NavContext.HostConfig ? "active" : ""}
                onClick={() => setNavContext(NavContext.HostConfig)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setNavContext(NavContext.HostConfig)
                  }
                }}
              >
                {NavContext.HostConfig}
              </li>
              <li
                tabIndex={navContext === NavContext.About ? -1 : 0}
                className={navContext === NavContext.About ? "active" : ""}
                onClick={() => setNavContext(NavContext.About)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setNavContext(NavContext.About)
                  }
                }}
              >
                {NavContext.About}
              </li>
            </ul>
          </nav>
        </div>
        <div className="settingsContent">{renderContent()}</div>
      </div>
      <div className="settingsFooter">
        {showBackButton ? (
          <button
            title="Go back to list"
            id="backFromSettingsToListButton"
            style={showBackButton ? {} : { display: "none" }}
            className="actionButton"
            onKeyDown={(e) => e.stopPropagation()}
            onClick={() => onBackToList()}
          >
            <span>&#x2190; &nbsp;</span>
            <img
              draggable={false}
              src={mozeidonLogo}
              alt="Mozeidon logo"
              style={{
                width: "1em",
                height: "1em",
                verticalAlign: "middle",
              }}
            />
          </button>
        ) : (
          <img
            draggable={false}
            src={mozeidonLogo}
            alt="Mozeidon logo"
            style={{
              width: "1em",
              height: "1em",
              verticalAlign: "middle",
              marginRight: ".5em",
              padding: "1em",
            }}
          />
        )}
      </div>
    </>
  )
}
