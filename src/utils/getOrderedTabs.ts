import { toggleCollapseGroup } from "../actions/tabs"
import { ProfileItem } from "../domain/profiles/models"
import { GroupItem, TabItem, TabsWithGroups, Window } from "../domain/tabs/models"

export function getTabsOrdered(tabs: TabItem[]) {
  return tabs.toSorted((a, b) => b.lastAccessed - a.lastAccessed)
}

export async function getLastVisitedTabIndex(
  currentProfile: ProfileItem | undefined,
  list: TabItem[],
  groups: GroupItem[]
): Promise<{
  index: number
  changes?: {
    newList: TabItem[]
    newGroups: GroupItem[]
  }
}> {
  const sortedList = getTabsOrdered(list)
  const sortedCollapsedTabs = getTabsOrdered(groups.filter((g) => g.collapsed).flatMap((g) => g.tabs))

  if (!sortedList.length) {
    return { index: 0 }
  }

  const lastTab = sortedList[0]
  const getLastIndexFromList = (lastTab: TabItem) =>
    list.findIndex((t) => `${t.id}:${t.windowId}` == `${lastTab.id}:${lastTab.windowId}`)

  if (!sortedCollapsedTabs.length) {
    return { index: getLastIndexFromList(lastTab) }
  } else {
    const lastCollapsed = sortedCollapsedTabs[0]
    if (lastTab.lastAccessed > lastCollapsed.lastAccessed) {
      return { index: getLastIndexFromList(lastTab) }
    } else {
      const groupId = lastCollapsed.groupId
      const listGroupHeaderIndex = list.findIndex((t) => t.type === "group" && t.groupId === groupId)
      if (listGroupHeaderIndex === -1) {
        return { index: getLastIndexFromList(lastTab) }
      }
      const { newList, newGroups } = await toggleCollapseGroup({
        profile: currentProfile,
        groupId,
        listIndex: listGroupHeaderIndex,
        groups,
        list,
      })
      const index = newList.findIndex((t) => `${t.id}:${t.windowId}` == `${lastCollapsed.id}:${lastCollapsed.windowId}`)
      return {
        index,
        changes: {
          newList,
          newGroups,
        },
      }
    }
  }
}

export function getPreviousVisitedTabIndex(tabs: TabItem[]): number {
  const sortedTabs = getTabsOrdered(tabs)
  const index = tabs.findIndex((t) => `${t.id}:${t.windowId}` == `${sortedTabs[1].id}:${sortedTabs[1].windowId}`)
  return index
}

export async function getNextTabIndexAccessed({
  selectedTab,
  currentProfile,
  list,
  groups,
  order,
}: {
  selectedTab: TabItem
  currentProfile: ProfileItem | undefined
  list: TabItem[]
  groups: GroupItem[]
  order: "previous" | "next"
}): Promise<{
  index: number
  changes?: {
    newList: TabItem[]
    newGroups: GroupItem[]
  }
}> {
  if (selectedTab.type === "group") {
    return {
      index: selectedTab.index,
    }
  }
  const allTabs = [
    ...list,
    ...groups.flatMap((g) => {
      if (!g.collapsed) return []
      return g.tabs
    }),
  ]
    .filter((t) => t.type === "tab")
    .sort((t1, t2) => t2.lastAccessed - t1.lastAccessed)

  // is 0 when Swell first displays tabs
  const allTabsSelectedTabIndex = allTabs.findIndex((t) => t.index === selectedTab.index)
  if (allTabsSelectedTabIndex === -1) {
    return {
      index: selectedTab.index,
    }
  }
  // TODO handle last tab of list

  let targetTab: TabItem
  if (order === "previous") {
    targetTab = allTabs[allTabsSelectedTabIndex + 1]
  } else {
    targetTab = allTabs[allTabsSelectedTabIndex - 1]
  }
  // this tab doesn't belong to a group
  if (targetTab.groupId === -1) {
    return {
      index: targetTab.index,
    }
  } else {
    const group = groups.find((g) => g.id === targetTab.groupId)
    // this group is not collapsed
    if (!group || !group.collapsed) {
      return {
        index: targetTab.index,
      }
    } else {
      const groupId = group.id
      const listGroupHeaderIndex = list.findIndex((t) => t.type === "group" && t.groupId === groupId)
      // TODO : handle empty
      if (listGroupHeaderIndex === -1) {
      }

      const { newList, newGroups } = await toggleCollapseGroup({
        profile: currentProfile,
        groupId,
        listIndex: listGroupHeaderIndex,
        groups,
        list,
      })

      return {
        index: targetTab.index,
        changes: {
          newList,
          newGroups,
        },
      }
    }
  }
}

/**
 * Filter out all tabs and groups not belonging to the current-window
 */
export function getWindowTabsAndGroups({
  currentWindow,
  received,
}: {
  currentWindow: Window
  received: TabsWithGroups
}) {
  const groups = received.groups.filter((g) => g.windowId === currentWindow.id)
  const groupItems: GroupItem[] = groups.map((group) => ({
    ...group,
    tabs: [],
  }))
  const tabs: TabItem[] = [
    ...received.tabs
      .filter((t) => t.windowId === currentWindow.id)
      .map((t) => {
        const group = groupItems.find((g) => g.id === t.groupId)
        return {
          type: "tab" as const,
          groupTitle: group ? group.title : undefined,
          ...t,
        }
      }),
  ]
  return { tabs, groups, groupItems }
}
