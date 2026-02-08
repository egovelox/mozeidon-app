import { useEffect, useState } from "react"
import { HexColorPicker } from "react-colorful"

import { CustomTheme } from "../domain/settings/models"
import { useSettings } from "../hooks/useSettings"

interface ThemeEditorProps {}

export const ThemeEditor = ({}: ThemeEditorProps) => {
  const { settings, setSettings } = useSettings()
  const root = document.documentElement

  const getCssVar = (name: string) => getComputedStyle(root).getPropertyValue(name).trim()

  const [mainFont, setMainFont] = useState("#000000")
  const [highlight, setHighlight] = useState("#000000")
  const [mainBg, setMainBg] = useState("#000000")
  const [secondaryBg, setSecondaryBg] = useState("#000000")
  const [selectionBg, setSelectionBg] = useState("#000000")
  const [buttonBorder, setButtonBorder] = useState("#000000")
  const [icon, setIcon] = useState("#000000")
  const [openPicker, setOpenPicker] = useState<null | "mf" | "hi" | "bg" | "secbg" | "selbg" | "bb" | "ic">("mf")

  useEffect(() => {
    setMainFont(getCssVar("--main-font-color"))
    setHighlight(getCssVar("--light-orange"))
    setMainBg(getCssVar("--main-background-color"))
    setSecondaryBg(getCssVar("--selected-input-background-color"))
    setSelectionBg(getCssVar("--selected-background-color"))
    setButtonBorder(getCssVar("--button-border-color"))
    setIcon(getCssVar("--main-icon-color"))
  }, [])

  const updateVar = (name: string, value: string) => {
    root.style.setProperty(name, value)
  }

  const saveCustomTheme = () => {
    const customTheme: CustomTheme = {
      highlight: highlight,
      button_border: buttonBorder,
      main_background: mainBg,
      main_font: mainFont,
      secondary_background: secondaryBg,
      selection_background: selectionBg,
      icon: icon,
    }
    setSettings({
      ...settings,
      appSettings: {
        ...settings.appSettings,
        custom_theme: customTheme,
      },
    })
  }

  const deleteCustomTheme = () => {
    setSettings({
      ...settings,
      appSettings: {
        ...settings.appSettings,
        custom_theme: null,
      },
    })
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "5em",
          marginTop: ".7em",
          paddingBottom: "1em",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: ".1em" }}>
          {/* MAIN FONT COLOR */}
          <div className="colorEditorRow">
            <div className={openPicker === "mf" ? "colorEditorRowLabel" : ""}>Main font</div>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: mainFont }}
              onClick={() => setOpenPicker(openPicker === "mf" ? null : "mf")}
            ></button>
          </div>

          {/* HIGHLIGHT */}
          <div className="colorEditorRow">
            <span className={openPicker === "hi" ? "colorEditorRowLabel" : ""}>Highlight</span>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: highlight }}
              onClick={() => setOpenPicker(openPicker === "hi" ? null : "hi")}
            ></button>
          </div>

          {/* MAIN BACKGROUND */}
          <div className="colorEditorRow">
            <span className={openPicker === "bg" ? "colorEditorRowLabel" : ""}>Main background</span>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: mainBg }}
              onClick={() => setOpenPicker(openPicker === "bg" ? null : "bg")}
            ></button>
          </div>

          {/* SECONDARY BACKGROUND */}
          <div className="colorEditorRow">
            <span className={openPicker === "secbg" ? "colorEditorRowLabel" : ""}>Secondary background</span>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: secondaryBg }}
              onClick={() => setOpenPicker(openPicker === "secbg" ? null : "secbg")}
            ></button>
          </div>

          {/* SELECTION BACKGROUND */}
          <div className="colorEditorRow">
            <span className={openPicker === "selbg" ? "colorEditorRowLabel" : ""}>Selection background</span>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: selectionBg }}
              onClick={() => setOpenPicker(openPicker === "selbg" ? null : "selbg")}
            ></button>
          </div>

          {/* BUTTON BORDER */}
          <div className="colorEditorRow">
            <span className={openPicker === "bb" ? "colorEditorRowLabel" : ""}>Button border</span>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: buttonBorder }}
              onClick={() => setOpenPicker(openPicker === "bb" ? null : "bb")}
            ></button>
          </div>

          {/* ICON */}
          <div className="colorEditorRow">
            <span className={openPicker === "ic" ? "colorEditorRowLabel" : ""}>Icon</span>
            <button
              className="actionButton colorEditorButton"
              style={{ backgroundColor: icon }}
              onClick={() => setOpenPicker(openPicker === "ic" ? null : "ic")}
            ></button>
          </div>
        </div>
        <div className="colorPicker" style={openPicker ? { padding: "1em" } : {}}>
          {openPicker === "mf" && (
            <>
              <div className="colorPickerTitle">Main font</div>
              <HexColorPicker
                color={mainFont}
                onChange={(color) => {
                  setMainFont(color)
                  updateVar("--main-font-color", color)
                }}
              />
            </>
          )}
          {openPicker === "hi" && (
            <>
              <div className="colorPickerTitle">Highlight font</div>
              <HexColorPicker
                color={highlight}
                onChange={(color) => {
                  setHighlight(color)
                  updateVar("--light-orange", color)
                }}
              />
            </>
          )}
          {openPicker === "bg" && (
            <>
              <div className="colorPickerTitle">Main background</div>
              <HexColorPicker
                color={mainBg}
                onChange={(color) => {
                  setMainBg(color)
                  updateVar("--main-background-color", color)
                }}
              />
            </>
          )}
          {openPicker === "secbg" && (
            <>
              <div className="colorPickerTitle">Secondary background</div>
              <HexColorPicker
                color={secondaryBg}
                onChange={(color) => {
                  setSecondaryBg(color)
                  updateVar("--selected-input-background-color", color)
                }}
              />
            </>
          )}
          {openPicker === "selbg" && (
            <>
              <div className="colorPickerTitle">Selection background</div>
              <HexColorPicker
                color={selectionBg}
                onChange={(color) => {
                  setSelectionBg(color)
                  updateVar("--selected-background-color", color)
                }}
              />
            </>
          )}
          {openPicker === "bb" && (
            <>
              <div className="colorPickerTitle">Button border</div>
              <HexColorPicker
                color={buttonBorder}
                onChange={(color) => {
                  setButtonBorder(color)
                  updateVar("--button-border-color", color)
                }}
              />
            </>
          )}
          {openPicker === "ic" && (
            <>
              <div className="colorPickerTitle">Icon</div>
              <HexColorPicker
                color={icon}
                onChange={(color) => {
                  setIcon(color)
                  updateVar("--main-icon-color", color)
                }}
              />
            </>
          )}
        </div>
      </div>
      <div className="actionContainer">
        <button
          className="actionButton mozeidonColor"
          onClick={saveCustomTheme}
          title={"Persist this theme into settings"}
        >
          Save custom theme ✓
        </button>
        {settings.appSettings.custom_theme && (
          <button className="actionButton" onClick={deleteCustomTheme} title={"Delete this theme from settings"}>
            Delete custom theme ✕
          </button>
        )}
      </div>
    </>
  )
}
