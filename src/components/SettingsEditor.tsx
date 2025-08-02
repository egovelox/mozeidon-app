import { useState } from "react"
import { githubDarkTheme, JsonEditor } from "json-edit-react"
import { Settings } from "../domain/settings/models"
import { useSettings } from "../hooks/useSettings"
import mozeidonLogo from "../assets/trident.svg"
import {
  validateSettingsForm,
  ValidationError,
} from "../domain/settings/validation"
import { VersionRequirements } from "./VersionRequirements"

export function SettingsEditor({
  onBackToList,
  showBackButton,
}: {
  onBackToList: () => void
  showBackButton: boolean
}) {
  const { settings, setSettings } = useSettings()
  const [validationErrors, setValidationErrors] = useState<
    ValidationError[] | null
  >(null)

  if (!settings) return <div className="container">Loading...</div>
  return !validationErrors ? (
    <div>
      <div className="settingsHeader">
        <img
          src={mozeidonLogo}
          alt="Mozeidon logo"
          style={{
            width: "1em",
            height: "1em",
            verticalAlign: "middle",
            marginRight: ".5em",
          }}
        />
        <span>
          <b>Mozeidon</b> 1.0.0{" "}
        </span>
      </div>
      <div className="settingsContainer">
        <div className="settingsVersionBox">
          <VersionRequirements />
        </div>
        <div className="settingsContent">
          <JsonEditor
            className="customScrollBar"
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
            rootName={"current settings"}
            showIconTooltips
            restrictEdit={({ path }) => {
              // restrict edition of the root
              if (path.join("") === "") return true
              return false
            }}
            restrictDelete
            restrictAdd
            /*
             * We set 1
             * because this specifies a nesting depth
             * after which nodes will be closed.
             */
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
        </div>
        <div
          className={
            "actionContainer" + (showBackButton ? " settingsFooter" : "")
          }
        >
          {showBackButton && (
            <>
              <button
                className="loopButton"
                onFocus={() =>
                  document
                    .getElementById("backFromSettingsToListButton")
                    ?.focus()
                }
              />
              <button
                id="backFromSettingsToListButton"
                className="actionButton"
                onKeyDown={(e) => e.stopPropagation()}
                onClick={() => onBackToList()}
              >
                Back &#8617;
              </button>
              <button
                className="loopButton"
                onFocus={() =>
                  document
                    .getElementById("backFromSettingsToListButton")
                    ?.focus()
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="container" style={{ padding: "1em" }}>
      <h4>
        Settings validation : {validationErrors.length} error
        {validationErrors.length > 1 ? "s" : ""}
      </h4>
      <div style={{ fontSize: ".9em" }}>
        {validationErrors.map(({ settingName, received }) => {
          if (settingName.startsWith("shortcut"))
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                {
                  <div>
                    <div>
                      <h4>Global shortcuts rules</h4>
                      <ul>
                        <li>Modifiers and keys must be separated by +</li>
                        <li>
                          All keys require one or two modifiers (in this order)
                          : Control, Meta or Command, Alt or Option, Super,
                          Shift
                        </li>
                        <li>
                          Allowed keys without modifier: F1...F20, PageUp,
                          PageDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4>Allowed shortcut examples :</h4>
                      <ul>
                        <li>Control+Alt+.</li>
                        <li>Meta+Shift+,</li>
                        <li>Alt+F1</li>
                        <li>Super+Enter</li>
                        <li>Control+Shift+Backspace</li>
                      </ul>
                    </div>
                  </div>
                }
              </div>
            )
          if (settingName.startsWith("global_shortcut"))
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                <div>
                  <div>
                    <h4>Global shortcuts rules</h4>
                    <ul>
                      <li>Modifiers or keys must all be separated by +</li>
                      <li>
                        All keys require one or two modifiers (in this order) :
                        Control, Meta or Command, Alt or Option, Super, Shift
                      </li>
                      <li>
                        Allowed keys without a modifier: F1...F20, PageUp,
                        PageDown, Delete, Insert, Home, End, CapsLock, NumLock
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4>Allowed global shortcut examples :</h4>
                    <ul>
                      <li>Control+3</li>
                      <li>Control+Alt+.</li>
                      <li>Meta+Shift+,</li>
                      <li>Option+Command+'</li>
                      <li>Alt+F1</li>
                      <li>Super+Enter</li>
                      <li>Control+Shift+Backspace</li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          if (settingName.startsWith("duplicates")) {
            return (
              <div key={settingName}>
                <div>
                  ❌ Found a <b>conflict</b> in your shortcuts !
                </div>
              </div>
            )
          }
          if (settingName.startsWith("web_search_urls"))
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                <div>
                  <div>
                    <h4> Web search url </h4>
                    <ul>
                      <li>Must be a well-formatted url</li>
                      <li>
                        Must end with <code>?q=</code>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4>Allowed web_search_url examples</h4>
                    <ul>
                      <li>https://duckduckgo.com?q=</li>
                      <li>https://www.google.com?q=</li>
                      <li>https://www.qwant.com?q=</li>
                      <li>etc.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          if (settingName.startsWith("date_locale"))
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                <div>
                  <div>
                    <h4> Locale </h4>
                    <ul>
                      <li>
                        is optional, so you can leave it empty ( we'll use the
                        default format )
                      </li>
                      <li>if not, it must be a well-formatted locale</li>
                      <li>
                        @see
                        https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4>Valid locale examples</h4>
                    <ul>
                      <li>en-EN</li>
                      <li>fr-CA</li>
                      <li>ja-Jpan-JP-u-ca-japanese-hc-h12</li>
                      <li>etc.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )
          if (settingName.startsWith("theme"))
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                {
                  <div>
                    <div>
                      <h4> Theme </h4>
                      <ul>
                        <li>
                          theme has only 3 allowed values: "system" or "dark" or
                          "light"
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4>Valid theme examples</h4>
                      <ul>
                        <li>system</li>
                        <li>dark</li>
                        <li>light</li>
                      </ul>
                    </div>
                  </div>
                }
              </div>
            )
        })}
      </div>
      <div className="actionContainer">
        <button
          autoFocus
          className="actionButton"
          onClick={() => setValidationErrors(null)}
        >
          &#8617; Back to Settings
        </button>
      </div>
    </div>
  )
}
