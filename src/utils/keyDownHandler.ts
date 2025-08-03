import { Dispatch, KeyboardEvent, SetStateAction } from "react"
import { AppSettings, Settings } from "../domain/settings/models"
import { Context } from "../utils/constants"
import { TabItem } from "../domain/tabs/models"
import { BookmarkItem } from "../domain/bookmarks/models"
import {
  openURLAction,
  switchTabAction,
  closeTabAction,
  copyUrlToClipboard,
  deleteBookmarkAction,
} from "../actions/actions"
import { getKeyCombination } from "./getKeyCombination"
import { HistoryItem } from "../domain/history/models"
import { invoke } from "@tauri-apps/api/core"

type KeyDownHandlerParams = {
  event: KeyboardEvent
  settings: AppSettings
  context: Context
  fuzzyItems: (TabItem | BookmarkItem | HistoryItem)[]
  showEditionTab: boolean
  isWebSearch: boolean
  selectedListIndex: number
  selectedWebSearchListIndex: number
  searchTerms: string
  closedItems: string[]
  notify: (message: string) => void
  setShowEditionTab: Dispatch<SetStateAction<boolean>>
  setSelectedListIndex: Dispatch<SetStateAction<number>>
  setSelectedWebSearchListIndex: Dispatch<SetStateAction<number>>
  setClosedItems: Dispatch<SetStateAction<string[]>>
  restoreDefaults: () => void
}

export const keyDownHandler = async ({
  event,
  settings,
  context,
  fuzzyItems,
  showEditionTab,
  isWebSearch,
  selectedListIndex,
  selectedWebSearchListIndex,
  searchTerms,
  closedItems,
  notify,
  setShowEditionTab,
  setSelectedListIndex,
  setSelectedWebSearchListIndex,
  setClosedItems,
  restoreDefaults,
}: KeyDownHandlerParams) => {
  const keyCombo = getKeyCombination(event)

  navigationShortcutHandler(
    settings,
    keyCombo,
    fuzzyItems,
    showEditionTab,
    isWebSearch,
    setShowEditionTab,
    setSelectedListIndex,
    setSelectedWebSearchListIndex
  )(event)

  if (!fuzzyItems.length || isWebSearch) {
    if (event.key === "Enter") {
      const webSearchQuery = searchTerms.replaceAll(" ", "+")
      const webSearchUrl = `${settings.web_search_engine_urls[selectedWebSearchListIndex]}${webSearchQuery}`
      await openURLAction(webSearchUrl, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
      return
    }
  }

  if (
    [Context.Tabs, Context.Bookmarks, Context.RecentlyClosed].includes(context)
  ) {
    const item = fuzzyItems[selectedListIndex]
    if (
      keyCombo.toLowerCase() ===
      settings.shortcut_copy_selected_item_url.toLowerCase()
    ) {
      await copyUrlToClipboard(item.url)
      notify(`Copied url`)
    }
  }

  if (context === Context.Tabs) {
    const tab = fuzzyItems[selectedListIndex] as TabItem
    if (!tab) return
    const actionId = `${tab.windowId}:${tab.id}`

    if (
      event.key === "Enter" &&
      !closedItems.includes(actionId) &&
      !showEditionTab
    ) {
      await switchTabAction(actionId, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
    }

    if (
      keyCombo.toLowerCase() === settings.shortcut_close_item.toLowerCase() &&
      !closedItems.includes(actionId) &&
      !showEditionTab
    ) {
      await closeTabAction(actionId)
      notify(`Tab closed !`)
      setClosedItems([...closedItems, actionId])
    }
  }

  if (context === Context.Bookmarks) {
    const bookmark = fuzzyItems[selectedListIndex] as BookmarkItem
    if (!bookmark) return
    const actionId = bookmark.id

    if (event.key === "Enter" && !showEditionTab) {
      await openURLAction(bookmark.url, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
    }

    if (
      keyCombo.toLowerCase() === settings.shortcut_close_item.toLowerCase() &&
      !closedItems.includes(actionId) &&
      !showEditionTab
    ) {
      await deleteBookmarkAction(actionId)
      notify(`Bookmark deleted`)
      setClosedItems([...closedItems, actionId])
    }
  }

  if ([Context.RecentlyClosed, Context.History].includes(context)) {
    const item = fuzzyItems[selectedListIndex] as TabItem
    if (event.key === "Enter" && !showEditionTab) {
      await openURLAction(item.url, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
    }
  }
}

const navigationShortcutHandler =
  (
    settings: AppSettings,
    keyCombination: string,
    hItems: unknown[],
    showEditionTab: boolean,
    isWebSearch: boolean,
    setShowEditionTab: Dispatch<SetStateAction<boolean>>,
    setSelectedListItem: Dispatch<SetStateAction<number>>,
    setSelectedWebSearchListIndex: Dispatch<SetStateAction<number>>
  ) =>
  (event: KeyboardEvent | React.KeyboardEvent) => {
    if (
      !showEditionTab &&
      !isWebSearch &&
      keyCombination.toLowerCase() ===
        settings.shortcut_edit_bookmark.toLowerCase()
    ) {
      event.preventDefault() // prevent default to prevent unwanted scrolling
      showEditionTab ? setShowEditionTab(false) : setShowEditionTab(true)
      return
    }
    if (!showEditionTab && !isWebSearch && hItems.length > 0) {
      if (
        keyCombination.toLowerCase() ===
        settings.shortcut_list_down.toLowerCase()
      ) {
        event.preventDefault() // prevent default to prevent unwanted scrolling
        setSelectedListItem((selectedListItem) => {
          if (selectedListItem === hItems.length - 1) {
            return 0
          }
          return selectedListItem + 1
        })
        return
      }

      if (
        keyCombination.toLowerCase() === settings.shortcut_list_up.toLowerCase()
      ) {
        event.preventDefault() // prevent default to prevent unwanted scrolling
        setSelectedListItem((selectedListItem) => {
          if (selectedListItem === 0) {
            return hItems.length - 1
          }
          return selectedListItem - 1
        })
        return
      }
    }
    if (!showEditionTab && (isWebSearch || hItems.length === 0)) {
      if (
        keyCombination.toLowerCase() ===
        settings.shortcut_list_down.toLowerCase()
      ) {
        event.preventDefault() // prevent default to prevent unwanted scrolling
        setSelectedWebSearchListIndex((selectedListItem) => {
          if (selectedListItem === settings.web_search_engine_urls.length - 1) {
            return 0
          }
          return selectedListItem + 1
        })
        return
      }

      if (
        keyCombination.toLowerCase() === settings.shortcut_list_up.toLowerCase()
      ) {
        event.preventDefault() // prevent default to prevent unwanted scrolling
        setSelectedWebSearchListIndex((selectedListItem) => {
          if (selectedListItem === 0) {
            return settings.web_search_engine_urls.length - 1
          }
          return selectedListItem - 1
        })
        return
      }
    }
  }
