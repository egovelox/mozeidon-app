import { githubDarkTheme, JsonEditor } from "json-edit-react"
import { Settings } from "../domain/settings/models"
import {
  validateSettingsForm,
  ValidationError,
} from "../domain/settings/validation"
import { Dispatch, SetStateAction } from "react"

export function SettingsJsonEditor({
  settings,
  setSettings,
  setValidationErrors,
}: {
  settings: Settings
  setSettings: (s: Settings) => void
  setValidationErrors: Dispatch<SetStateAction<ValidationError[] | null>>
}) {
  return (
    <>
      <div>
        <b>Edit your settings below :</b>
      </div>
      <JsonEditor
        theme={[
          githubDarkTheme,
          {
            string: { color: "#d25529" },
            boolean: { color: "#d25529" },
            container: { background: "", fontFamily: "", color: "" },
            property: { color: "" },
            bracket: { color: "", fontWeight: "" },
          },
        ]}
        data={settings}
        setData={(data) => {
          setSettings(data as Settings)
        }}
        rootName={""}
        showIconTooltips
        restrictEdit={({ path }) => path.join("") === ""}
        restrictDelete
        restrictAdd
        collapse={1}
        restrictTypeSelection
        showCollectionCount={false}
        showStringQuotes={false}
        enableClipboard={false}
        indent={2}
        showErrorMessages={true}
        onUpdate={({ newData }) => {
          return validateSettingsForm(newData, setValidationErrors)
        }}
      />
    </>
  )
}
