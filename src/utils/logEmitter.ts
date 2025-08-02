import { emit } from "@tauri-apps/api/event"

export function logEmit(message: string) {
  if (window.DEBUG === true) {
    emit("js-message", { message })
  }
}
