import { ChangeEvent, useEffect, useState } from "react"

import { updateProfile } from "../actions/profiles"
import { ValidationError } from "../domain/bookmarks/validation"
import { ProfileItem } from "../domain/profiles/models"
import { useSettings } from "../hooks/useSettings"
import { AUTO_CONFIGURED_BROWSERS, BROWSER_NATIVE_MESSAGING_DIR } from "../utils/constants"
import { sortProfiles } from "../utils/getStartingProfile"

interface FormElements extends HTMLFormControlsCollection {
  alias: HTMLInputElement
  commandAlias: HTMLInputElement
  priority: HTMLInputElement
}
export interface FormContent extends HTMLFormElement {
  readonly elements: FormElements
}

export const ProfileEditor = ({
  handleBackButtonClick,
  editedProfile,
  profiles,
  setProfiles,
}: {
  handleBackButtonClick: () => void
  editedProfile: ProfileItem | undefined
  profiles: ProfileItem[]
  setProfiles: React.Dispatch<React.SetStateAction<ProfileItem[]>>
}) => {
  const {
    settings: { hostConfigurationSettings: settings },
  } = useSettings()
  const [validationErrors, setValidationErrors] = useState<ValidationError[] | null>(null)

  const [isValidPriority, setIsValidPriority] = useState(false)
  const [isValidAlias, setIsValidAlias] = useState(false)

  return !validationErrors ? (
    // TODO
    <form
      onSubmit={async (e: React.FormEvent<FormContent>) => {
        if (!editedProfile) {
          return
        }
        e.preventDefault()
        const {
          alias: { value: alias },
          commandAlias: { value: commandAlias },
          priority: { value: priority },
        } = e.currentTarget.elements

        let profileRank = 1
        try {
          profileRank = Number.parseInt(priority)
        } catch (e) {
          profileRank = 1
        }
        const toBeEditedProfile = {
          ...editedProfile,
          profileAlias: alias,
          profileCommandAlias: commandAlias,
          profileRank: profileRank,
        }
        const newProfile = await updateProfile(toBeEditedProfile, editedProfile)
        const newProfiles = [...profiles.filter((p) => p.profileId !== newProfile.profileId), newProfile]
        setProfiles(sortProfiles(newProfiles))
        handleBackButtonClick()
      }}
    >
      <div className="formFieldContainer">
        <label className="row formLabel" htmlFor="browserName">
          <span>&#x27A4; Priority</span>
        </label>
        <div className="formDocInfo">
          Integer only. Is required. The profile with the highest priority will take precedence when Swell starts.
          <br />
          If multiple profiles have the same priority, the most recent registered profile will take precedence.
        </div>
        <Editable
          id="priority"
          autofocus={false}
          isValid={isValidPriority}
          defaultValue={`${editedProfile?.profileRank}`}
          handleIsValid={(value) => {
            try {
              const intValue = Number.parseInt(value)
              // -200 is a special value meaning no update ( cf mozeidon CLI )
              if (value.length > 0 && intValue !== -200) {
                setIsValidPriority(true)
              } else {
                setIsValidPriority(false)
              }
            } catch (e) {
              setIsValidPriority(false)
            }
          }}
        />
        <label className="row formLabel" htmlFor="folderPath">
          <span>&#x27A4; Alias</span>
        </label>
        <div className="formDocInfo">
          A name that Swell will display in the UI instead of the profile name. Max 30 characters.
        </div>
        <Editable
          id="alias"
          autofocus={false}
          isValid={isValidAlias}
          defaultValue={`${editedProfile?.profileAlias}`}
          handleIsValid={(value) => {
            if (value.length < 30) {
              setIsValidAlias(true)
            } else {
              setIsValidAlias(false)
            }
          }}
        />
        <label className="row formLabel" htmlFor="folderPath">
          <span>&#x27A4; Command-alias</span>
        </label>
        <div className="formDocInfo">
          A name that will be used, instead of the profile name, inside the command <b>open -a {"{}"}</b> responsible
          for switching window.
          <br />
          Example values : Google Chrome, Microsoft Edge, Zen,
          <br />
          /Applications/Microsoft\ Edge.app/Contents/MacOS/Microsoft\ Edge, etc
        </div>
        <Editable
          id="commandAlias"
          autofocus={false}
          isValid={isValidAlias}
          defaultValue={`${editedProfile?.profileCommandAlias}`}
          handleIsValid={(value) => {
            if (value.length < 30) {
              setIsValidAlias(true)
            } else {
              setIsValidAlias(false)
            }
          }}
        />
        <div className="actionContainer">
          <button
            className="actionButton"
            type="submit"
            onClick={(e) => {
              if (!(isValidPriority && isValidAlias)) {
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

const Editable = ({
  id,
  autofocus,
  isValid,
  handleIsValid,
  defaultValue,
}: {
  id: string
  autofocus: boolean
  isValid: boolean
  handleIsValid: (value: string) => void
  defaultValue: string
}) => {
  useEffect(() => {
    handleIsValid(defaultValue)
  }, [defaultValue])
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim()
    handleIsValid(value)
  }
  return (
    <input
      autoComplete="off"
      autoCorrect="off"
      id={id}
      className={`actionRow editInput ${!isValid ? "invalidInput" : ""}`}
      defaultValue={defaultValue}
      autoFocus={autofocus}
      onChange={handleChange}
    />
  )
}
