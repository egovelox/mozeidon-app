import { invoke } from "@tauri-apps/api/core"
import { ChangeEvent, useState } from "react"

import { ValidationError } from "../domain/bookmarks/validation"
import { BrowserManifest, Settings } from "../domain/settings/models"
import { useSettings } from "../hooks/useSettings"
import { AUTO_CONFIGURED_BROWSERS, BROWSER_NATIVE_MESSAGING_DIR } from "../utils/constants"
import { logEmit } from "../utils/logEmitter"

interface FormElements extends HTMLFormControlsCollection {
  browserFamily: HTMLInputElement
  browserName: HTMLInputElement
  folderPath: HTMLInputElement
}
export interface FormContent extends HTMLFormElement {
  readonly elements: FormElements
}

export const NativeManifestEditor = ({ handleBackButtonClick }: { handleBackButtonClick: () => void }) => {
  const { settings, setSettings } = useSettings()
  const [validationErrors, setValidationErrors] = useState<ValidationError[] | null>(null)

  const [isValidBrowserName, setIsValidBrowserName] = useState(false)
  const [isValidFolderPath, setIsValidFolderPath] = useState(false)

  return !validationErrors ? (
    <form
      onSubmit={async (e: React.FormEvent<FormContent>) => {
        e.preventDefault()
        const {
          folderPath: { value: folderPath },
          browserName: { value: browserName },
          browserFamily: { value: browserFamily },
        } = e.currentTarget.elements

        let newNativeManifest: BrowserManifest | undefined = undefined
        try {
          const newNativeManifest = await invoke<BrowserManifest>("write_custom_manifest", {
            nativeManifestDir: folderPath,
            browserFamily,
          })
          const customNativeManifests = settings.appSettings.custom_browser_manifests
            // avoid zombie entries in settings.custom_browser_manifests
            .filter((m) => m.path === newNativeManifest.path)

          const newCustomNativeManifests: BrowserManifest[] = [
            ...customNativeManifests,
            {
              browser: browserName,
              written: true,
              path: newNativeManifest.path,
              content: newNativeManifest.content,
            },
          ]
          setSettings({
            ...settings,
            appSettings: {
              ...settings.appSettings,
              custom_browser_manifests: newCustomNativeManifests,
            },
          })
        } catch (e) {
          logEmit(`error: ${JSON.stringify(e)}`)
        }
        handleBackButtonClick()
      }}
    >
      <div className="formFieldContainer">
        <label className="row formLabel">
          <span>&#x27A4; browser-family</span>
        </label>
        <div className="formDocInfo">
          Browser compatibility is currently limited to either <b>Firefox-based</b> or <b>Chromium-based</b> browsers.
        </div>
        <div className="radioGroup">
          <label>
            <input type="radio" name="browserFamily" value="Firefox" defaultChecked autoFocus /> Firefox
          </label>
          <label style={{ marginLeft: "1em" }}>
            <input type="radio" name="browserFamily" value="Chromium" /> Chromium
          </label>
        </div>
        <label className="row formLabel" htmlFor="browserName">
          <span>&#x27A4; browser-name</span>
        </label>
        <div className="formDocInfo">
          You can choose any name, it will be used as a key referencing your manifest in Swell settings.
        </div>
        <Editable
          id="browserName"
          autofocus={false}
          isValid={isValidBrowserName}
          handleIsValid={(value) => {
            if (value.length > 0 && !AUTO_CONFIGURED_BROWSERS.includes(value)) {
              setIsValidBrowserName(true)
            } else {
              setIsValidBrowserName(false)
            }
          }}
        />
        <label className="row formLabel" htmlFor="folderPath">
          <span>&#x27A4; folder-path</span>
        </label>
        <div className="formDocInfo">
          Enter the absolute path of the browser configuration directory.
          <br />
          It must start with <b>{`/`}</b> and it must end with <b>/NativeMessagingHosts</b>.
          <br />
          Once you save, Swell will create a <b>mozeidon.json</b> file ( the native-manifest ) at that location.
          <br />
          Note : you will later be able to delete that file if you need.
        </div>
        <Editable
          id="folderPath"
          autofocus={false}
          isValid={isValidFolderPath}
          handleIsValid={(value) => {
            if (value.startsWith("/") && value.endsWith(`/${BROWSER_NATIVE_MESSAGING_DIR}`)) {
              setIsValidFolderPath(true)
            } else {
              setIsValidFolderPath(false)
            }
          }}
        />
        <div className="actionContainer">
          <button
            className="actionButton"
            type="submit"
            onClick={(e) => {
              if (!(isValidBrowserName && isValidFolderPath)) {
                e.preventDefault()
              }
            }}
          >
            Save &#x2713;
          </button>
          <button className="actionButton" id="lastButton" onClick={handleBackButtonClick}>
            Back &#8617;
          </button>
        </div>
      </div>
    </form>
  ) : (
    <div className="container">
      <h4>
        Native-manifest validation : {validationErrors.length} error
        {validationErrors.length > 1 ? "s" : ""}
      </h4>
      <div style={{ fontSize: ".9em" }}>
        {validationErrors.map(({ settingName, received, details }) => {
          return (
            <div key={settingName}>
              <div>
                ❌ <b>{settingName}</b> could not be validated for <b>{received}</b> !
              </div>
              <div>{details}</div>
            </div>
          )
        })}
      </div>
      <div className="actionContainer">
        <button
          autoFocus
          id="nativeManifestEditorBackButton"
          className="actionButton"
          onClick={() => setValidationErrors(null)}
        >
          &#8617; Back
        </button>
        <button
          className="loopButton"
          onFocus={() => document.getElementById("nativeManifestEditorBackButton")?.focus()}
        />
      </div>
    </div>
  )
}

export const Editable = ({
  id,
  autofocus,
  isValid,
  handleIsValid,
}: {
  id: string
  autofocus: boolean
  isValid: boolean
  handleIsValid: (value: string) => void
}) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    handleIsValid(value)
  }
  return (
    <input
      autoComplete="off"
      autoCorrect="off"
      id={id}
      placeholder="Required"
      className={`actionRow editInput ${!isValid ? "invalidInput" : ""}`}
      defaultValue={""}
      autoFocus={autofocus}
      onChange={handleChange}
    />
  )
}
