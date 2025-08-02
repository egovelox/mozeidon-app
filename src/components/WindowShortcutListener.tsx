import { useSettings } from "../hooks/useSettings"
import { useCallback, useEffect } from "react"
import { getKeyCombination } from "../utils/getKeyCombination"

export const WindowShortcutListener = ({
  closeWindowCallback,
}: {
  closeWindowCallback: (event: KeyboardEvent) => Promise<void>
}) => {
  const { settings } = useSettings()

  const handleShortcutCloseMozeidonWindowKeydown = useCallback(
    (event: KeyboardEvent) => {
      const keyCombo = getKeyCombination(event)
      if (
        keyCombo.toLowerCase() ===
        settings.shortcut_close_mozeidon_window.toLowerCase()
      ) {
        event.preventDefault()
        closeWindowCallback(event)
      }
    },
    [settings]
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
