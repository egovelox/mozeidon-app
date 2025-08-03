import { ValidationError } from "../domain/settings/validation"

export function SettingsValidationErrors({
  validationErrors,
  onBack,
}: {
  validationErrors: ValidationError[]
  onBack: () => void
}) {
  return (
    <div className="container" style={{ padding: "1em" }}>
      <h4>
        Settings validation : {validationErrors.length} error
        {validationErrors.length > 1 ? "s" : ""}
      </h4>
      <div style={{ fontSize: ".9em" }}>
        {validationErrors.map(({ settingName, received }) => {
          if (settingName.startsWith("shortcut")) {
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                <div>
                  <h4>Global shortcuts rules</h4>
                  <ul>
                    <li>Modifiers and keys must be separated by +</li>
                    <li>
                      All keys require one or two modifiers (in this order):
                      Control, Meta or Command, Alt or Option, Super, Shift
                    </li>
                    <li>
                      Allowed keys without modifier: F1...F20, PageUp, PageDown,
                      ArrowUp, ArrowDown, ArrowLeft, ArrowRight
                    </li>
                  </ul>
                  <h4>Allowed shortcut examples:</h4>
                  <ul>
                    <li>Control+Alt+.</li>
                    <li>Meta+Shift+,</li>
                    <li>Alt+F1</li>
                    <li>Super+Enter</li>
                    <li>Control+Shift+Backspace</li>
                  </ul>
                </div>
              </div>
            )
          }

          if (settingName.startsWith("global_shortcut")) {
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided !
                </div>
                <div>
                  <h4>Global shortcuts rules</h4>
                  <ul>
                    <li>Modifiers or keys must all be separated by +</li>
                    <li>
                      All keys require one or two modifiers (in this order):
                      Control, Meta or Command, Alt or Option, Super, Shift
                    </li>
                    <li>
                      Allowed keys without a modifier: F1...F20, PageUp,
                      PageDown, Delete, Insert, Home, End, CapsLock, NumLock
                    </li>
                  </ul>
                  <h4>Allowed global shortcut examples:</h4>
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
            )
          }

          if (settingName.startsWith("duplicates")) {
            return (
              <div key={settingName}>
                ❌ Found a <b>conflict</b> in your shortcuts!
              </div>
            )
          }

          if (settingName.startsWith("web_search_urls")) {
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided!
                </div>
                <div>
                  <h4>Web search url</h4>
                  <ul>
                    <li>Must be a well-formatted url</li>
                    <li>
                      Must end with <code>?q=</code>
                    </li>
                  </ul>
                  <h4>Allowed examples:</h4>
                  <ul>
                    <li>https://duckduckgo.com?q=</li>
                    <li>https://www.google.com?q=</li>
                    <li>https://www.qwant.com?q=</li>
                  </ul>
                </div>
              </div>
            )
          }

          if (settingName.startsWith("date_locale")) {
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided!
                </div>
                <div>
                  <h4>Locale</h4>
                  <ul>
                    <li>Optional: leave empty to use default format</li>
                    <li>If used, must be a well-formatted locale</li>
                    <li>
                      See:{" "}
                      <a
                        href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        MDN Intl.DateTimeFormat
                      </a>
                    </li>
                  </ul>
                  <h4>Examples:</h4>
                  <ul>
                    <li>en-EN</li>
                    <li>fr-CA</li>
                    <li>ja-Jpan-JP-u-ca-japanese-hc-h12</li>
                  </ul>
                </div>
              </div>
            )
          }

          if (settingName.startsWith("theme")) {
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated with the value{" "}
                  <b>{received}</b> you provided!
                </div>
                <div>
                  <h4>Theme</h4>
                  <ul>
                    <li>Allowed values: "system", "dark", "light"</li>
                  </ul>
                  <h4>Examples:</h4>
                  <ul>
                    <li>system</li>
                    <li>dark</li>
                    <li>light</li>
                  </ul>
                </div>
              </div>
            )
          }

          // Default case
          return (
            <div key={settingName}>
              ❌ <b>{settingName}</b> is invalid: <b>{received}</b>
            </div>
          )
        })}
      </div>
      <div className="actionContainer">
        <button className="actionButton" onClick={onBack}>
          &#8617; Back to Settings
        </button>
      </div>
    </div>
  )
}
