import { invoke } from "@tauri-apps/api/core"

import { ProfileItem } from "../domain/profiles/models"
import { Context, GET_BOOKMARKS_COMMAND } from "../utils/constants"
import { runWithChrono } from "../utils/time"
import { getProfileIdArg } from "./profiles"

export const fetchBookmarks = async (hash: string, profile: ProfileItem | undefined) => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: Context.Bookmarks,
      args: `${GET_BOOKMARKS_COMMAND} --hash ${hash}` + getProfileIdArg(profile),
    })
  )
}
