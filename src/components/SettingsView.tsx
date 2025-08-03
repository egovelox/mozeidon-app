import { useState } from "react"
import { useSettings } from "../hooks/useSettings"
import mozeidonLogo from "../assets/trident.svg"
import { ValidationError } from "../domain/settings/validation"
import { VersionRequirements } from "./VersionRequirements"
import { AppSettingsJsonEditor } from "./AppSettingsJsonEditor"
import { AppSettingsValidationErrors } from "./AppSettingsValidationErrors"
import { HostConfigJsonEditor } from "./HostConfigJsonEditor"
import mozeidonArchi from "../assets/mozeidon-archi.svg"

enum NavContext {
  AppSettings = "App settings",
  HostConfig = "Host Configuration",
  About = "About",
}

export function SettingsView({
  onBackToList,
  showBackButton,
}: {
  onBackToList: () => void
  showBackButton: boolean
}) {
  const [navContext, setNavContext] = useState<NavContext>(
    NavContext.AppSettings
  )
  const { settings, setSettings } = useSettings()
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null)

  const renderContent = () => {
    switch (navContext) {
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
            <VersionRequirements />
            <div style={{ display: "flex" }}>
              <img
                src={mozeidonArchi}
                alt="Mozeidon archi"
                style={{
                  width: "600px",
                  height: "300px",
                }}
              />
            </div>
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
    <div className="settingsView">
      <div className="settingsNavbar">
        <div>
          {showBackButton ? (
            <button
              id="backFromSettingsToListButton"
              style={showBackButton ? {} : { display: "none" }}
              className="actionButton"
              onKeyDown={(e) => e.stopPropagation()}
              onClick={() => onBackToList()}
            >
              <span>&#x2190; &nbsp;</span>
              <img
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
        <nav>
          <ul className="settingsNavbarLinks">
            <li
              role="tab"
              tabIndex={navContext === NavContext.AppSettings ? -1 : 0}
              className={navContext === NavContext.AppSettings ? "active" : ""}
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
              role="tab"
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
              role="tab"
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
  )
}
