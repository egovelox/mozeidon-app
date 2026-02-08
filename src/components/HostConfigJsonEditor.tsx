import { invoke } from "@tauri-apps/api/core"
import { emit } from "@tauri-apps/api/event"
import { useEffect, useState } from "react"

import { switchToBrowserWindow } from "../actions/actions"
import { ProfileItem } from "../domain/profiles/models"
import { Settings } from "../domain/settings/models"
import { AUTO_CONFIGURED_BROWSERS } from "../utils/constants"
import { getBrowserRedirectionCommand, getPlatform } from "../utils/getPlatform"
import { sortProfiles } from "../utils/getStartingProfile"
import { NativeManifestEditor } from "./NativeManifestEditor"
import { NativeManifestJsonEditor } from "./NativeManifestJsonEditor"
import { ProfileEditor } from "./ProfileEditor"
import { ProfileRow } from "./ProfileRow"

export function HostConfigJsonEditor({
  settings,
  profiles,
  setProfiles,
}: {
  settings: Settings
  profiles: ProfileItem[]
  setProfiles: React.Dispatch<React.SetStateAction<ProfileItem[]>>
}) {
  const manifests = settings.hostConfigurationSettings.browserManifests
  const autoConfiguredManifests = manifests.filter((m) => m.content && AUTO_CONFIGURED_BROWSERS.includes(m.browser))
  const userConfiguredManifests = settings.appSettings.custom_browser_manifests

  const [showNativeManifestEditor, setShowNativeManifestEditor] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState<{
    isVisible: boolean
    profile: ProfileItem | undefined
  }>({ isVisible: false, profile: undefined })
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

  const [displayProfilesInfo, setDisplayProfilesInfo] = useState(false)
  const [displayNativeManifestInfo, setDisplayNativeManifestInfo] = useState(false)

  return !showNativeManifestEditor && !showProfileEditor.isVisible ? (
    <div>
      <div style={{ marginTop: "1.5em", marginBottom: "1em" }}>
        <span className="settingsTitle">
          <b>Browsers & profiles</b>
        </span>
        <span className="moreInfo" onClick={() => setDisplayProfilesInfo((current) => !current)}>
          &nbsp;&nbsp;more info...
        </span>
        <div className={`mozeidonDocInfo ${displayProfilesInfo ? "visible" : ""}`}>
          <br />
          Below is a list of profiles, each representing a web-browser instance currently connected to Swell.
          <br />
          <br />
          You might want to <span className="mozeidonColor">edit a profile</span> :
          <br />
          <br />- setting <b>an alias</b>,
          <br />
          &nbsp;&nbsp; - when you need to change the instance name, because Swell wasn't able to display it correctly
          <br />
          &nbsp;&nbsp; - or when you need to differentiate multiple instances of the same browser in Swell
          <br />
          &nbsp;&nbsp; e.g you want to use multiple Chrome browser-profiles simultaneously : then set an alias for each
          profile.
          <br />
          &nbsp;&nbsp; e.g you want to use Firefox and another browser derived from Firefox ( let's say Zen )
          <br />
          &nbsp;&nbsp;&nbsp; but the default name is not correct : then just set the alias to the correct name ( Zen ).
          <br />
          <br />- setting <b>a command-alias</b>, when you need to make the switch-command work correctly.
          <br />
          <br />- setting <b>a higher priority</b>, when you need to start Swell with the profile of your choice.
          <br />
          <br />
          Swell should automatically connect to each instance where the mozeidon browser-extension is active.
          <br />
          If you cannot find your instance in the list below, please ensure :
          <br />
          - the mozeidon browser-extension is active for this instance
          <br />
          - a native-manifest file exists for this instance ( see paragraph below )
          <br />
          <br />
        </div>
        <div className="mozeidonDocInfo visible">
          <br />
          {sortProfiles(profiles).map((p) => (
            <ProfileRow
              key={p.profileId}
              profile={p}
              setProfiles={setProfiles}
              setShowEditor={setShowProfileEditor}
              platform={platform}
            />
          ))}
        </div>
      </div>
      <div>
        <div style={{ paddingBottom: "2em" }}>
          <span className="settingsTitle">
            <b>Browsers & native-manifests</b>
          </span>
          <span className="moreInfo" onClick={() => setDisplayNativeManifestInfo((current) => !current)}>
            &nbsp;&nbsp;more info...
          </span>
          <div className={`mozeidonDocInfo ${displayNativeManifestInfo ? "visible" : ""}`}>
            <br />A <b>native manifest</b> is a web-browser configuration file that must be stored in your file-system.
            <br />
            <br />
            This file contains the registration of the <b>native-messaging-host</b>,
            <br />
            a program responsible for exchanging messages with the browser-extension.
            <br />
            <br />
            If <b>Chrome</b>, <b>Edge</b> or <b>Firefox</b> browser is already installed on your machine,
            <br />
            the native-manifest file should be automatically created by our app.
            <br />
            It should be visible in the list below.
            <br />
            <br />
            To use <b>another browser</b>, you first need to find the correct native-manifest location (where the file
            should be stored).
            <br />
            Then you can create the native-manifest file using the Add a new native-manifest form ( see below ).
            <br />
            Or you can create the native-manifest file yourself in your file-system.
          </div>
        </div>
        <div className="container">
          {autoConfiguredManifests.length === 0 ? (
            <div>No auto-configured native-manifest : could not discover Firefox, Chrome or Edge browser.</div>
          ) : (
            <>
              <div className="rowWithMarginBottom" style={{ fontSize: ".8em" }}>
                <span className="settingsTitle">
                  <b> • Auto-configured </b>
                </span>
              </div>
              {autoConfiguredManifests.map((m) => (
                <NativeManifestJsonEditor manifest={m} key={m.path ?? m.browser} />
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
          </div>
          <div>
            <button className="actionButton" onClick={() => setShowNativeManifestEditor(true)}>
              Add a native-manifest
            </button>
          </div>
          {userConfiguredManifests.map((m) => (
            <NativeManifestJsonEditor manifest={m} key={m.path} canBeDeleted />
          ))}
        </div>
      </div>
    </div>
  ) : (
    <>
      {showNativeManifestEditor && (
        <NativeManifestEditor
          handleBackButtonClick={() => {
            setShowNativeManifestEditor(false)
          }}
        />
      )}
      {showProfileEditor.isVisible && (
        <ProfileEditor
          profiles={profiles}
          setProfiles={setProfiles}
          editedProfile={showProfileEditor.profile}
          handleBackButtonClick={() => {
            setShowProfileEditor({ isVisible: false, profile: undefined })
          }}
        />
      )}
    </>
  )
}
