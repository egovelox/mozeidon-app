import { useSettings } from "../hooks/useSettings"
import { useCallback, useEffect } from "react"
import { getKeyCombination } from "../utils/getKeyCombination"
import { SHORTCUT_HIDE_PANEL } from "../utils/constants"

export const WindowShortcutListener = ({
  closeWindowCallback,
}: {
  closeWindowCallback: (event: KeyboardEvent) => Promise<void>
}) => {
  const {
    settings: { appSettings },
  } = useSettings()

  const handleShortcutCloseMozeidonWindowKeydown = useCallback(
    (event: KeyboardEvent) => {
      const keyCombo = getKeyCombination(event)
      if (
        keyCombo.toLowerCase() === SHORTCUT_HIDE_PANEL.toLowerCase() ||
        keyCombo.toLowerCase() === appSettings.shortcut_hide_panel.toLowerCase()
      ) {
        event.preventDefault()
        closeWindowCallback(event)
      }
    },
    [appSettings]
  )

  /* Register the shortcut on the window object */
  useEffect(() => {
    window.addEventListener("keydown", handleShortcutCloseMozeidonWindowKeydown)
    return () => {
      window.removeEventListener(
        "keydown",
        handleShortcutCloseMozeidonWindowKeydown
      )
    }
  }, [handleShortcutCloseMozeidonWindowKeydown])

  return null
}
