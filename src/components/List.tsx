import { BookmarkItem } from "../domain/bookmarks/models"
import { TabItem } from "../domain/tabs/models"
import {
  Context,
  LIST_CONTAINER_HEIGHT,
  MULTILINE_ITEM_SIZE,
  ONELINE_ITEM_SIZE,
  RowDisplay,
} from "../utils/constants"
import { FixedSizeList as List } from "react-window"
import { getRows } from "./Row"
import { HistoryItem } from "../domain/history/models"

type ListContainerProps = {
  rowDisplay: RowDisplay
  closedItems: string[]
  selectedListIndex: number
  fuzzyItems: BookmarkItem[] | TabItem[] | HistoryItem[]
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>
  setShowEditionTab: React.Dispatch<React.SetStateAction<boolean>>
  setClosedItems: React.Dispatch<React.SetStateAction<string[]>>
  context: Context
  listRef: React.RefObject<List>
  restoreDefaults: () => void
}

export function ListContainer({
  rowDisplay,
  closedItems,
  selectedListIndex,
  fuzzyItems,
  setSelectedListIndex,
  setShowEditionTab,
  setClosedItems,
  context,
  listRef,
  restoreDefaults,
}: ListContainerProps) {
  return (
    <List
      ref={listRef}
      className="customScrollBar"
      height={LIST_CONTAINER_HEIGHT}
      overscanCount={20}
      itemCount={fuzzyItems.length}
      itemSize={
        rowDisplay === RowDisplay.MultiLine
          ? MULTILINE_ITEM_SIZE
          : ONELINE_ITEM_SIZE
      }
      width={"100%"}
      itemData={{
        context,
        rowDisplay,
        closedItems,
        selected: selectedListIndex,
        items: fuzzyItems,
        setSelection: setSelectedListIndex,
        setShowEditionTab,
        setClosedItems,
        setClickCoordinateY: (y: number) => {
          window.clickCoordinateY = y
        },
        restoreDefaults,
      }}
    >
      {getRows(context)}
    </List>
  )
}
