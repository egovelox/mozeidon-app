import { invoke } from "@tauri-apps/api/core"
import { emit } from "@tauri-apps/api/event"
import { useEffect } from "react"

export const useInit = () => {
  useEffect(() => {
    try {
      emit("js-message", { message: "init !" })
      invoke("init")
    } catch (e) {
      emit("js-message", { message: "init error !" })
      emit("js-message", { message: JSON.stringify(e) })
    }
  }, [])
}
