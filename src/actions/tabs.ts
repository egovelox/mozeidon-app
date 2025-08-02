import { invoke } from "@tauri-apps/api/core"
import { GroupItem, TabItem } from "../domain/tabs/models"
import { runWithChrono } from "../utils/time"
import { closeTabAction, updateTabGroupAction } from "./actions"
import {
  Context,
  GET_RECENTLY_CLOSED_COMMAND,
  GET_TABS_COMMAND,
  GET_TABS_AND_GROUPS_COMMAND,
} from "../utils/constants"

export const fetchTabsWithGroups = async () => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: "tabsWithGroups",
      args: GET_TABS_AND_GROUPS_COMMAND,
    })
  )
}

export const fetchTabs = async () => {
  return await runWithChrono(() =>
    invoke("mozeidon", { context: Context.Tabs, args: GET_TABS_COMMAND })
  )
}

export const fetchRecentlyClosedTabs = async () => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: Context.Tabs,
      args: GET_RECENTLY_CLOSED_COMMAND,
    })
  )
}

export const toggleCollapseGroup = async ({
  listIndex,
  groupId,
  groups,
  list,
}: {
  listIndex: number
  groupId: number
  groups: GroupItem[]
  list: TabItem[]
}) => {
  const groupIndex = groups.findIndex((g) => g.id === groupId)
  const group = groups[groupIndex]
  const listCopy = [...list]
  const groupsCopy = [...groups]
  if (!group.collapsed) {
    await updateTabGroupAction(group.id, { collapsed: true })
    groupsCopy.splice(groupIndex, 1, { ...group, collapsed: true })
    listCopy.splice(listIndex + 1, group.tabs.length - 1)
    return {
      newList: listCopy,
      newGroups: groupsCopy,
    }
  } else {
    await updateTabGroupAction(group.id, { collapsed: false })
    groupsCopy.splice(groupIndex, 1, { ...group, collapsed: false })
    const newList = [
      ...listCopy.slice(0, listIndex),
      ...group.tabs,
      ...listCopy.slice(listIndex + 1),
    ]
    return {
      newList,
      newGroups: groupsCopy,
    }
  }
}

export const closeTab = async ({
  items,
  selectedListIndex,
}: {
  items: TabItem[]
  selectedListIndex: number
}) => {
  const item = items[selectedListIndex] as TabItem
  const actionId = `${item.windowId}:${item.id}`
  await closeTabAction(actionId)
}

export function handleAfterCloseTab({
  closedItem,
  fuzzyItems,
  groups,
  baseItems,
}: {
  closedItem: {
    position: number
    item: TabItem
  }
  baseItems: TabItem[]
  fuzzyItems: TabItem[]
  groups: GroupItem[]
}): {
  newBaseItems: TabItem[]
  newFuzzyItems: TabItem[]
  newGroups: GroupItem[]
} {
  // remove the item from the list
  fuzzyItems.splice(closedItem.position, 1)
  const newGroups = removeTabFromGroup({ item: closedItem.item, groups })
  const newBaseItems = baseItems.filter((t) => t.id !== closedItem.item.id)
  return reorderAfterClosedTab({
    closedTab: closedItem.item,
    newBaseItems,
    newGroups,
    newFuzzyItems: fuzzyItems,
  })
}

export function removeTabFromGroup({
  item,
  groups,
}: {
  item: TabItem
  groups: GroupItem[]
}): GroupItem[] {
  if (item.groupId === -1) {
    return groups
  }
  const groupIndex = groups.findIndex((g) => g.id === item.groupId)
  if (groupIndex === -1) {
    return groups
  }
  const { tabs } = groups[groupIndex]
  const newTabs = tabs.filter((t) => t.id !== item.id)
  groups[groupIndex].tabs = newTabs
  return groups
}

export function reorderAfterClosedTab({
  newGroups,
  newFuzzyItems,
  newBaseItems,
  closedTab,
}: {
  closedTab: TabItem
  newFuzzyItems: TabItem[]
  newBaseItems: TabItem[]
  newGroups: GroupItem[]
}): {
  newFuzzyItems: TabItem[]
  newBaseItems: TabItem[]
  newGroups: GroupItem[]
} {
  let deleteGroupId: number = -1
  newGroups.forEach(({ id, collapsed, tabs }) => {
    // handle the empty group case
    if (tabs.length < 2) {
      deleteGroupId = id
    }
    tabs.forEach((tab) => {
      if (collapsed && tab.type === "tab" && tab.index > closedTab.index) {
        tab.index -= 1
      }
    })
  })

  // we change newBaseItems ( the master list ) only
  newBaseItems.forEach((tab) => {
    if (tab.type === "tab" && tab.index > closedTab.index) {
      tab.index -= 1
    }
  })

  // remove the empty group case
  if (deleteGroupId !== -1) {
    return {
      newBaseItems: newBaseItems.filter((tab) => tab.groupId !== deleteGroupId),
      newFuzzyItems: newFuzzyItems.filter(
        (tab) => tab.groupId !== deleteGroupId
      ),
      newGroups: newGroups.filter(({ id }) => id !== deleteGroupId),
    }
  }
  return {
    newBaseItems,
    newFuzzyItems,
    newGroups,
  }
}
