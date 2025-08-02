import { githubDarkTheme, JsonEditor } from "json-edit-react"
import { AppSettings, Settings } from "../domain/settings/models"
import {
  validateSettingsForm,
  ValidationError,
} from "../domain/settings/validation"
import { Dispatch, SetStateAction, useState } from "react"

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
        <span className="settingsTitle">
          <b>App settings</b>
        </span>
        <span
          className="moreInfo"
          onClick={() => setDisplayAppSettingsInfo((current) => !current)}
        >
          &nbsp;&nbsp;more info...
        </span>
      </div>
      <div className="mozeidonDocInfo visible">
        <br />
        <span>
          Configure settings and shortcuts according to your preferences, using
          the editor below.
        </span>
        <br />
        <br />
        <span>
          <b>Important note</b> :
          <br />- A <i>global shortcut</i> will take precedence over all other
          shortcuts on your system.
          <br />- A <i>shortcut</i> on the other hand, will only have an effect
          when the Swell window is visible.
        </span>
      </div>
      <div
        className={`mozeidonDocInfo ${displayAppSettingsInfo ? "visible" : ""}`}
      >
        <br />
        <span>
          <b>web_browser : </b>The browser you're redirected to when opening
          items. More on redirection in Host configuration.
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
          <b>global_shortcut_show_panel_settings : </b>A shortcut to launch the
          settings panel.
        </span>
        <br />
        <span>
          <b>global_shortcut_switch_last_visited_tab : </b>A shortcut to switch
          to the tab you visited before the current tab.
        </span>
        <br />
        <span>
          <b>global_shortcut_close_current_tab : </b>A shortcut to close the
          current active tab.
        </span>
        <br />
        <span>
          <b>shortcut_copy_selected_item_url : </b>A shortcut to copy in your
          clipboard the selected item url.
        </span>
        <br />
        <span>
          <b>shortcut_hide_panel : </b>A shortcut to hide the visible panel.
          Note: 'Escape' will still work.
        </span>
        <br />
        <span>
          <b>shortcut_close_item : </b>A shortcut to close a tab or to delete a
          bookmark.
        </span>
        <br />
        <span>
          <b>shortcut_list_down : </b>A shortcut to navigate the list down.
          Note: 'ArrowDown' will still work.
        </span>
        <br />
        <span>
          <b>shortcut_list_up : </b>A shortcut to navigate the list up. Note:
          'ArrowUp' will still work.
        </span>
        <br />
        <span>
          <b>shortcut_edit_bookmark : </b>A shortcut to edit or create a
          bookmark.
        </span>
        <br />
        <span>
          <b>theme : </b>light | dark | system
        </span>
        <br />
        <span>
          <b>show_favicons : </b>Whether to display icons on each item row or
          not.
        </span>
        <br />
        <span>
          <b>date_locale : </b>Locale used to display dates throughout the app.
        </span>
        <br />
        <span>
          <b>web_search_engine_urls : </b>A list of web search engines offered
          to selection, when you do a web search.
        </span>
      </div>
      <JsonEditor
        theme={[
          githubDarkTheme,
          {
            string: { color: "#de7cd4" },
            boolean: { color: "#de7cd4" },
            container: {
              background: "",
              fontFamily: "",
              color: "",
              cursor: "default",
            },
            property: { color: "#155DAB" },
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
