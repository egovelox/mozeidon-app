import { GroupItem, TabItem } from "../domain/tabs/models"
import { logEmit } from "../utils/logEmitter"
import { DragAndDropStructure, DragDirection } from "../utils/tabGroups"
import { Utils } from "./utils"

export function reorder({
  list: listItems,
  groups: groupItems,
  direction,
  dragged,
  takesIndexFrom,
  droppedOn,
}: DragAndDropStructure): {
  newList: TabItem[]
  newGroups: GroupItem[]
  removedGroupHeaderPosition?: number
} {
  const oldIndex = dragged.item.index
  const newIndex = takesIndexFrom.index

  // remove and insert the tab at the right place
  const newList = [...listItems]
  const [movedTab] = newList.splice(dragged.position, 1)
  newList.splice(droppedOn.position, 0, movedTab)

  // edge case :
  // when the moved tab is moved from the list in the first position of a group
  // and when predecessorGroupedTab is not correct
  const droppedOnOpenedGroup = groupItems.find(
    (g) => droppedOn.item.type === "group" && g.id === droppedOn.item.groupId && !g.collapsed
  )

  if (movedTab.type === "group") {
    return getOrderedAfterMovedGroup({
      newIndex: takesIndexFrom.movedGroupIndex!,
      newGroups: groupItems,
      newList,
      movedTab,
      direction,
    })
  } else if (direction === "dragDown" && droppedOnOpenedGroup !== undefined) {
    logEmit(`branch #1.1 with newIndex ${newIndex}`)
    const movedTabWasInsideAGroup = movedTab.groupId !== -1
    let movedTabGroupIndex = movedTabWasInsideAGroup ? Utils.findIndex(groupItems, movedTab.groupId) : -1
    if (movedTabGroupIndex !== -1) {
      groupItems[movedTabGroupIndex].tabs = groupItems[movedTabGroupIndex].tabs.filter((t) => t.id !== movedTab.id)
    }
    movedTab.index = newIndex
    movedTab.groupId = droppedOnOpenedGroup.id
    movedTab.groupTitle = droppedOnOpenedGroup.title
    let groupIndex = Utils.findIndex(groupItems, droppedOnOpenedGroup.id)
    let g: TabItem[] = []
    g = [...groupItems[groupIndex].tabs, movedTab] as TabItem[]
    const newGroups = [...groupItems]
    newGroups[groupIndex].tabs = g
    return getOrdered({
      newIndex,
      oldIndex,
      newGroups,
      newList,
      movedTab,
    })
  }
  // when the moved tab is moved in the inside of a group
  else if (!dragged.shouldBeUngrouped) {
    logEmit("branch #1")
    const groupedTabs = groupItems.flatMap((g) => g.tabs)
    const groupSourceIndex = Utils.findIndex(groupItems, movedTab.groupId)
    const predecessorGroupedTab = groupedTabs.find((t) => t.index === newIndex)
    const groupDestIndex = Utils.findIndex(groupItems, predecessorGroupedTab?.groupId)
    // when the moved tab is moved from a group in the inside of another group
    if (
      predecessorGroupedTab !== undefined &&
      movedTab.groupId !== -1 &&
      movedTab.groupId !== predecessorGroupedTab?.groupId
    ) {
      logEmit("branch #2")
      movedTab.index = newIndex
      // then add the movedTab to the destination group
      movedTab.groupId = predecessorGroupedTab.groupId
      movedTab.groupTitle = predecessorGroupedTab.groupTitle
      let g: TabItem[] = []
      g = [...groupItems[groupDestIndex].tabs, movedTab] as TabItem[]
      const newGroups = [...groupItems]
      newGroups[groupDestIndex].tabs = g
      // at last remove the movedTab from the source group
      newGroups[groupSourceIndex].tabs = groupItems[groupSourceIndex].tabs.filter((t) => t.id !== movedTab.id)

      return getOrdered({
        newIndex,
        oldIndex,
        newGroups,
        newList,
        movedTab,
      })
      // when the moved tab is moved from a group in the inside of the same group
    } else if (predecessorGroupedTab !== undefined && movedTab.groupId !== -1) {
      movedTab.index = newIndex
      logEmit(`branch #2.1 with newIndex ${newIndex}`)
      let g: TabItem[] = []
      g = [...groupItems[groupSourceIndex].tabs.filter((t) => t.id !== movedTab.id), movedTab] as TabItem[]
      const newGroups = [...groupItems]
      newGroups[groupSourceIndex].tabs = g
      return getOrdered({
        newIndex,
        oldIndex,
        newGroups,
        newList,
        movedTab,
      })
      // when the moved tab is moved from the list in the inside of a group
    } else if (predecessorGroupedTab !== undefined && movedTab.groupId === -1) {
      logEmit(`branch #3 with newIndex ${newIndex}`)
      movedTab.index = newIndex
      movedTab.groupId = predecessorGroupedTab.groupId
      movedTab.groupTitle = predecessorGroupedTab.groupTitle
      let groupIndex = Utils.findIndex(groupItems, predecessorGroupedTab.groupId)
      let g: TabItem[] = []
      g = [...groupItems[groupIndex].tabs, movedTab] as TabItem[]
      const newGroups = [...groupItems]
      newGroups[groupIndex].tabs = g
      logEmit(`logging new groups: ${JSON.stringify(newGroups[groupIndex])}`)
      return getOrdered({
        newIndex,
        oldIndex,
        newGroups,
        newList,
        movedTab,
      })

      // when the moved tab is moved out of a group
    } else if (movedTab.groupId !== -1) {
      logEmit("branch #3.1")
      let groupIndex = Utils.findIndex(groupItems, movedTab.groupId)
      movedTab.index = newIndex
      movedTab.groupId = -1
      movedTab.groupTitle = undefined
      let movedTabIndex = Utils.findIndex(groupItems[groupIndex].tabs, movedTab.id)
      const g: TabItem[] = groupItems[groupIndex].tabs.filter((_, i) => i !== movedTabIndex)
      const newGroups = [...groupItems]
      newGroups[groupIndex].tabs = g
      return getOrdered({
        newIndex,
        oldIndex,
        newGroups,
        newList,
        movedTab,
      })
    } else {
      logEmit("branch #3.2")
      movedTab.index = newIndex
      const newGroups = [...groupItems]
      return getOrdered({
        newIndex,
        oldIndex,
        newGroups,
        newList,
        movedTab,
      })
    }

    // when the moved tab is moved out of a group
  } else if (movedTab.groupId !== -1) {
    logEmit("branch #4")
    let groupIndex = Utils.findIndex(groupItems, movedTab.groupId)
    movedTab.index = newIndex
    movedTab.groupId = -1
    movedTab.groupTitle = undefined
    let movedTabIndex = Utils.findIndex(groupItems[groupIndex].tabs, movedTab.id)
    const g: TabItem[] = groupItems[groupIndex].tabs.filter((_, i) => i !== movedTabIndex)
    const newGroups = [...groupItems]
    newGroups[groupIndex].tabs = g
    return getOrdered({
      newIndex,
      oldIndex,
      newGroups,
      newList,
      movedTab,
    })
  } else {
    logEmit(`branch #5 with newIndex ${newIndex}`)
    movedTab.index = newIndex
    const newGroups = [...groupItems]
    return getOrdered({
      newIndex,
      oldIndex,
      newGroups,
      newList,
      movedTab,
    })
  }
}

export function getOrdered({
  newIndex,
  oldIndex,
  movedTab,
  newList,
  newGroups,
}: {
  newIndex: number
  oldIndex: number
  movedTab: TabItem
  newList: TabItem[]
  newGroups: GroupItem[]
}): {
  newList: TabItem[]
  newGroups: GroupItem[]
  removedGroupHeaderPosition?: number
} {
  const collapsedGroups = newGroups.filter((g) => g.collapsed)
  const collapsedTabs = collapsedGroups.flatMap((g) => g.tabs).filter((t) => t.type !== "group")

  // update tab indices inside list
  newList.forEach((t) => {
    if (t.type === "group") {
      return
    }
    if (oldIndex < newIndex) {
      if (t.index === newIndex && t.id !== movedTab.id) {
        t.index -= 1
      } else if (t.index > oldIndex && t.index < newIndex) {
        t.index -= 1
      }
    } else if (oldIndex > newIndex) {
      if (t.index === newIndex && t.id !== movedTab.id) {
        t.index += 1
      } else if (t.index > newIndex && t.index < oldIndex) {
        t.index += 1
      }
    }
  })

  // update tab indices inside collapsed groups
  collapsedTabs.forEach((t) => {
    if (oldIndex < newIndex) {
      if (t.index === newIndex && t.id !== movedTab.id) {
        t.index -= 1
      } else if (t.index > oldIndex && t.index < newIndex) {
        t.index -= 1
      }
    } else if (oldIndex > newIndex) {
      if (t.index === newIndex && t.id !== movedTab.id) {
        t.index += 1
      } else if (t.index > newIndex && t.index < oldIndex) {
        t.index += 1
      }
    }
  })
  const sortedGroups: GroupItem[] = []
  let removedGroupHeaderPosition: number | undefined = undefined
  for (const group of newGroups) {
    // handle the case when a group has just become empty.
    if (group.tabs.length < 2) {
      const position = newList.findIndex((t) => t.type === "group" && t.groupId === group.id)
      if (position !== -1) {
        newList.splice(position, 1)
        removedGroupHeaderPosition = position
      }
      continue
    }
    group.tabs.sort((t1, t2) => t1.index - t2.index)
    sortedGroups.push(group)
  }

  return { newList, newGroups: sortedGroups, removedGroupHeaderPosition }
}

export function getOrderedAfterMovedGroup({
  newIndex,
  movedTab,
  newList,
  newGroups,
  direction,
}: {
  newIndex: number
  movedTab: TabItem
  newList: TabItem[]
  newGroups: GroupItem[]
  direction: DragDirection
}): {
  newList: TabItem[]
  newGroups: GroupItem[]
  removedGroupHeaderPosition?: number
} {
  const movedGroupIndex = Utils.findIndex(newGroups, movedTab.groupId)
  const movedCollapsedGroup = newGroups[movedGroupIndex]
  const movedCollapsedTabs = movedCollapsedGroup.tabs
  const otherCollapsedGroups = newGroups.filter((g) => g.collapsed && g.id !== movedCollapsedGroup.id)
  const otherCollapsedTabs = otherCollapsedGroups.flatMap((g) => g.tabs).filter((t) => t.type !== "group")
  const oldIndex = movedCollapsedGroup.tabs[1].index

  /* start indices update */
  if (direction === "dragDown") {
    const updateIndex = (t: TabItem) => {
      if (t.index >= oldIndex + movedCollapsedTabs.length - 1 && t.index < newIndex + movedCollapsedTabs.length - 1) {
        t.index -= movedCollapsedTabs.length - 1
      }
    }
    newList.forEach(updateIndex)
    // note that newGroups array will also be updated in place
    otherCollapsedTabs.forEach(updateIndex)
  } else {
    const updateIndex = (t: TabItem) => {
      if (t.index >= newIndex && t.index < oldIndex) {
        t.index += movedCollapsedTabs.length - 1
      }
    }
    newList.forEach(updateIndex)
    // note that newGroups array will also be updated in place
    otherCollapsedTabs.forEach(updateIndex)
  }

  // note that newGroups array will also be updated in place
  movedCollapsedTabs.forEach((t, i) => {
    if (t.type === "tab") {
      t.index = newIndex + (i - 1)
    }
  })

  return {
    newList,
    newGroups,
  }
}
