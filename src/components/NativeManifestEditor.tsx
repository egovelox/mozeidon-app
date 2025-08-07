import { ChangeEvent, useState } from "react"
import { ValidationError } from "../domain/bookmarks/validation"
import { useSettings } from "../hooks/useSettings"
import {
  AUTO_CONFIGURED_BROWSERS,
  BROWSER_NATIVE_MESSAGING_DIR,
} from "../utils/constants"

interface FormElements extends HTMLFormControlsCollection {
  browserFamily: HTMLInputElement
  browserName: HTMLInputElement
  folderPath: HTMLInputElement
}
export interface FormContent extends HTMLFormElement {
  readonly elements: FormElements
}

export const NativeManifestEditor = ({
  handleBackButtonClick,
}: {
  handleBackButtonClick: () => void
}) => {
  const {
    settings: { hostConfigurationSettings: settings },
  } = useSettings()
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null)

  const [isValidBrowserName, setIsValidBrowserName] = useState(false)
  const [isValidFolderPath, setIsValidFolderPath] = useState(false)

  return !validationErrors ? (
    <form onSubmit={(e: React.FormEvent<FormContent>) => {}}>
      <div className="formFieldContainer">
        <label className="row actionLabel">
          <span>&#x27A4; browser-family</span>
        </label>
        <div className="formDocInfo">
          Browser compatibility is currently limited to either <b>Firefox</b> or{" "}
          <b>Chrome</b> browser family.
        </div>
        <div className="radioGroup">
          <label>
            <input
              type="radio"
              name="browserFamily"
              value="Firefox"
              defaultChecked
              autoFocus
            />{" "}
            Firefox
          </label>
          <label style={{ marginLeft: "1em" }}>
            <input type="radio" name="browserFamily" value="Chrome" /> Chrome
          </label>
        </div>
        <label className="row actionLabel" htmlFor="browserName">
          <span>&#x27A4; browser-name</span>
        </label>
        <div className="formDocInfo">
          You can choose an arbitrary name, excepted one of : <b>Firefox</b>,{" "}
          <b>Chrome</b>, <b>Edge</b>.
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
        <label className="row actionLabel" htmlFor="folderPath">
          <span>&#x27A4; folder-path</span>
        </label>
        <div className="formDocInfo">
          Enter the path of the browser configuration directory.
          <br />
          It must start with your home-directory{" "}
          <b>{`${settings.userHomeDir}`}</b>
          <br />
          It must end with <b>/NativeMessagingHosts</b>
        </div>
        <Editable
          id="folderPath"
          autofocus={false}
          isValid={isValidFolderPath}
          handleIsValid={(value) => {
            if (
              value.startsWith(settings.userHomeDir) &&
              value.endsWith(`/${BROWSER_NATIVE_MESSAGING_DIR}`)
            ) {
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
          <button
            className="actionButton"
            id="lastButton"
            onClick={handleBackButtonClick}
          >
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
                ❌ <b>{settingName}</b> could not be validated for{" "}
                <b>{received}</b> !
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
          onFocus={() =>
            document.getElementById("nativeManifestEditorBackButton")?.focus()
          }
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
    handleIsValid(value) // example: required non-empty field
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
