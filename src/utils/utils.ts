import { isErrorJsonString } from "./strings"

export class Utils {
  static findIndex<T extends { id: number | string }>(list: T[], id: number | string | undefined) {
    return list.findIndex((item) => item.id === id)
  }

  static focusSearchInput() {
    document.getElementById("searchInput")?.focus()
  }

  static jsonParse(raw: unknown) {
    return JSON.parse(raw as string)
  }

  static handleError(res: unknown, setError: (value: React.SetStateAction<string>) => void): boolean {
    if (isErrorJsonString(res)) {
      const error: { error: string } = Utils.jsonParse(res)
      setError(error.error)
      return true
    }
    return false
  }
}
