import { githubDarkTheme, JsonEditor } from "json-edit-react"
import { AppSettings, Settings } from "../domain/settings/models"
import {
  validateSettingsForm,
  ValidationError,
} from "../domain/settings/validation"
import { Dispatch, SetStateAction, useState } from "react"
import infoLogo from "../assets/info-circle.svg"

export function AppSettingsJsonEditor({
  settings,
  setSettings,
  setValidationErrors,
}: {
  settings: Settings
  setSettings: (s: Settings) => void
  setValidationErrors: Dispatch<SetStateAction<ValidationError[] | null>>
}) {
  const [displayAppSettingsInfo, setDisplayAppSettingsInfo] = useState(false)
  return (
    <>
      <div>
        <span>
          <b>App settings</b>
        </span>
        <img
          onClick={() => setDisplayAppSettingsInfo((current) => !current)}
          src={infoLogo}
          alt="Info"
          style={{
            width: "1.3em",
            height: "1.3em",
            verticalAlign: "middle",
            marginLeft: "0.3em",
          }}
        />
      </div>
      <div className="mozeidonDocInfo visible" style={{ fontSize: ".8em" }}>
        <br />
        <span>
          To setup the app according to your preferences, use the editor below.
        </span>
      </div>
      <div
        className={`mozeidonDocInfo ${displayAppSettingsInfo ? "visible" : ""}`}
        style={{ cursor: "default" }}
      >
        <br />
        <span>
          <b>theme : </b>light | dark | system
        </span>
        <br />
        <span>
          <b>web_browser : </b>The web browser you are redirected into, when
          opening items.
        </span>
        <br />
        <span>
          <b>web_search_engine_urls : </b>The search engines list offered to
          selection, when you do a web search.
        </span>
        <br />
        <span>
          <b>date_locale : </b>Locale used to display dates throughout the app.
        </span>
        <br />
        <span>
          <b>show_favicons : </b>Wether to display icons on items or not.
        </span>
        <br />
        <span>
          <b>global_shortcut_show_panel_tabs : </b>A shortcut to launch the tabs
          panel.
        </span>
        <br />
        <span>
          <b>global_shortcut_show_panel_bookmarks : </b>A shortcut to launch the
          bookmarks panel.
        </span>
        <br />
        <span>
          <b>global_shortcut_show_panel_recently_closed : </b>A shortcut to
          launch the recently-closed tabs panel.
        </span>
        <br />
        <span>
          <b>global_shortcut_show_panel_history : </b>A shortcut to launch the
          history panel.
        </span>
        <br />
        <span>
          <b>shortcut_copy_selected_item_url : </b>A shortcut to copy in your
          clipboard the selected item url.
        </span>
        <br />
        <span>
          <b>shortcut_close_panel : </b>A shortcut to close (i.e hide) the
          visible panel.
        </span>
        <br />
        <span>
          <b>shortcut_close_item : </b>A shortcut to close a tab or to delete a
          bookmark.
        </span>
        <br />
        <span>
          <b>shortcut_list_down : </b>A shortcut to navigate the list down.
        </span>
        <br />
        <span>
          <b>shortcut_list_up : </b>A shortcut to navigate the list up.
        </span>
        <br />
        <span>
          <b>shortcut_edit_bookmark : </b>A shortcut to edit or create a
          bookmark.
        </span>
      </div>
      <JsonEditor
        theme={[
          githubDarkTheme,
          {
            string: { color: "" },
            boolean: { color: "" },
            container: {
              background: "",
              fontFamily: "",
              color: "",
              cursor: "default",
            },
            property: { color: "rgba(210, 85, 41, 0.5)" },
            bracket: { color: "", fontWeight: "" },
          },
        ]}
        data={settings.appSettings}
        setData={(data) => {
          setSettings({ ...settings, appSettings: data as AppSettings })
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
