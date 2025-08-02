import { Group, GroupItem, TabItem } from "../domain/tabs/models"
import { logEmit } from "./logEmitter"

export type DragDirection = "dragDown" | "dragUp"
export type DragAndDropStructure = {
  list: TabItem[]
  groups: GroupItem[]
  direction: DragDirection
  dragged: {
    item: TabItem
    position: number
    shouldBeUngrouped: boolean
  }
  droppedOn: {
    item: TabItem
    position: number
  }
  takesIndexFrom: {
    item: TabItem
    index: number
    position: number
    movedGroupIndex?: number
  }
}

export function getDragAndDropStructure({
  draggedFromPosition,
  droppedToPosition,
  list,
  groups,
}: {
  draggedFromPosition: number
  droppedToPosition: number
  list: TabItem[]
  groups: GroupItem[]
}): {
  dragAndDropStructure: DragAndDropStructure
} {
  const dragAndDropStructure: DragAndDropStructure = {
    list: [...list],
    groups: [...groups],
    direction: draggedFromPosition < droppedToPosition ? "dragDown" : "dragUp",
    dragged: {
      item: list[draggedFromPosition],
      position: draggedFromPosition,
      shouldBeUngrouped: false,
    },
    droppedOn: {
      item: list[droppedToPosition],
      position: droppedToPosition,
    },
    takesIndexFrom: {
      item: list[0],
      index: 0,
      position: -1,
    },
  }

  const { direction, droppedOn } = dragAndDropStructure

  // handle the case when the destination row is a tab
  if (list[droppedToPosition].type === "tab") {
    dragAndDropStructure.takesIndexFrom = {
      item: list[droppedToPosition],
      index: list[droppedToPosition].index,
      position: droppedToPosition,
    }
    // handle the case when the destination row is a group title
  } else {
    const groupIndex = groups.findIndex(
      (g) => g.id === list[droppedToPosition].groupId
    )
    const group = groups[groupIndex]
    if (droppedToPosition === list.length - 1) {
      // TODO edge case
    }
    if (direction === "dragDown") {
      if (group.collapsed) {
        // take index from the last tab of the collapsed group
        const item = group.tabs[group.tabs.length - 1]
        dragAndDropStructure.takesIndexFrom = {
          item,
          index: item.index,
          // no position because the group is collapsed
          position: -1,
        }
      } else {
        // take index just before the first tab of the group
        // remember group's first tab is not located at group.tabs[0] but at group.tabs[1]
        const item = group.tabs[1]
        const index = item.index - 1
        let maybePosition = list.findIndex((tab) => tab.index === index)
        if (maybePosition !== -1) {
          dragAndDropStructure.takesIndexFrom = {
            item: list[maybePosition],
            index,
            position: maybePosition,
          }
        } else {
          const hiddenItem = groups
            .flatMap((g) => g.tabs)
            .find((tab) => tab.index === index)
          dragAndDropStructure.takesIndexFrom = {
            item: hiddenItem!,
            index,
            position: -1,
          }
        }
      }
    } else {
      const item = group.tabs[1]
      const index = item.index
      const position = list.findIndex((tab) => tab.index === index)
      dragAndDropStructure.takesIndexFrom = {
        item,
        index,
        position,
      }
    }
  }

  const { takesIndexFrom } = dragAndDropStructure

  if (
    // the takesIndexFrom item may be in a collapsed group, so may be missing in the tabsList
    (takesIndexFrom.position === -1 &&
      list[droppedOn.position + 1] &&
      (list[droppedOn.position + 1].type === "group" ||
        list[droppedOn.position + 1].groupId === -1)) ||
    // case : you drag up and ungrouped tab is just under the dropped position
    (direction === "dragUp" && takesIndexFrom.item.groupId === -1) ||
    // case : TODO
    (direction === "dragUp" &&
      droppedOn.item.type === "group" &&
      takesIndexFrom.position !== -1 &&
      list[takesIndexFrom.position - 1].index === -1) ||
    // case : you drag down and a you drop on the last tab of an uncollapsed group
    (direction === "dragDown" &&
      list[draggedFromPosition].groupId !== droppedOn.item.groupId &&
      droppedOn.item.type === "tab" &&
      droppedOn.item.groupId !== -1 &&
      (!list[droppedOn.position + 1] ||
        list[droppedOn.position + 1].groupId === -1)) ||
    // case : you drag down and a group is just above the dropped position
    (direction === "dragDown" &&
      droppedOn.item.type === "group" &&
      takesIndexFrom.item.groupId !== -1 &&
      // but check the group is collapsed
      (!list[droppedOn.position + 1] ||
        list[droppedOn.position + 1].groupId === -1))
  ) {
    logEmit(
      `"getDragTabDescription: takesIndex ${takesIndexFrom.index} shouldBeUngrouped ${true}`
    )
    dragAndDropStructure.dragged.shouldBeUngrouped = true
    return { dragAndDropStructure }
  }
  logEmit(
    `"getDragTabDescription: takesIndex ${takesIndexFrom.index} shouldBeUngrouped ${false}`
  )
  dragAndDropStructure.dragged.shouldBeUngrouped = false
  return { dragAndDropStructure }
}

export function insertTabGroups(
  tabs: TabItem[],
  receivedGroups: Group[],
  groupItems: GroupItem[]
) {
  receivedGroups.forEach((group) => {
    const groupFirstTabIndex = tabs.findIndex((t) => t.groupId === group.id)
    const groupItemIndex = groupItems.findIndex((g) => g.id === group.id)
    const groupItem = groupItems[groupItemIndex]
    tabs.splice(groupFirstTabIndex, 0, {
      ...tabs[groupFirstTabIndex],
      type: "group",
      id: group.id,
      index: -1,
      domain: "",
      url: "",
      title: group.title,
      lastAccessed: 0,
    })
    const groupTabs = tabs.filter((t) => t.groupId === group.id)
    groupItem.tabs = groupTabs
    if (group.collapsed) {
      tabs.splice(groupFirstTabIndex + 1, groupItem.tabs.length - 1)
    }
  })
}
