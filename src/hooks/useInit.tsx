import { invoke } from "@tauri-apps/api/core"
import { useEffect } from "react"

export const useInit = () => {
  useEffect(() => {
    invoke("init")
  }, [])
}
