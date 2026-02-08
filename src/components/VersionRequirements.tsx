import { openURLAction } from "../actions/actions"
import chromeLogo from "../assets/chrome.svg"
import firefoxLogo from "../assets/firefox.svg"
import githubLogo from "../assets/github.svg"
import { ProfileItem } from "../domain/profiles/models"
import { SwellUi } from "../utils/ui"

export const VersionRequirements = ({
  restoreDefaults,
  currentProfile,
}: {
  currentProfile: ProfileItem | undefined
  restoreDefaults: () => void
}) => {
  const FIREFOX_EXTENSION_URL = "https://addons.mozilla.org/en-US/firefox/addon/mozeidon"
  const CHROME_EXTENSION_URL = "https://chromewebstore.google.com/detail/mozeidon/lipjcjopdojfmfjmnponpjkkccbjoipe"
  const SWELL_REPOSITORY_URL = "https://github.com/egovelox/swell/releases/tag/v0.2.0"
  const MOZEIDON_REPOSITORY_URL = "https://github.com/egovelox/mozeidon/releases/tag/v4.0.0"
  const handleClick = async (url: string) => {
    await openURLAction(currentProfile, url)
    restoreDefaults()
    await SwellUi.hide()
  }

  return (
    <>
      <div style={{ marginTop: "1.5em" }}>
        <span className="settingsTitle">
          <b>Web-browser extensions</b>
        </span>
        <div className="mozeidonDocInfo visible">
          <br />
          Swell communicates with your web-browser(s) via the <b className="mozeidonColor">mozeidon</b> extension.
          <br />
          <br />
          Choose a link below to install this extension for your browser(s) :
        </div>
        <ul style={{ listStyleType: "none" }}>
          <li style={{ lineHeight: 1.5 }}>
            <span onClick={() => handleClick(FIREFOX_EXTENSION_URL)} style={{ cursor: "pointer" }}>
              <img draggable={false} src={firefoxLogo} style={{ width: "1em", height: "1em" }} /> For <b>Firefox</b> and
              related browsers &nbsp;<code>&ge;</code> 4.0.0
            </span>
          </li>
          <li style={{ lineHeight: 1.5 }}>
            <span onClick={() => handleClick(CHROME_EXTENSION_URL)} style={{ cursor: "pointer" }}>
              <img draggable={false} src={chromeLogo} style={{ width: "1em", height: "1em" }} /> For <b>Chrome</b> and
              related browsers &nbsp;<code>&ge;</code> 4.0.0
            </span>
          </li>
        </ul>
      </div>
      <div>
        <span className="settingsTitle">
          <br />
          <b>Source code & documentation</b>
        </span>
        <ul style={{ listStyleType: "none" }}>
          <li style={{ lineHeight: 1.5 }}>
            <span onClick={() => handleClick(SWELL_REPOSITORY_URL)} style={{ cursor: "pointer" }}>
              <img draggable={false} src={githubLogo} style={{ width: "1em", height: "1em" }} /> <b>Swell</b> [v0.2.0]
              &nbsp;
            </span>
          </li>
          <li style={{ lineHeight: 1.5 }}>
            <span onClick={() => handleClick(MOZEIDON_REPOSITORY_URL)} style={{ cursor: "pointer" }}>
              <img draggable={false} src={githubLogo} style={{ width: "1em", height: "1em" }} /> <b>Mozeidon</b>{" "}
              [v4.0.0] &nbsp;
            </span>
          </li>
        </ul>
      </div>
    </>
  )
}
