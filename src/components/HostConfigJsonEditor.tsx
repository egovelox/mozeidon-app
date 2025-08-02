import { useEffect, useState } from "react"
import { Settings } from "../domain/settings/models"
import { AUTO_CONFIGURED_BROWSERS } from "../utils/constants"
import { NativeManifestJsonEditor } from "./NativeManifestJsonEditor"
import { NativeManifestEditor } from "./NativeManifestEditor"
import { getBrowserRedirectionCommand, getPlatform } from "../utils/getPlatform"
import { switchToBrowserWindow } from "../actions/actions"
import { invoke } from "@tauri-apps/api/core"
import { emit } from "@tauri-apps/api/event"

export function HostConfigJsonEditor({ settings }: { settings: Settings }) {
  const webBrowser = settings.appSettings.web_browser
  const manifests = settings.hostConfigurationSettings.browserManifests
  const autoConfiguredManifests = manifests.filter(
    (m) => m.content && AUTO_CONFIGURED_BROWSERS.includes(m.browser)
  )
  const userConfiguredManifests = manifests.filter(
    (m) => !AUTO_CONFIGURED_BROWSERS.includes(m.browser)
  )

  const [showEditor, setShowEditor] = useState(false)
  const platform = getPlatform()
  const isLinuxPlatform = platform === "linux"
  const [isWmctrlInstalled, setIsWmctrlInstalled] = useState(false)

  if (isLinuxPlatform) {
    useEffect(() => {
      const checkIsWmctrlInstalled = async () => {
        emit("js-message", { message: "call checkIsWmctrlInstalled" })
        if (await invoke<boolean>("is_wmctrl_installed")) {
          setIsWmctrlInstalled(true)
        }
      }
      checkIsWmctrlInstalled()
    }, [])
  }

  const [displayBrowserRedirectionInfo, setDisplayBrowserRedirectionInfo] =
    useState(false)
  const [displayNativeManifestInfo, setDisplayNativeManifestInfo] =
    useState(false)

  return !showEditor ? (
    <div>
      <div style={{ marginBottom: "1em" }}>
        <span className="settingsTitle">
          <b>Browser-window redirection</b>
        </span>
        <span
          className="moreInfo"
          onClick={() =>
            setDisplayBrowserRedirectionInfo((current) => !current)
          }
        >
          &nbsp;&nbsp;more info...
        </span>
        <div
          className={`mozeidonDocInfo ${
            displayBrowserRedirectionInfo ? "visible" : ""
          }`}
        >
          <br />
          A redirection happens when the panel redirects you to your
          browser-window.
          <br />
          E.g when you double-click a tab item in the Swell tabs' panel.
          <br />
          <br />
          Internally on your {platform} platform, this redirection is triggered
          by a shell-command : <b>{getBrowserRedirectionCommand(platform)}</b>{" "}
          <b className="mozeidonColor">{webBrowser}</b>
        </div>

        {isLinuxPlatform && !isWmctrlInstalled ? (
          <div className="mozeidonDocInfo visible">
            <br />
            Currently, mozeidon cannot find a{" "}
            <b className="mozeidonColor">wmctrl</b> command available on your
            device.
            <br />
            <b className="mozeidonColor">Please install it first</b>, in order
            to enable browser-window redirection !
          </div>
        ) : (
          <div className="mozeidonDocInfo visible">
            <br />
            Current redirection is set to the{" "}
            <b className="mozeidonColor"> {webBrowser}</b> browser-window.
            <br />
            By changing the <b>web_browser</b> value in App settings, you can
            redirect to another browser.
            <br />
            <br />
            You can use the button below to test the redirection.
            <br />
            Note that <b>redirection cannot work correctly</b> if your browser
            has more than one opened window.
            {isLinuxPlatform && (
              <>
                <br />
                Note that <b>redirection cannot work</b> if your window-manager
                has focus stealing prevention (e.g GNOME).
              </>
            )}
            <br />
            <br />
            <button
              id="checkBrowserRedirectionButton"
              style={{ marginLeft: ".1em" }}
              className="actionButton"
              onClick={async () => {
                await invoke("hide")
                await switchToBrowserWindow(webBrowser)
              }}
            >
              Check browser-window redirection
            </button>
          </div>
        )}
      </div>
      <div>
        <div style={{ paddingBottom: "2em" }}>
          <span className="settingsTitle">
            <b>Browsers & native-manifests</b>
          </span>
          <span
            className="moreInfo"
            onClick={() => setDisplayNativeManifestInfo((current) => !current)}
          >
            &nbsp;&nbsp;more info...
          </span>
          <div
            className={`mozeidonDocInfo ${
              displayNativeManifestInfo ? "visible" : ""
            }`}
          >
            <br />A <b>native manifest</b> is a web-browser configuration file
            that must be stored in your file-system.
            <br />
            <br />
            This file contains the registration of the{" "}
            <b>native-messaging-host</b>,
            <br />
            a program responsible for exchanging messages with the
            browser-extension.
            <br />
            <br />
            If <b>Chrome</b>, <b>Edge</b> or <b>Firefox</b> browser is already
            installed on your machine,
            <br />
            the native-manifest file should be automatically created by our app.
            <br />
            It should be visible in the list below.
            <br />
            <br />
            To use <b>another browser</b>, you first need to find the correct
            native-manifest location (where the file should be stored).
            <br />
            Then you can create the native-manifest file using the Add a new
            native-manifest form ( see below ).
            <br />
            Or you can create the native-manifest file yourself in your
            file-system.
          </div>
        </div>
        <div className="container">
          {autoConfiguredManifests.length === 0 ? (
            <div>
              No auto-configured native-manifest : could not discover Firefox,
              Chrome or Edge browser.
            </div>
          ) : (
            <>
              <div className="rowWithMarginBottom" style={{ fontSize: ".8em" }}>
                <span className="settingsTitle">
                  <b> • Auto-configured </b>
                </span>
              </div>
              {autoConfiguredManifests.map((m) => (
                <NativeManifestJsonEditor
                  manifest={m}
                  key={m.path ?? m.browser}
                />
              ))}
            </>
          )}
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
              className="actionButton"
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
    </div>
  ) : (
    <NativeManifestEditor
      handleBackButtonClick={() => {
        setShowEditor(false)
      }}
    />
  )
}
