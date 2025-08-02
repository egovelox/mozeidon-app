import { Dispatch, KeyboardEvent, SetStateAction } from "react"
import { AppSettings, Settings } from "../domain/settings/models"
import {
  Context,
  SHORTCUT_LIST_DOWN,
  SHORTCUT_LIST_UP,
} from "../utils/constants"
import { GroupItem, TabItem } from "../domain/tabs/models"
import { BookmarkItem } from "../domain/bookmarks/models"
import {
  openURLAction,
  switchTabAction,
  closeTabAction,
  copyUrlToClipboard,
  deleteBookmarkAction,
  updateTabGroupAction,
  deleteHistoryUrlAction,
} from "../actions/actions"
import { getKeyCombination } from "./getKeyCombination"
import { Items } from "../domain/ItemModel"
import { invoke } from "@tauri-apps/api/core"
import { logEmit } from "./logEmitter"
import { handleAfterCloseTab } from "../actions/tabs"
import { HistoryItem } from "../domain/history/models"

type KeyDownHandlerParams = {
  searchInputRef: React.RefObject<HTMLInputElement>
  event: KeyboardEvent
  settings: AppSettings
  context: Context
  fuzzyItems: Items
  baseItems: Items
  groupItems: GroupItem[]
  setFuzzyItems: Dispatch<SetStateAction<Items>>
  setBaseItems: Dispatch<SetStateAction<Items>>
  setGroupItems: Dispatch<SetStateAction<GroupItem[]>>
  showEditionTab: boolean
  showGroupEditionTab: boolean
  isWebSearch: boolean
  selectedListIndex: number
  selectedWebSearchListIndex: number
  searchTerms: string
  notify: (message: string) => void
  setShowEditionTab: Dispatch<SetStateAction<boolean>>
  setSelectedListIndex: Dispatch<SetStateAction<number>>
  setSelectedWebSearchListIndex: Dispatch<SetStateAction<number>>
  restoreDefaults: () => void
}

export const keyDownHandler = async ({
  searchInputRef,
  event,
  settings,
  context,
  fuzzyItems,
  baseItems,
  groupItems,
  setFuzzyItems,
  setBaseItems,
  setGroupItems,
  showEditionTab,
  showGroupEditionTab,
  isWebSearch,
  selectedListIndex,
  selectedWebSearchListIndex,
  searchTerms,
  notify,
  setShowEditionTab,
  setSelectedListIndex,
  setSelectedWebSearchListIndex,
  restoreDefaults,
}: KeyDownHandlerParams) => {
  const keyCombo = getKeyCombination(event)
  const item = fuzzyItems[selectedListIndex]
  const isGroup = item ? (item as TabItem).type === "group" : false

  navigationShortcutHandler(
    searchInputRef,
    settings,
    keyCombo,
    isGroup,
    fuzzyItems,
    showEditionTab,
    showGroupEditionTab,
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
    if (
      keyCombo.toLowerCase() ===
        settings.shortcut_copy_selected_item_url.toLowerCase() &&
      !isGroup
    ) {
      await copyUrlToClipboard(item.url)
      notify(`URL copied`)
    }
  }

  if (context === Context.Tabs) {
    const tab = fuzzyItems[selectedListIndex] as TabItem
    if (!tab) return
    const actionId = `${tab.windowId}:${tab.id}`

    if (
      event.key === "Enter" &&
      !isGroup &&
      !showEditionTab &&
      !showGroupEditionTab
    ) {
      await switchTabAction(actionId, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
    }

    if (
      event.key === "Enter" &&
      isGroup &&
      !showEditionTab &&
      searchTerms.length === 0
    ) {
      const groupIndex = groupItems.findIndex((g) => g.id === tab.groupId)
      const group = groupItems[groupIndex]
      const fuzzyItemsCopy = [...fuzzyItems]
      const groupItemsCopy = [...groupItems]
      if (!group.collapsed) {
        // collapse
        await updateTabGroupAction(group.id, { collapsed: true })
        fuzzyItemsCopy.splice(selectedListIndex + 1, group.tabs.length - 1)
        setFuzzyItems(fuzzyItemsCopy as Items)
        setBaseItems(fuzzyItemsCopy as Items)
        groupItemsCopy.splice(groupIndex, 1, { ...group, collapsed: true })
        setGroupItems(groupItemsCopy)
      } else {
        // uncollapse
        await updateTabGroupAction(group.id, { collapsed: false })
        const items = [
          ...fuzzyItemsCopy.slice(0, selectedListIndex),
          ...group.tabs,
          ...fuzzyItemsCopy.slice(selectedListIndex + 1),
        ]
        setFuzzyItems(items as Items)
        setBaseItems(items as Items)
        groupItemsCopy.splice(groupIndex, 1, { ...group, collapsed: false })
        setGroupItems(groupItemsCopy)
      }
    }

    if (
      keyCombo.toLowerCase() === settings.shortcut_close_item.toLowerCase() &&
      !isGroup &&
      !showEditionTab &&
      !showGroupEditionTab &&
      !isWebSearch
    ) {
      const isListLastItem = selectedListIndex === fuzzyItems.length - 1
      await closeTabAction(actionId)
      const { newFuzzyItems, newBaseItems, newGroups } = handleAfterCloseTab({
        groups: groupItems,
        fuzzyItems: fuzzyItems as TabItem[],
        baseItems: baseItems as TabItem[],
        closedItem: {
          item: (fuzzyItems as TabItem[])[selectedListIndex],
          position: selectedListIndex,
        },
      })
      // if a group has been deleted, 2 items have been removed from the list
      // and selectedListIndex has been shifted by 2, so we need to correct that
      if (
        (groupItems.length !== newGroups.length && selectedListIndex > 0) ||
        isListLastItem
      ) {
        setSelectedListIndex(selectedListIndex - 1)
      }
      setFuzzyItems(newFuzzyItems)
      setBaseItems(newBaseItems)
      setGroupItems(newGroups)
      notify(`Tab closed`)
    }
  }

  if (context === Context.Bookmarks) {
    const bookmark = fuzzyItems[selectedListIndex] as BookmarkItem
    if (!bookmark) return
    const actionId = bookmark.id

    if (event.key === "Enter" && !showEditionTab && !showGroupEditionTab) {
      await openURLAction(bookmark.url, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
    }

    if (
      keyCombo.toLowerCase() === settings.shortcut_close_item.toLowerCase() &&
      !showEditionTab &&
      !showGroupEditionTab &&
      !isWebSearch
    ) {
      const isListLastItem = selectedListIndex === fuzzyItems.length - 1
      await deleteBookmarkAction(actionId)
      fuzzyItems.splice(selectedListIndex, 1)
      const newBaseItems = (baseItems as BookmarkItem[]).filter(
        (i) => i.id !== bookmark.id
      )
      if (isListLastItem) {
        setSelectedListIndex(selectedListIndex - 1)
      }
      setFuzzyItems(fuzzyItems)
      setBaseItems(newBaseItems)
      notify(`Bookmark deleted`)
    }
  }

  if (context === Context.History) {
    const historyItem = fuzzyItems[selectedListIndex] as HistoryItem
    if (
      keyCombo.toLowerCase() === settings.shortcut_close_item.toLowerCase() &&
      !showEditionTab &&
      !showGroupEditionTab &&
      !isWebSearch
    ) {
      const isListLastItem = selectedListIndex === fuzzyItems.length - 1
      await deleteHistoryUrlAction(historyItem.url)
      fuzzyItems.splice(selectedListIndex, 1)
      const newBaseItems = (baseItems as HistoryItem[]).filter(
        (i) => i.id !== historyItem.id
      )
      if (isListLastItem) {
        setSelectedListIndex(selectedListIndex - 1)
      }
      setFuzzyItems(fuzzyItems)
      setBaseItems(newBaseItems)
      notify(`History item deleted`)
    }
  }

  if ([Context.RecentlyClosed, Context.History].includes(context)) {
    const item = fuzzyItems[selectedListIndex] as TabItem
    if (event.key === "Enter" && !showEditionTab && !showGroupEditionTab) {
      await openURLAction(item.url, settings.web_browser)
      restoreDefaults()
      await invoke("hide")
    }
  }
}

const navigationShortcutHandler =
  (
    searchInputRef: React.RefObject<HTMLInputElement>,
    settings: AppSettings,
    keyCombination: string,
    isGroup: boolean,
    baseItems: unknown[],
    showEditionTab: boolean,
    showGroupEditionTab: boolean,
    isWebSearch: boolean,
    setShowEditionTab: Dispatch<SetStateAction<boolean>>,
    setSelectedListItem: Dispatch<SetStateAction<number>>,
    setSelectedWebSearchListIndex: Dispatch<SetStateAction<number>>
  ) =>
  (event: KeyboardEvent | React.KeyboardEvent) => {
    if (
      !showEditionTab &&
      !showGroupEditionTab &&
      !isWebSearch &&
      !isGroup &&
      keyCombination.toLowerCase() ===
        settings.shortcut_edit_bookmark.toLowerCase()
    ) {
      logEmit("navigation handler #0")
      event.preventDefault() // prevent default to prevent unwanted scrolling
      showEditionTab ? setShowEditionTab(false) : setShowEditionTab(true)
      return
    }
    if (
      !showEditionTab &&
      !showGroupEditionTab &&
      !isWebSearch &&
      baseItems.length > 0
    ) {
      logEmit("navigation handler #1")
      if (
        keyCombination.toLowerCase() === SHORTCUT_LIST_DOWN.toLowerCase() ||
        keyCombination.toLowerCase() ===
          settings.shortcut_list_down.toLowerCase()
      ) {
        event.preventDefault() // prevent default to prevent unwanted scrolling
        setSelectedListItem((selectedListItem) => {
          if (selectedListItem === baseItems.length - 1) {
            return 0
          }
          return selectedListItem + 1
        })
        searchInputRef.current?.focus()
        return
      }

      if (
        keyCombination.toLowerCase() === SHORTCUT_LIST_UP.toLowerCase() ||
        keyCombination.toLowerCase() === settings.shortcut_list_up.toLowerCase()
      ) {
        event.preventDefault() // prevent default to prevent unwanted scrolling
        setSelectedListItem((selectedListItem) => {
          if (selectedListItem === 0) {
            return baseItems.length - 1
          }
          return selectedListItem - 1
        })
        searchInputRef.current?.focus()
        return
      }
    }
    if (
      !showEditionTab &&
      !showGroupEditionTab &&
      (isWebSearch || baseItems.length === 0)
    ) {
      logEmit("navigation handler #2")
      if (
        keyCombination.toLowerCase() === SHORTCUT_LIST_DOWN.toLowerCase() ||
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
        keyCombination.toLowerCase() === SHORTCUT_LIST_UP.toLowerCase() ||
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
