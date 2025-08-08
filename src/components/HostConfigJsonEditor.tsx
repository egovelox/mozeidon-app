import { useEffect, useState } from "react"
import { Settings } from "../domain/settings/models"
import { AUTO_CONFIGURED_BROWSERS } from "../utils/constants"
import { NativeManifestJsonEditor } from "./NativeManifestJsonEditor"
import infoLogo from "../assets/info-circle.svg"
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
        <span>
          <b>Browser-window redirection</b>
        </span>
        <img
          onClick={() =>
            setDisplayBrowserRedirectionInfo((current) => !current)
          }
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
            displayBrowserRedirectionInfo ? "visible" : ""
          }`}
        >
          <br />
          A browser-window redirection will occur when mozeidon panel will close
          and redirect you to your browser-window.
          <br />
          E.g when you double-click a tab item in the mozeidon panel.
          <br />
          <br />
          Internally on your {platform} platform, mozeidon will trigger a
          shell-command : <b>{getBrowserRedirectionCommand(platform)}</b>{" "}
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
            Check if the mozeidon panel can redirect you correctly to the
            <b className="mozeidonColor"> {webBrowser}</b> browser-window.
            <br />
            To redirect to another browser than {webBrowser}, please go and edit
            your <b>web_browser</b> value in App settings.
            <br />
            <br />
            <button
              id="checkBrowserRedirectionButton"
              className="actionButton actionButtonNoMargin"
              onClick={async () => {
                await invoke("hide")
                await switchToBrowserWindow(webBrowser)
              }}
            >
              Check {webBrowser} browser-window redirection
            </button>
          </div>
        )}
      </div>
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
            This file allows to register the <b>native-messaging-host</b> that
            can communicate with the mozeidon browser extension.
            <br />
            <br />
            If <b>Chrome</b>, <b>Edge</b> or <b>Firefox</b> browser is already
            installed on your machine,
            <br />
            the native-manifest is automatically registered by this app. It
            should be visible in the list below.
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
          {autoConfiguredManifests.length === 0 ? (
            <div>
              No auto-configured native-manifest : could not discover Firefox,
              Chrome or Edge browser.
            </div>
          ) : (
            <>
              <div className="rowWithMarginBottom" style={{ fontSize: ".8em" }}>
                <b> • Auto-configured </b>
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
    </div>
  ) : (
    <NativeManifestEditor
      handleBackButtonClick={() => {
        setShowEditor(false)
      }}
    />
  )
}
