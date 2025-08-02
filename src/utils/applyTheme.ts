export function applyTheme(theme: string) {
  const root = document.documentElement
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
