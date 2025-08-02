import { invoke } from "@tauri-apps/api/core"
import { Context, GET_HISTORY_COMMAND } from "../utils/constants"
import { runWithChrono } from "../utils/time"

export const fetchHistory = async () => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: Context.History,
      args: GET_HISTORY_COMMAND,
    })
  )
}
