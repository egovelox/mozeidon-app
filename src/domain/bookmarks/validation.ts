import * as v from "valibot"

interface FormElements extends HTMLFormControlsCollection {
  title: HTMLInputElement
  url: HTMLInputElement
  folderPath: HTMLInputElement
}
export interface BmFormElement extends HTMLFormElement {
  readonly elements: FormElements
}
export type ValidationError = {
  settingName: string
  details: string
  received: string
}

const BookmarkUrl = v.pipe(
  v.string(),
  v.nonEmpty("Please enter your url."),
  v.url("The url is badly formatted.")
)
const FolderPathUrl = v.pipe(
  v.string(),
  v.startsWith("/", "A folder-path not starting with `/` is not allowed"),
  v.endsWith("/", "A folder-path not ending with `/` is not allowed")
)

export const BookmarkFormSchema = v.object({
  url: BookmarkUrl,
  title: v.string(),
  folderPath: v.union([v.literal(""), FolderPathUrl]),
})

export function isValidBookmark(
  newData: unknown,
  setValidationErrors: React.Dispatch<
    React.SetStateAction<ValidationError[] | null>
  >
) {
  const result = v.safeParse(BookmarkFormSchema, newData)
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
    return false
  }
  return true
}
