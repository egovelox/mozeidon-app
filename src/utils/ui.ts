import { invoke } from "@tauri-apps/api/core"
import { listen, Event } from "@tauri-apps/api/event"

export class SwellUi {
  static async show() {
    invoke("show")
  }

  static async hide() {
    invoke("hide")
  }

  static listenEvent(callback: (event: Event<{ isVisible: boolean }>) => void) {
    listen<{ isVisible: boolean }>("toggle-visible", callback)
  }
}
