import { getPlatform } from "./getPlatform"

export function getKeyCombination(e: React.KeyboardEvent | KeyboardEvent) {
  const metaKey = isMacOS() ? "Command" : "Meta"
  const altKey = isMacOS() ? "Option" : "Alt"
  const keyCombo =
    (e.ctrlKey ? "Control+" : "") +
    (e.altKey ? `${altKey}+` : "") +
    (e.metaKey ? `${metaKey}+` : "") +
    (e.shiftKey ? "Shift+" : "") +
    e.key.toLowerCase()
  return keyCombo
}

function isMacOS(): boolean {
  return getPlatform() === "macos"
}
