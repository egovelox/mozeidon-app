import { GroupItem, TabItem } from "../domain/tabs/models"
import {
  Context,
  LIST_CONTAINER_HEIGHT,
  MULTILINE_ITEM_SIZE,
  ONELINE_ITEM_SIZE,
  RowDisplay,
} from "../utils/constants"
import { FixedSizeList as List } from "react-window"
import { getRows } from "./Row"
import {
  DragDropContext,
  DragStart,
  Droppable,
  DropResult,
} from "react-beautiful-dnd"
import { useEffect, useRef, useState } from "react"
import { moveGroupAction, updateTabAction } from "../actions/actions"
import { getDragAndDropStructure } from "../utils/tabGroups"
import { reorder } from "../utils/reordering"
import { TabRow } from "./RowTab"
import { Items } from "../domain/ItemModel"

type ListContainerProps = {
  searchInputRef: React.RefObject<HTMLInputElement>
  groupItems: GroupItem[]
  setGroupItems: React.Dispatch<React.SetStateAction<GroupItem[]>>
  rowDisplay: RowDisplay
  selectedListIndex: number
  fuzzyItems: Items
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>
  setBaseItems: React.Dispatch<React.SetStateAction<Items>>
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>
  setShowEditionTab: React.Dispatch<React.SetStateAction<boolean>>
  context: Context
  listRef: React.RefObject<List>
  restoreDefaults: () => void
  isSearchNotFound: boolean
  isUserWebSearch: boolean
  searchTerms: string
}

export function ListContainer({
  searchInputRef,
  groupItems,
  setGroupItems,
  rowDisplay,
  selectedListIndex,
  fuzzyItems,
  setFuzzyItems,
  setBaseItems,
  setSelectedListIndex,
  setShowEditionTab,
  context,
  listRef,
  restoreDefaults,
  isSearchNotFound,
  isUserWebSearch,
  searchTerms,
}: ListContainerProps) {
  const [dragAndDropEnd, setDragAndDropEnd] = useState<DropResult | null>(null)
  const mouseLocationYRef = useRef(0)

  const captureMousePosition = (e: MouseEvent) => {
    mouseLocationYRef.current = e.clientY
  }

  useEffect(() => {
    window.addEventListener("mousemove", captureMousePosition)
  }, [])

  useEffect(() => {
    if (dragAndDropEnd) {
      const mouseLocationY = mouseLocationYRef.current
      const { dragAndDropStructure } = getDragAndDropStructure({
        draggedFromPosition: dragAndDropEnd.source.index,
        droppedToPosition: dragAndDropEnd.destination!.index,
        list: fuzzyItems as TabItem[],
        groups: groupItems,
      })
      const { list, dragged, droppedOn, takesIndexFrom, direction } =
        dragAndDropStructure
      const tab = dragged.item
      let movedGroupTargetIndex: number | undefined = undefined

      // Dragging a group, we have to prepare before doBrowserActions
      if (dragged.item.type === "group") {
        const list = fuzzyItems as TabItem[]
        const groups = groupItems
        const draggedGroupIndex = groups.findIndex(
          (g) => g.id === dragged.item.groupId
        )
        if (direction === "dragUp") {
          let toIndex = droppedOn.item.index
          if (droppedOn.item.type === "group") {
            const precedingItem = list[droppedOn.position - 1]
            if (precedingItem) {
              toIndex = precedingItem.index + 1
              // special case
              if (precedingItem.type === "group") {
                const precedingItemGroupIndex = groups.findIndex(
                  (g) => g.id === precedingItem.groupId
                )
                const lastIndex =
                  groups[precedingItemGroupIndex].tabs.length - 1
                toIndex =
                  groups[precedingItemGroupIndex].tabs[lastIndex].index + 1
              }
            } else {
              toIndex = 0
            }
          }
          movedGroupTargetIndex = toIndex
          /*
           * when you drag down a group it's a different logic :
           * The index value that we have to send to the browser
           * is the future index ( after move ) of the first item of the moved group.
           * In other words, the browser expects that we ignore all the tabs in the moved group,
           * as if the group was one unique tab.
           */
        } else {
          let toIndex = droppedOn.item.index

          if (droppedOn.item.type === "group") {
            const droppedOnGroupIndex = groups.findIndex(
              (g) => g.id === droppedOn.item.groupId
            )
            const droppedOnGroupTabs = groups[droppedOnGroupIndex].tabs
            // target the index of the last tab of the group
            const lastIndex = droppedOnGroupTabs.length - 1
            toIndex = droppedOnGroupTabs[lastIndex].index
          }
          // As if the group was one unique tab :
          const offset = groups[draggedGroupIndex].tabs.length - 1
          toIndex = toIndex + 1 - offset
          movedGroupTargetIndex = toIndex
        }
      }

      const doBrowserActions = async () => {
        const pinnedTabs = list.filter((t) => t.pinned)
        const lastPinnedTabIndex = pinnedTabs.length - 1

        /* dragging a group */
        if (dragged.item.type === "group") {
          if (direction === "dragUp") {
            await moveGroupAction(dragged.item.groupId, movedGroupTargetIndex!)
          } else {
            await moveGroupAction(dragged.item.groupId, movedGroupTargetIndex!)
          }
        } else if (
          /*
           * moved tab is dragged
           * in an open group first position :
           * we need to update with group-id.
           */
          (!dragged.shouldBeUngrouped &&
            direction === "dragDown" &&
            list[droppedOn.position].type === "group" &&
            list[droppedOn.position + 1] &&
            list[droppedOn.position + 1].groupId !== -1) ||
          (!dragged.shouldBeUngrouped &&
            direction === "dragUp" &&
            list[droppedOn.position - 1].type === "group" &&
            list[droppedOn.position].type === "tab" &&
            list[droppedOn.position].groupId !== -1)
        ) {
          const group = groupItems.find(
            (g) => g.id === list[droppedOn.position].groupId
          )
          /*
           * Our goal is to place the tab at the open group first position.
           * Nonetheless we first update the index, or else Chrome, when dragUp,
           * would place the tab at the open group last position :(
           */
          await updateTabAction(tab.id, tab.windowId, {
            tabIndex: takesIndexFrom.index,
          })
          await updateTabAction(tab.id, tab.windowId, { groupId: group?.id })
          if (tab.pinned) {
            tab.pinned = false
          }
        } else if (tab.pinned && droppedOn.position > lastPinnedTabIndex) {
          // unpin a pinned tab if it has been dropped among unpinned tabs
          await updateTabAction(tab.id, tab.windowId, {
            tabIndex: takesIndexFrom.index,
            shouldBeUngrouped: dragged.shouldBeUngrouped,
            pin: false,
          })
          tab.pinned = false
        } else if (!tab.pinned && droppedOn.position <= lastPinnedTabIndex) {
          // pin an unpinned tab if it has been dropped among pinned tabs
          await updateTabAction(tab.id, tab.windowId, {
            tabIndex: takesIndexFrom.index,
            pin: true,
          })
          tab.pinned = true
        } else {
          await updateTabAction(tab.id, tab.windowId, {
            tabIndex: takesIndexFrom.index,
            shouldBeUngrouped: dragged.shouldBeUngrouped,
          })
        }
        setDragAndDropEnd(null)
      }

      doBrowserActions()

      const { newList, newGroups, removedGroupHeaderPosition } = reorder({
        ...dragAndDropStructure,
        takesIndexFrom: {
          ...dragAndDropStructure.takesIndexFrom,
          movedGroupIndex: movedGroupTargetIndex,
        },
      })

      setGroupItems(newGroups)
      setFuzzyItems(newList)
      setBaseItems(newList)
      window.clickCoordinateY = mouseLocationY
      if (
        removedGroupHeaderPosition !== undefined &&
        droppedOn.position > removedGroupHeaderPosition
      ) {
        setSelectedListIndex(droppedOn.position - 1)
      } else {
        setSelectedListIndex(droppedOn.position)
      }
    }
  }, [dragAndDropEnd])

  const onBeforeDragStart = (start: DragStart) => {
    if (start.source.index !== selectedListIndex) {
      window.clickCoordinateY = mouseLocationYRef.current
      setSelectedListIndex(start.source.index)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    // cancel drag
    if (!result.destination) {
      return
    }
    // cancel drag
    if (result.source.index === result.destination.index) {
      return
    }

    const sourceItem = (fuzzyItems as TabItem[])[result.source.index]
    if (sourceItem && sourceItem.type !== "group") {
      // validate drag
      setDragAndDropEnd(result)
    }

    // all lines below, to avoid dragging a group into another group
    const destinationItem = (fuzzyItems as TabItem[])[result.destination.index]
    const nextToDestinationItem = (fuzzyItems as TabItem[])[
      result.destination.index + 1
    ]
    const destinationItemUncollapsedGroup = groupItems.find(
      (g) => g.id === destinationItem.groupId && !g.collapsed
    )

    // cancel drag
    if (!sourceItem || !destinationItem) {
      return
    }

    // cancel drag
    if (destinationItem.pinned) {
      return
    }

    // cancel drag
    // direction dragDown
    if (result.source.index < result.destination.index) {
      if (
        destinationItemUncollapsedGroup &&
        nextToDestinationItem &&
        nextToDestinationItem.groupId === destinationItem.groupId
      ) {
        return
      }
    } else {
      // direction dragUp
      if (destinationItemUncollapsedGroup && destinationItem.type !== "group") {
        return
      }
    }

    // validate drag
    setDragAndDropEnd(result)
  }

  const props = {
    searchInputRef,
    setItems: setFuzzyItems,
    setBaseItems,
    setGroupItems,
    searchTerms,
    groupItems,
    context,
    rowDisplay,
    selected: selectedListIndex,
    items: fuzzyItems as TabItem[],
    setSelection: setSelectedListIndex,
    setShowEditionTab,
    setClickCoordinateY: (y: number) => {
      window.clickCoordinateY = y
    },
    restoreDefaults,
  }

  return isSearchNotFound || isUserWebSearch ? null : (
    <DragDropContext
      onBeforeDragStart={onBeforeDragStart}
      onDragEnd={onDragEnd}
    >
      <Droppable
        droppableId="droppable"
        mode="virtual"
        renderClone={(provided, snapshot, rubric) => {
          return (
            <TabRow
              provided={provided}
              data={props}
              isDragging={snapshot.isDragging}
              style={provided.draggableProps.style}
              index={rubric.source.index}
            ></TabRow>
          )
        }}
      >
        {(provided) => (
          <List
            ref={listRef}
            className="customScrollBar"
            height={LIST_CONTAINER_HEIGHT}
            overscanCount={5}
            itemCount={fuzzyItems.length}
            itemSize={
              rowDisplay === RowDisplay.MultiLine
                ? MULTILINE_ITEM_SIZE
                : ONELINE_ITEM_SIZE
            }
            width={"100%"}
            outerRef={provided.innerRef}
            itemData={props}
          >
            {getRows(context)}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  )
}
