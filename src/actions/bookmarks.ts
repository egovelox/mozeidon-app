import { invoke } from "@tauri-apps/api/core"
import { runWithChrono } from "../utils/time"
import { Context, GET_BOOKMARKS_COMMAND } from "../utils/constants"

export const fetchBookmarks = async (hash: string) => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: Context.Bookmarks,
      args: `${GET_BOOKMARKS_COMMAND} --hash ${hash}`,
    })
  )
}
