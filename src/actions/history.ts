import { invoke } from "@tauri-apps/api/core"

import { ProfileItem } from "../domain/profiles/models"
import { Context, GET_HISTORY_COMMAND } from "../utils/constants"
import { runWithChrono } from "../utils/time"
import { getProfileIdArg } from "./profiles"

export const fetchHistory = async (profile: ProfileItem | undefined) => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: Context.History,
      args: GET_HISTORY_COMMAND + getProfileIdArg(profile),
    })
  )
}
