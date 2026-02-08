import { CustomTheme } from "../domain/settings/models"

export function applyTheme(theme: string) {
  const root = document.documentElement

  root.style.removeProperty("--main-font-color")
  root.style.removeProperty("--light-orange")
  root.style.removeProperty("--main-background-color")
  root.style.removeProperty("--selected-background-color")
  root.style.removeProperty("--selected-input-background-color")
  root.style.removeProperty("--button-border-color")
  root.style.removeProperty("--main-icon-color")
  if (theme === "system") {
    root.removeAttribute("data-theme")
  } else {
    root.setAttribute("data-theme", theme)
  }

  /*
   * This temporarily adds a CSS class (theme-transition)
   * to the <html> or :root element
   * for a single animation frame, then immediately removes it.
   *
   * This forces the browser to re-evaluate styles
   * when you load (when the app starts) the data-theme attribute
   * ( stored in the settings.theme )
   */
  root.classList.add("theme-transition")
  requestAnimationFrame(() => {
    root.classList.remove("theme-transition")
  })
}

export function applyCustomTheme(theme: CustomTheme) {
  const root = document.documentElement

  // Apply custom CSS variables
  root.style.setProperty("--main-font-color", theme.main_font)
  root.style.setProperty("--light-orange", theme.highlight)
  root.style.setProperty("--main-background-color", theme.main_background)
  root.style.setProperty("--selected-background-color", theme.selection_background)
  root.style.setProperty("--selected-input-background-color", theme.secondary_background)
  root.style.setProperty("--button-border-color", theme.button_border)
  root.style.setProperty("--main-icon-color", theme.icon)

  /*
   * Same trick as applyTheme:
   * force a style re-evaluation without transitions
   */
  root.classList.add("theme-transition")
  requestAnimationFrame(() => {
    root.classList.remove("theme-transition")
  })
}
