import { Dispatch, SetStateAction, useState } from "react"
import { Settings } from "../domain/settings/models"
import { ValidationError } from "../domain/bookmarks/validation"
import { githubDarkTheme, JsonEditor } from "json-edit-react"
import { AUTO_CONFIGURED_BROWSERS } from "../utils/constants"
import { NativeManifestJsonEditor } from "./NativeManifestJsonEditor"
import infoLogo from "../assets/info-circle.svg"
import { NativeManifestEditor } from "./NativeManifestEditor"

export function HostConfigJsonEditor({
  settings,
  setSettings,
  setValidationErrors,
}: {
  settings: Settings
  setSettings: (s: Settings) => void
  setValidationErrors: Dispatch<SetStateAction<ValidationError[] | null>>
}) {
  const manifests = settings.hostConfigurationSettings.browserManifests
  const autoConfiguredManifests = manifests.filter((m) =>
    AUTO_CONFIGURED_BROWSERS.includes(m.browser)
  )
  const userConfiguredManifests = manifests.filter(
    (m) => !AUTO_CONFIGURED_BROWSERS.includes(m.browser)
  )

  const [displayNativeManifestInfo, setDisplayNativeManifestInfo] =
    useState(false)
  const [showEditor, setShowEditor] = useState(false)
  return !showEditor ? (
    <div>
      <div style={{ marginBottom: "1em" }}>
        <span>
          <b>Browsers & native-manifests</b>
        </span>
        <img
          onClick={() => setDisplayNativeManifestInfo((current) => !current)}
          src={infoLogo}
          alt="Info"
          style={{
            width: "1.3em",
            height: "1.3em",
            verticalAlign: "text-bottom",
            marginLeft: "0.3em",
          }}
        />
        <div
          className={`mozeidonDocInfo ${
            displayNativeManifestInfo ? "visible" : ""
          }`}
        >
          <br />A <b>native manifest</b> is a file that must be stored in the
          web-browser configuration, at a fixed location.
          <br />
          This file allows to register the <b>native-messaging-host</b> that can
          communicate with the mozeidon browser extension.
          <br />
          <br />
          If <b>Chrome</b>, <b>Edge</b> or <b>Firefox</b> browser is already
          installed on your machine,
          <br />
          the native-manifest is automatically registered by this app. It should
          be visible in the list below.
          <br />
          <br />
          To use <b>another browser</b>, you first need to find the correct
          native-manifest location.
          <br />
          Then you can create the native-manifest using the Add a new
          native-manifest.
          <br />
          Note : you can also create it yourself in your file-system.
        </div>
      </div>
      <div className="container">
        <div className="rowWithMarginBottom" style={{ fontSize: ".8em" }}>
          <b> • Auto-configured </b>
        </div>
        {autoConfiguredManifests.map((m) => (
          <NativeManifestJsonEditor manifest={m} key={m.path ?? m.browser} />
        ))}
      </div>
      <div className="container">
        <div
          className="rowWithMarginBottom"
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: ".8em",
            marginTop: "1em",
          }}
        >
          {userConfiguredManifests.length !== 0 && (
            <div style={{ marginRight: "1em" }}>
              <b> • User-configured </b>
            </div>
          )}
          <button
            id="registerNewManifestButton"
            className="actionButton actionButtonNoMargin"
            onClick={() => setShowEditor(true)}
          >
            Add a native-manifest
          </button>
        </div>
        {userConfiguredManifests.map((m) => (
          <NativeManifestJsonEditor manifest={m} key={m.path} />
        ))}
      </div>
    </div>
  ) : (
    <NativeManifestEditor
      handleBackButtonClick={() => {
        setShowEditor(false)
      }}
    />
  )
}
