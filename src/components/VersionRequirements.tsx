import { invoke } from "@tauri-apps/api/core"
import { openURLAction } from "../actions/actions"
import chromeLogo from "../assets/chrome.svg"
import firefoxLogo from "../assets/firefox.svg"
import githubLogo from "../assets/github.svg"

export const VersionRequirements = ({
  restoreDefaults,
  webBrowser,
}: {
  webBrowser: string
  restoreDefaults: () => void
}) => {
  const FIREFOX_EXTENSION_URL =
    "https://addons.mozilla.org/en-US/firefox/addon/mozeidon"
  const CHROME_EXTENSION_URL =
    "https://chromewebstore.google.com/detail/mozeidon/lipjcjopdojfmfjmnponpjkkccbjoipe"
  const SWELL_REPOSITORY_URL = "https://github.com/egovelox/swell"
  const MOZEIDON_REPOSITORY_URL = "https://github.com/egovelox/mozeidon"
  const handleClick = async (url: string) => {
    await openURLAction(url, webBrowser)
    restoreDefaults()
    await invoke("hide")
  }

  return (
    <>
      <div>
        <span className="settingsTitle">
          <b>Web-browser extensions</b>
        </span>
        <div className="mozeidonDocInfo visible">
          <br />
          Swell communicates with your web-browser via the{" "}
          <b className="mozeidonColor">mozeidon</b> extension.
          <br />
          <br />
          Choose a link below to install this extension for your browser :
        </div>
        <ul style={{ listStyleType: "none" }}>
          <li style={{ lineHeight: 1.5 }}>
            <span
              onClick={() => handleClick(FIREFOX_EXTENSION_URL)}
              style={{ cursor: "pointer" }}
            >
              <img
                draggable={false}
                src={firefoxLogo}
                style={{ width: "1em", height: "1em" }}
              />{" "}
              For Firefox and related browsers &nbsp;<code>&ge;</code> 3.0.0
            </span>
          </li>
          <li style={{ lineHeight: 1.5 }}>
            <span
              onClick={() => handleClick(CHROME_EXTENSION_URL)}
              style={{ cursor: "pointer" }}
            >
              <img
                draggable={false}
                src={chromeLogo}
                style={{ width: "1em", height: "1em" }}
              />{" "}
              For Chrome and related browsers &nbsp;<code>&ge;</code> 3.0.0
            </span>
          </li>
        </ul>
        <div className="mozeidonDocInfo visible">
          ⚠️ Please note
          <br />
          Swell cannot work correctly if the extension is activated
          simultaneously in multiple web-browsers.
          <br />
          <br />
        </div>
      </div>
      <div>
        <span className="settingsTitle">
          <br />
          <b>Source code & documentation</b>
        </span>
        <ul style={{ listStyleType: "none" }}>
          <li style={{ lineHeight: 1.5 }}>
            <span
              onClick={() => handleClick(SWELL_REPOSITORY_URL)}
              style={{ cursor: "pointer" }}
            >
              <img
                draggable={false}
                src={githubLogo}
                style={{ width: "1em", height: "1em" }}
              />{" "}
              Swell &nbsp;
            </span>
          </li>
          <li style={{ lineHeight: 1.5 }}>
            <span
              onClick={() => handleClick(MOZEIDON_REPOSITORY_URL)}
              style={{ cursor: "pointer" }}
            >
              <img
                draggable={false}
                src={githubLogo}
                style={{ width: "1em", height: "1em" }}
              />{" "}
              Mozeidon &nbsp;
            </span>
          </li>
        </ul>
      </div>
    </>
  )
}
