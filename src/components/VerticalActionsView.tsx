import {
  copyUrlToClipboard,
  deleteBookmarkAction,
  deleteHistoryUrlAction,
  duplicateTabAction,
  updateTabAction,
} from "../actions/actions"
import { closeTab, handleAfterCloseTab, removeTabFromGroup } from "../actions/tabs"
import BookmarkIcon from "../assets/bookmark.svg?react"
import CloseIcon from "../assets/close.svg?react"
import CopyURLIcon from "../assets/copyURL.svg?react"
import DuplicateIcon from "../assets/duplicate.svg?react"
import PinIcon from "../assets/pin.svg?react"
import TabGroupIcon from "../assets/tabGroup.svg?react"
import { Items } from "../domain/ItemModel"
import { BookmarkItem } from "../domain/bookmarks/models"
import { HistoryItem } from "../domain/history/models"
import { ProfileItem } from "../domain/profiles/models"
import { GroupItem, TabItem } from "../domain/tabs/models"
import { useSettings } from "../hooks/useSettings"
import { useNotification } from "../hooks/useUserNotification"
import { Context } from "../utils/constants"
import { capitalize } from "../utils/strings"
import { Utils } from "../utils/utils"
import { ActionsRow } from "./ActionsRow"

interface VerticalActionsViewProps {
  context: Context
  currentProfile: ProfileItem | undefined
  fuzzyItems: Items
  baseItems: Items
  groupItems: GroupItem[]
  searchTerms: string
  isUserWebSearch: boolean
  selectedListIndex: number
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>
  setBaseItems: React.Dispatch<React.SetStateAction<Items>>
  setGroupItems: React.Dispatch<React.SetStateAction<GroupItem[]>>
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>
  setShowEditionTab: React.Dispatch<React.SetStateAction<boolean>>
  setShowGroupEditionTab: React.Dispatch<React.SetStateAction<boolean>>
}

export const VerticalActionsView = ({
  context,
  currentProfile,
  fuzzyItems,
  baseItems,
  setBaseItems,
  setFuzzyItems,
  selectedListIndex,
  setSelectedListIndex,
  setShowEditionTab,
  isUserWebSearch,
  searchTerms,
  setShowGroupEditionTab,
  groupItems,
  setGroupItems,
}: VerticalActionsViewProps) => {
  const { notify } = useNotification()
  const copyItemURL = async () => {
    const item = fuzzyItems[selectedListIndex]
    await copyUrlToClipboard(item.url)
    notify("✓ URL copied")
    Utils.focusSearchInput()
  }

  const closeTabItem = async () => {
    const isListLastItem = selectedListIndex === fuzzyItems.length - 1
    await closeTab({
      profile: currentProfile,
      items: fuzzyItems as TabItem[],
      selectedListIndex,
    })
    notify("✓ tab closed")
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
    if ((groupItems.length !== newGroups.length && selectedListIndex > 0) || isListLastItem) {
      setSelectedListIndex(selectedListIndex - 1)
    }
    setFuzzyItems(newFuzzyItems)
    setBaseItems(newBaseItems)
    setGroupItems(newGroups)
    Utils.focusSearchInput()
  }

  const deleteHistoryItem = async () => {
    const isListLastItem = selectedListIndex === fuzzyItems.length - 1
    const item = fuzzyItems[selectedListIndex] as HistoryItem
    await deleteHistoryUrlAction(item.url)
    fuzzyItems.splice(selectedListIndex, 1)
    const newBaseItems = (baseItems as HistoryItem[]).filter((i) => i.id !== item.id)
    if (isListLastItem) {
      setSelectedListIndex(selectedListIndex - 1)
    }
    setFuzzyItems(fuzzyItems)
    setBaseItems(newBaseItems)
    notify("✓ history item deleted")
    Utils.focusSearchInput()
  }

  const deleteBookmarkItem = async () => {
    const isListLastItem = selectedListIndex === fuzzyItems.length - 1
    const item = fuzzyItems[selectedListIndex] as BookmarkItem
    await deleteBookmarkAction(item.id)
    fuzzyItems.splice(selectedListIndex, 1)
    const newBaseItems = (baseItems as BookmarkItem[]).filter((i) => i.id !== item.id)
    if (isListLastItem) {
      setSelectedListIndex(selectedListIndex - 1)
    }
    setFuzzyItems(fuzzyItems)
    setBaseItems(newBaseItems)
    notify("✓ bookmark deleted !")
    Utils.focusSearchInput()
  }

  const editTabItem = async () => {
    setShowEditionTab(true)
  }

  const editTabGroup = async () => {
    setShowGroupEditionTab(true)
  }

  const duplicateTabItem = async () => {
    const reorder = (items: TabItem[]) =>
      items.forEach((t) => {
        if (t.type === "tab" && t.index >= duplicatedTab.index) {
          t.index += 1
        }
      })
    let duplicateHasCollpasedGroup = false
    const tab = fuzzyItems[selectedListIndex] as TabItem
    const receivedDuplicatedTab = await duplicateTabAction(currentProfile, tab)
    const duplicateHasGroup = receivedDuplicatedTab.groupId !== -1
    const duplicatedTab = duplicateHasGroup
      ? { ...receivedDuplicatedTab, groupTitle: tab.groupTitle }
      : receivedDuplicatedTab

    if (duplicateHasGroup) {
      const group = groupItems.find((g) => g.id === duplicatedTab.groupId)
      if (group) {
        if (group.collapsed) {
          duplicateHasCollpasedGroup = true
          reorder(group.tabs)
        }
        group.tabs.push(duplicatedTab)
        group.tabs.sort((t1, t2) => t1.index - t2.index)
      }
    }

    let newBaseItems = baseItems as TabItem[]
    let newFuzzyItems = fuzzyItems as TabItem[]

    // no search currently, update both fuzzyItems and baseItems
    if (searchTerms === "") {
      newBaseItems = [...baseItems] as TabItem[]
      reorder(newBaseItems)
      newBaseItems.splice(selectedListIndex + 1, 0, duplicatedTab)
      newFuzzyItems = [...newBaseItems]
    } else {
      if (!duplicateHasCollpasedGroup) {
        reorder(newBaseItems)
        const baseItemsPosition = Utils.findIndex(newBaseItems, tab.id)
        if (baseItemsPosition !== -1) {
          newBaseItems.splice(baseItemsPosition + 1, 0, duplicatedTab)
        }
      }
      newFuzzyItems.splice(selectedListIndex + 1, 0, duplicatedTab)
    }

    setFuzzyItems(newFuzzyItems)
    setBaseItems(newBaseItems)
    setGroupItems(groupItems)

    notify("✓ tab duplicated")
    Utils.focusSearchInput()
  }

  const pinTabItem = async () => {
    const tab = fuzzyItems[selectedListIndex] as TabItem
    const isPinned = tab.pinned
    await updateTabAction(currentProfile, tab.id, tab.windowId, {
      pin: !tab.pinned,
    })
    if (!isPinned) {
      const basePinnedTabs = (baseItems as TabItem[]).filter((t) => t.pinned && t.groupId === -1)
      // always first
      // a tab being pinned must be removed from its group ( if any )
      let deleteGroupId = -1
      let newGroups = removeTabFromGroup({ item: tab, groups: groupItems })
      newGroups.forEach(({ id, collapsed, tabs }) => {
        // handle the empty group case
        if (tabs.length < 2) {
          deleteGroupId = id
        }
        tabs.forEach((t) => {
          if (collapsed && t.type === "tab" && t.index < tab.index) {
            t.index += 1
          }
        })
      })

      tab.pinned = true
      tab.groupId = -1
      tab.groupTitle = undefined

      let newFuzzyItems: TabItem[] = []
      let newBaseItems: TabItem[] = []
      // no search currently, update both fuzzyItems and baseItems
      if (searchTerms === "") {
        newBaseItems = baseItems as TabItem[]
        newBaseItems.splice(selectedListIndex, 1)
        newBaseItems.forEach((t) => {
          if (!t.pinned && t.type === "tab" && t.index < tab.index) {
            t.index += 1
          }
        })
        tab.index = basePinnedTabs.length
        newBaseItems.splice(basePinnedTabs.length, 0, tab)
        newFuzzyItems = newBaseItems
      } else {
        // search, update only baseItems
        newBaseItems = baseItems as TabItem[]
        let position = Utils.findIndex(newBaseItems, tab.id)
        if (position !== -1) {
          newBaseItems.splice(position, 1)
        }
        newBaseItems.forEach((t) => {
          if (!t.pinned && t.type === "tab" && t.index < tab.index) {
            t.index += 1
          }
        })
        tab.index = basePinnedTabs.length
        newBaseItems.splice(basePinnedTabs.length, 0, tab)
        newFuzzyItems = fuzzyItems as TabItem[]
      }
      if (deleteGroupId !== -1) {
        newFuzzyItems = newFuzzyItems.filter((t) => t.groupId !== deleteGroupId)
        newBaseItems = newBaseItems.filter((t) => t.groupId !== deleteGroupId)
        newGroups = newGroups.filter((g) => g.id !== deleteGroupId)
      }
      setFuzzyItems(newFuzzyItems)
      setBaseItems(newBaseItems)
      setGroupItems(newGroups)
      if (deleteGroupId !== -1 && newFuzzyItems.length !== fuzzyItems.length) {
        setSelectedListIndex((i) => i - 1)
      }
    } else {
      let newFuzzyItems: TabItem[] = fuzzyItems as TabItem[]
      let newBaseItems: TabItem[] = baseItems as TabItem[]
      tab.pinned = false
      if (fuzzyItems.length === baseItems.length) {
        const [moved] = newBaseItems.splice(tab.index, 1)
        const remainedPinnedTabs = newBaseItems.filter((t) => t.pinned)
        remainedPinnedTabs.forEach((t) => {
          if (t.index > tab.index) {
            t.index -= 1
          }
        })
        moved.index = remainedPinnedTabs.length
        moved.pinned = false
        newBaseItems = [...remainedPinnedTabs, moved, ...newBaseItems.filter((t) => !t.pinned)]
        newFuzzyItems = newBaseItems
      } else {
        const [moved] = newBaseItems.splice(tab.index, 1)
        const remainedPinnedTabs = newBaseItems.filter((t) => t.pinned)
        remainedPinnedTabs.forEach((t) => {
          if (t.index > tab.index) {
            t.index -= 1
          }
        })
        moved.index = remainedPinnedTabs.length
        moved.pinned = false
        newBaseItems = [...remainedPinnedTabs, moved, ...newBaseItems.filter((t) => !t.pinned)]
      }
      setFuzzyItems(newFuzzyItems)
      setBaseItems(newBaseItems)
    }
    notify(isPinned ? "✓ tab unpinned" : "✓ tab pinned")
    Utils.focusSearchInput()
  }

  const {
    settings: {
      appSettings: { shortcut_close_item, shortcut_edit_bookmark, shortcut_copy_selected_item_url },
    },
  } = useSettings()

  const renderShortcut = (s: string): string => {
    const shortcut = s.split("+").map(capitalize).join(" + ")
    return shortcut ? shortcut : "currently no shortcut was defined"
  }

  switch (context) {
    case Context.Tabs:
      let isGroup = false
      let isPinned = false
      let isGroupMember = false
      let isUserFilteringItems = false
      const isTabListNotEmpty = fuzzyItems.length !== 0
      if (isTabListNotEmpty) {
        const tab = fuzzyItems[selectedListIndex] as TabItem
        if (searchTerms !== "") {
          isUserFilteringItems = true
        }
        if (tab) {
          isGroup = tab.type === "group"
          isPinned = tab.pinned
          isGroupMember = tab.groupId !== -1
        }
      }
      return (
        <div className="verticalActionsViewContainer">
          {!isUserWebSearch && isTabListNotEmpty && !isGroup && (
            <div className="actionsRowContainer">
              <ActionsRow
                actionName={`Copy URL ( ${renderShortcut(shortcut_copy_selected_item_url)} )`}
                action={copyItemURL}
                Icon={CopyURLIcon}
              />
              <ActionsRow
                actionName={`Bookmark tab ( ${renderShortcut(shortcut_edit_bookmark)} )`}
                action={editTabItem}
                Icon={BookmarkIcon}
              />
              <ActionsRow
                actionName={`Close tab ( ${renderShortcut(shortcut_close_item)} )`}
                action={closeTabItem}
                Icon={CloseIcon}
              />
              <ActionsRow actionName="Duplicate tab" action={duplicateTabItem} Icon={DuplicateIcon} />
              <ActionsRow actionName={isPinned ? "Unpin Tab" : "Pin Tab"} action={pinTabItem} Icon={PinIcon} />
              {!isGroupMember && <ActionsRow actionName={`Group tab`} action={editTabGroup} Icon={TabGroupIcon} />}
            </div>
          )}
        </div>
      )
    case Context.History:
      return (
        <div className="verticalActionsViewContainer">
          {!isUserWebSearch && (
            <div className="actionsRowContainer">
              <ActionsRow
                actionName={`Copy URL ( ${renderShortcut(shortcut_copy_selected_item_url)} )`}
                action={copyItemURL}
                Icon={CopyURLIcon}
              />
              <ActionsRow
                actionName={`Bookmark this item ( ${renderShortcut(shortcut_edit_bookmark)} )`}
                action={editTabItem}
                Icon={BookmarkIcon}
              />
              <ActionsRow
                actionName={`Delete this item in history ( ${renderShortcut(shortcut_close_item)} )`}
                action={deleteHistoryItem}
                Icon={CloseIcon}
              />
            </div>
          )}
        </div>
      )
    case Context.Bookmarks:
      return (
        <div className="verticalActionsViewContainer">
          {!isUserWebSearch && (
            <div className="actionsRowContainer">
              <ActionsRow
                actionName={`Copy URL ( ${renderShortcut(shortcut_copy_selected_item_url)} )`}
                action={copyItemURL}
                Icon={CopyURLIcon}
              />
              <ActionsRow
                actionName={`Edit this bookmark ( ${renderShortcut(shortcut_edit_bookmark)} )`}
                action={editTabItem}
                Icon={BookmarkIcon}
              />
              <ActionsRow
                actionName={`Delete bookmark ( ${renderShortcut(shortcut_close_item)} )`}
                action={deleteBookmarkItem}
                Icon={CloseIcon}
              />
            </div>
          )}
        </div>
      )
    case Context.RecentlyClosed:
      return (
        <div className="verticalActionsViewContainer">
          {!isUserWebSearch && (
            <div className="actionsRowContainer">
              <ActionsRow
                actionName={`Copy URL ( ${renderShortcut(shortcut_copy_selected_item_url)} )`}
                action={copyItemURL}
                Icon={CopyURLIcon}
              />
              <ActionsRow
                actionName={`Bookmark this item ( ${renderShortcut(shortcut_edit_bookmark)} )`}
                action={editTabItem}
                Icon={BookmarkIcon}
              />
            </div>
          )}
        </div>
      )
    case Context.None:
      return null
  }
}

function reorderAfterDuplicateTab(list: TabItem[], sourceIndex: number, duplicatedTab: TabItem) {
  // remove and insert the tab at the right place
  const result = Array.from(list)
  result.splice(sourceIndex + 1, 0, duplicatedTab)

  // update the index property of tabs concerned by this reordering
  result.map((t, i) => {
    if (i > sourceIndex + 1) {
      t.index += 1
    }
  })
  return result
}
