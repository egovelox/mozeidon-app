import { Command } from "@tauri-apps/plugin-shell"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import { invoke } from "@tauri-apps/api/core"
import {
  CLOSE_TAB_COMMAND,
  Context,
  CREATE_BOOKMARK_COMMAND,
  DELETE_BOOKMARK_COMMAND,
  SWITCH_TAB_COMMAND,
  UPDATE_BOOKMARK_COMMAND,
} from "../utils/constants"
import { fetchCustomBrowserManifests } from "../domain/settings/storage"
import { BrowserManifest } from "../domain/settings/models"
export async function openURLAction(url: string, browser: string) {
  await Command.create("open-web-browser", ["-a", browser, url]).execute()
}

export async function copyUrlToClipboard(url: string) {
  await writeText(url)
}

export async function switchTabAction(itemId: string, browser: string) {
  await invoke("mozeidon", {
    context: Context.Tabs,
    args: SWITCH_TAB_COMMAND + " " + itemId,
  })
  await Command.create("open-web-browser", ["-a", browser]).execute()
}

export async function closeTabAction(itemId: string) {
  await invoke("mozeidon", {
    context: Context.Tabs,
    args: CLOSE_TAB_COMMAND + " " + itemId,
  })
}

export async function deleteBookmarkAction(bookmarkId: string) {
  await invoke("mozeidon_write", {
    args: [...DELETE_BOOKMARK_COMMAND.split(" "), bookmarkId],
  })
}

export async function createBookmarkAction(
  title: string,
  url: string,
  parent: string
) {
  await invoke("mozeidon_write", {
    args: [
      ...CREATE_BOOKMARK_COMMAND.split(" "),
      "-t",
      title,
      "-u",
      url,
      "-f",
      parent,
    ],
  })
}

export async function updateBookmarkAction(
  bookmarkId: string,
  title: string,
  url: string,
  parent: string
) {
  await invoke("mozeidon_write", {
    args: [
      ...UPDATE_BOOKMARK_COMMAND.split(" "),
      bookmarkId,
      "-t",
      title,
      "-u",
      url,
      "-f",
      parent,
    ],
  })
}

export async function getBrowserManifests(): Promise<BrowserManifest[]> {
  let customManifests = await fetchCustomBrowserManifests()
  let result: BrowserManifest[] = await invoke(
    "get_browser_manifests",
    customManifests.length ? { customManifests } : undefined
  )
  return result
}

export async function getUserHomeDir(): Promise<string> {
  return await invoke("get_user_home_dir")
}
