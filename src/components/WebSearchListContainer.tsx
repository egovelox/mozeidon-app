import React from "react"
import { FixedSizeList as List } from "react-window"
import { useSettings } from "../hooks/useSettings"
import {
  RowDisplay,
  LIST_CONTAINER_HEIGHT,
  MULTILINE_ITEM_SIZE,
  ONELINE_ITEM_SIZE,
} from "../utils/constants"
import { WebSearchRow } from "./WebSearchRow"

type WebSearchListContainerProps = {
  rowDisplay: RowDisplay
  selectedWebSearchListIndex: number
  searchTerms: string
  setSelectedWebSearchListIndex: React.Dispatch<React.SetStateAction<number>>
  listRef: React.RefObject<List>
}

export const WebSearchListContainer = ({
  rowDisplay,
  selectedWebSearchListIndex,
  searchTerms,
  setSelectedWebSearchListIndex,
  listRef,
}: WebSearchListContainerProps) => {
  const {
    settings: { web_search_engine_urls },
  } = useSettings()

  return (
    <List
      ref={listRef}
      className="customScrollBar"
      height={LIST_CONTAINER_HEIGHT}
      overscanCount={20}
      itemCount={web_search_engine_urls.length}
      itemSize={
        rowDisplay === RowDisplay.MultiLine
          ? MULTILINE_ITEM_SIZE
          : ONELINE_ITEM_SIZE
      }
      width={"100%"}
      itemData={{
        rowDisplay,
        selected: selectedWebSearchListIndex,
        items: web_search_engine_urls,
        searchTerms,
        setSelection: setSelectedWebSearchListIndex,
        setClickCoordinateY: (y: number) => {
          window.clickCoordinateY = y
        },
      }}
    >
      {WebSearchRow}
    </List>
  )
}
