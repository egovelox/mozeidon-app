import { toggleCollapseGroup } from "../actions/tabs"
import { GroupItem, TabItem } from "../domain/tabs/models"

export function getTabsOrdered(tabs: TabItem[]) {
  return tabs.toSorted((a, b) => b.lastAccessed - a.lastAccessed)
}
export async function getLastVisitedTabIndex(
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
  const sortedCollapsedTabs = getTabsOrdered(
    groups.filter((g) => g.collapsed).flatMap((g) => g.tabs)
  )

  if (!sortedList.length) {
    return { index: 0 }
  }

  const lastTab = sortedList[0]
  const getLastIndexFromList = () =>
    list.findIndex(
      (t) => `${t.id}:${t.windowId}` == `${lastTab.id}:${lastTab.windowId}`
    )

  if (!sortedCollapsedTabs.length) {
    return { index: getLastIndexFromList() }
  } else {
    const lastCollapsed = sortedCollapsedTabs[0]
    if (lastTab.lastAccessed > lastCollapsed.lastAccessed) {
      return { index: getLastIndexFromList() }
    } else {
      const groupId = lastCollapsed.groupId
      const listGroupHeaderIndex = list.findIndex(
        (t) => t.type === "group" && t.groupId === groupId
      )
      if (listGroupHeaderIndex === -1) {
        return { index: getLastIndexFromList() }
      }
      const { newList, newGroups } = await toggleCollapseGroup({
        groupId,
        listIndex: listGroupHeaderIndex,
        groups,
        list,
      })
      const index = newList.findIndex(
        (t) =>
          `${t.id}:${t.windowId}` ==
          `${lastCollapsed.id}:${lastCollapsed.windowId}`
      )
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
  const index = tabs.findIndex(
    (t) =>
      `${t.id}:${t.windowId}` == `${sortedTabs[1].id}:${sortedTabs[1].windowId}`
  )
  return index
}
