import { invoke } from "@tauri-apps/api/core"
import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import { Command } from "@tauri-apps/plugin-shell"

import { ProfileItem } from "../domain/profiles/models"
import { BrowserManifest } from "../domain/settings/models"
import { TabItem } from "../domain/tabs/models"
import {
  CLOSE_TAB_COMMAND,
  Context,
  CREATE_BOOKMARK_COMMAND,
  DELETE_BOOKMARK_COMMAND,
  DELETE_HISTORY_COMMAND,
  DUPLICATE_TAB_COMMAND,
  NEW_TABGROUP_COMMAND,
  OPEN_NEW_TAB_COMMAND,
  SWITCH_TAB_COMMAND,
  UPDATE_BOOKMARK_COMMAND,
  UPDATE_TAB_COMMAND,
  UPDATE_TABGROUP_COMMAND,
} from "../utils/constants"
import { getPlatform } from "../utils/getPlatform"
import { getProfileIdArg } from "./profiles"

export async function openURLAction(profile: ProfileItem | undefined, url: string) {
  await invoke("mozeidon", {
    context: Context.Tabs,
    args: OPEN_NEW_TAB_COMMAND + getProfileIdArg(profile) + ` ${url}`,
  })
  const profileBrowser = profile?.profileCommandAlias || profile?.profileName
  if (profileBrowser) {
    await switchToBrowserWindow(profileBrowser)
  }
}

export async function copyUrlToClipboard(url: string) {
  await writeText(url)
}

export async function switchTabAction(profile: ProfileItem | undefined, itemId: string) {
  await invoke("mozeidon", {
    context: Context.Tabs,
    args: SWITCH_TAB_COMMAND + getProfileIdArg(profile) + " " + itemId,
  })
  const profileBrowser = profile?.profileCommandAlias || profile?.profileName
  if (profileBrowser) {
    await switchToBrowserWindow(profileBrowser)
  }
}

export async function updateTabAction(
  profile: ProfileItem | undefined,
  tabId: number,
  windowId: number,
  {
    pin,
    tabIndex,
    groupId,
    shouldBeUngrouped,
  }: {
    pin?: boolean
    tabIndex?: number
    shouldBeUngrouped?: boolean
    groupId?: number
  }
) {
  const args = [...(UPDATE_TAB_COMMAND + getProfileIdArg(profile)).split(" "), "-t", `${tabId}`, "-w", `${windowId}`]
  if (tabIndex !== undefined) {
    args.push("-i")
    args.push(`${tabIndex}`)
  }
  if (groupId !== undefined) {
    args.push("-g")
    args.push(`${groupId}`)
  }
  if (shouldBeUngrouped) {
    args.push("--should-be-ungrouped")
  }
  if (pin !== undefined) {
    args.push(`--pin=${String(pin)}`)
  }
  await invoke("mozeidon_write", { args })
}

export async function duplicateTabAction(profile: ProfileItem | undefined, tab: TabItem): Promise<TabItem> {
  const args = [
    ...(DUPLICATE_TAB_COMMAND + getProfileIdArg(profile)).split(" "),
    "-t",
    `${tab.id}`,
    "-w",
    `${tab.windowId}`,
  ]
  const res = await invoke("mozeidon", {
    context: Context.Tabs,
    args: args.join(" "),
  })
  const parsedTabs: Omit<TabItem, "type">[] = JSON.parse(res as string)
  return {
    ...parsedTabs[0],
    type: "tab" as const,
  }
}

export async function switchToBrowserWindow(browser: string) {
  switch (getPlatform()) {
    case "macos":
      await Command.create("open-macos-web-browser", ["-a", browser]).execute()
      break
    case "linux":
      await Command.create("open-linux-web-browser", ["-xa", browser]).execute()
      break
  }
}

export async function closeTabAction(profile: ProfileItem | undefined, itemId: string) {
  await invoke("mozeidon", {
    context: Context.Tabs,
    args: CLOSE_TAB_COMMAND + getProfileIdArg(profile) + " " + itemId,
  })
}

export async function deleteBookmarkAction(bookmarkId: string) {
  await invoke("mozeidon_write", {
    args: [...DELETE_BOOKMARK_COMMAND.split(" "), bookmarkId],
  })
}

export async function deleteHistoryUrlAction(url: string) {
  await invoke("mozeidon_write", {
    args: [...DELETE_HISTORY_COMMAND.split(" "), "-u", url],
  })
}

export async function updateTabGroupAction(
  profile: ProfileItem | undefined,
  groupId: number,
  data: {
    title?: string
    color?: string
    collapsed?: boolean
  }
) {
  const args = [...(UPDATE_TABGROUP_COMMAND + getProfileIdArg(profile)).split(" "), "-g", groupId.toString()]
  if (data.title) {
    args.push("-t")
    args.push(data.title)
  }
  if (data.color) {
    args.push("-c")
    args.push(data.color)
  }
  if (data.collapsed !== undefined) {
    data.collapsed ? args.push("--collapsed") : args.push("--collapsed=false")
  }
  await invoke("mozeidon_write", { args })
}

export async function moveGroupAction(groupId: number, index: number, profile: ProfileItem | undefined) {
  const args = [
    ...(UPDATE_TABGROUP_COMMAND + getProfileIdArg(profile)).split(" "),
    "-g",
    groupId.toString(),
    "-i",
    index.toString(),
  ]
  await invoke("mozeidon_write", { args })
}

export async function newGroupTab(
  tabId: number,
  windowId: number,
  groupTitle: string,
  groupColor: string,
  profile: ProfileItem | undefined
): Promise<string> {
  // will return a new groupId
  return await invoke("mozeidon_write", {
    args: [
      ...(NEW_TABGROUP_COMMAND + getProfileIdArg(profile)).split(" "),
      "-i",
      `${tabId}`,
      "-w",
      `${windowId}`,
      "-t",
      groupTitle,
      "-c",
      groupColor,
    ],
  })
}

export async function createBookmarkAction(
  title: string,
  url: string,
  parent: string,
  profile: ProfileItem | undefined
) {
  await invoke("mozeidon_write", {
    args: [...(CREATE_BOOKMARK_COMMAND + getProfileIdArg(profile)).split(" "), "-t", title, "-u", url, "-f", parent],
  })
}

export async function updateBookmarkAction(bookmarkId: string, title: string, url: string, parent: string) {
  await invoke("mozeidon_write", {
    args: [...UPDATE_BOOKMARK_COMMAND.split(" "), bookmarkId, "-t", title, "-u", url, "-f", parent],
  })
}

export async function getBrowserManifests(): Promise<BrowserManifest[]> {
  let result: BrowserManifest[] = await invoke("get_browser_manifests")
  return result
}

export async function getUserHomeDir(): Promise<string> {
  return await invoke("get_user_home_dir")
}
