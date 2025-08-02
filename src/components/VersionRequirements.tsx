import { useState } from "react"
import chromeLogo from "../assets/chrome.svg"
import firefoxLogo from "../assets/firefox.svg"
import githubLogo from "../assets/github.svg"
import { getPlatform } from "../utils/getPlatform"

export const VersionRequirements = () => {
  const [plateform] = useState(getPlatform())
  return (
    <div>
      Requirements for {plateform} :
      <ul>
        <li style={{ lineHeight: 1.5 }}>
          <span style={{ cursor: "pointer" }}>
            mozeidon-native-app &nbsp;
            <img
              src={githubLogo}
              style={{ width: "1em", height: "1em", verticalAlign: "middle" }}
            />{" "}
            <code>&ge;</code> 1.0.0
          </span>
        </li>
        <li style={{ lineHeight: 1.5 }}>
          <span style={{ cursor: "pointer" }}>
            browser-extension &nbsp;
            <img
              src={firefoxLogo}
              style={{ width: "1em", height: "1em", verticalAlign: "middle" }}
            />{" "}
            <code>&ge;</code> 1.0.0
          </span>
          <span>&nbsp; or &nbsp;</span>
          <span style={{ cursor: "pointer" }}>
            <img
              src={chromeLogo}
              style={{ width: ".9em", height: ".9em", verticalAlign: "middle" }}
            />{" "}
            <code>&ge;</code> 1.0.0
          </span>
        </li>
      </ul>
    </div>
  )
}
