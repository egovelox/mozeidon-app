import * as v from "valibot"
import { getGlobalShortcuts, getShortcuts } from "./models"
import { INACTIVE_SHORTCUT_VALUE } from "../../utils/constants"

export type ValidationError = {
  settingName: string
  details: string
  received: string
}

const localeValidator = v.custom<string>((input) => {
  try {
    new Intl.Locale(input as string)
    return true
  } catch {
    return false
  }
}, "Invalid locale string")
const OptionalLocale = v.union([
  v.literal(""),
  v.pipe(v.string(), localeValidator),
])
const GlobalShortcutRegex = v.pipe(
  v.string(),
  v.regex(
    /^(?:(?:Command|Control|Alt|Option|Shift|Super|Meta)(?:\+(?:Command|Control|Alt|Option|Shift|Super|Meta))?\+(?:[A-Za-z0-9]|[.,;:'"[\]{}<>?\|_=`~!@#$%&*()\-\^]|F[1-9]|F1[0-9]|F20|Enter|Escape|Backspace|Tab|Delete|Insert|Home|End|CapsLock|NumLock|Space))$|^(F[1-9]|F1[0-9]|F20|PageUp|PageDown|Delete|Insert|Home|End|CapsLock|NumLock)$/,
    "The global shortcut is badly formatted."
  )
)

const ShortcutRegex = v.pipe(
  v.string(),
  v.regex(
    /^(?:(?:Command|Control|Alt|Option|Shift|Super|Meta)(?:\+(?:Command|Control|Alt|Option|Shift|Super|Meta))?\+(?:[A-Za-z0-9]|[.,;:'"[\]{}<>?\|_=`~!@#$%&*()\-\^]|F[1-9]|F1[0-9]|F20|Enter|Escape|Backspace|Tab|Delete|Insert|Home|End|CapsLock|NumLock|Space))$|^(F[1-9]|F1[0-9]|F20|PageUp|PageDown|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/,
    "The shortcut is badly formatted."
  )
)

const GlobalShortcut = v.union([v.literal(""), GlobalShortcutRegex])
const Shortcut = v.union([v.literal(""), ShortcutRegex])
const WebSearchUrl = v.pipe(
  v.string(),
  v.nonEmpty("Please enter your url."),
  v.url("The url is badly formatted."),
  v.endsWith("?q=", "Only urls ending with `?q=` are allowed")
)

export const SettingsSchema = v.object({
  theme: v.union([v.literal("system"), v.literal("dark"), v.literal("light")]),
  web_browser: v.string(),
  web_search_engine_urls: v.array(WebSearchUrl),
  date_locale: OptionalLocale,
  show_favicons: v.boolean(),
  global_shortcut_show_panel_tabs: GlobalShortcut,
  global_shortcut_show_panel_bookmarks: GlobalShortcut,
  global_shortcut_show_panel_recently_closed: GlobalShortcut,
  global_shortcut_show_panel_history: GlobalShortcut,
  shortcut_copy_selected_item_url: Shortcut,
  shortcut_close_panel: Shortcut,
  shortcut_close_item: Shortcut,
  shortcut_list_down: Shortcut,
  shortcut_list_up: Shortcut,
  shortcut_edit_bookmark: Shortcut,
})

export function validateSettingsForm(
  newData: unknown,
  setValidationErrors: React.Dispatch<
    React.SetStateAction<ValidationError[] | null>
  >
) {
  const result = v.safeParse(SettingsSchema, newData)
  if (!result.success) {
    // TODO remove
    console.log("Settings validation errors", result.issues)
    const errors = result.issues?.map(({ path, message, input }) => ({
      settingName: path?.map(({ key }) => key as string).join() ?? "",
      received: String(input),
      details: message ?? "unknown error",
    }))
    setValidationErrors(
      errors?.length
        ? errors
        : [
            {
              settingName: "unknown",
              details: "An unknown error occurred.",
              received: "unknown",
            },
          ]
    )
    /* 
     This string is displayed in json-edit-react UI
     during errorMessageTimeout ( default 2500 ms )
     We do not use it, since we have a dedicated error view.
    */
    return "unused"
  }

  const settings = result.output
  const shortcuts = getShortcuts(settings)
  const globalShortcuts = getGlobalShortcuts(settings)
  const allShortcuts = { ...shortcuts, ...globalShortcuts }

  // check that there is no duplicates in shortcuts
  if (
    new Set(
      Object.values(allShortcuts).filter((v) => v !== INACTIVE_SHORTCUT_VALUE)
    ).size !==
    Object.values(allShortcuts).filter((v) => v !== INACTIVE_SHORTCUT_VALUE)
      .length
  ) {
    setValidationErrors([
      { settingName: "duplicates", details: "", received: "" },
    ])
    return ""
  }
}
