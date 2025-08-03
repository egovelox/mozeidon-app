import { useState } from "react"
import { useSettings } from "../hooks/useSettings"
import mozeidonLogo from "../assets/trident.svg"
import { ValidationError } from "../domain/settings/validation"
import { VersionRequirements } from "./VersionRequirements"
import { SettingsJsonEditor } from "./SettingsJsonEditor"
import { SettingsValidationErrors } from "./SettingsValidationErrors"

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
          <SettingsJsonEditor
            settings={settings}
            setSettings={setSettings}
            setValidationErrors={setValidationErrors}
          />
        )
      case NavContext.HostConfig:
        return null
      case NavContext.About:
        return <VersionRequirements />
    }
  }

  return validationErrors ? (
    <SettingsValidationErrors
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
              className={navContext === NavContext.AppSettings ? "active" : ""}
              onClick={() => setNavContext(NavContext.AppSettings)}
            >
              {NavContext.AppSettings}
            </li>
            <li
              className={navContext === NavContext.HostConfig ? "active" : ""}
              onClick={() => setNavContext(NavContext.HostConfig)}
            >
              {NavContext.HostConfig}
            </li>
            <li
              className={navContext === NavContext.About ? "active" : ""}
              onClick={() => setNavContext(NavContext.About)}
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
