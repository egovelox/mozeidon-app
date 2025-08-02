import { useLayoutEffect } from "react"
import { FixedSizeList as List } from "react-window"
import {
  MULTILINE_ITEM_SIZE,
  ONELINE_ITEM_SIZE,
  RowDisplay,
  M_THRESHOLDS,
  O_THRESHOLDS,
} from "./constants"

const scrollAndUpdateRange = (
  list: List<any>,
  itemSize: number,
  from: number,
  to: number
) => {
  window.f = from
  window.l = to
  list.scrollTo(itemSize * from)
  window.clickCoordinateY = 0
}

export function useListNavigation(
  listRef: React.RefObject<List<any>>,
  selectedListItem: number,
  showEditionTab: boolean,
  rowDisplay: RowDisplay,
  closedItems: unknown[]
) {
  const isMultiline = rowDisplay === RowDisplay.MultiLine
  const ITEM_SIZE = isMultiline ? MULTILINE_ITEM_SIZE : ONELINE_ITEM_SIZE
  const thresholds = isMultiline ? M_THRESHOLDS : O_THRESHOLDS
  const visibleCount = isMultiline ? 4 : 11

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const lastItemIndex = list.props.itemCount - 1

    if (window.clickCoordinateY) {
      for (const [i, threshold] of thresholds.entries()) {
        if (window.clickCoordinateY < threshold) {
          const from = selectedListItem - i
          const to = selectedListItem + (visibleCount - i - 1)
          scrollAndUpdateRange(list, ITEM_SIZE, from, to)
          return
        }
      }
      // Else: clicked far down
      const from = selectedListItem - visibleCount + 1
      const to = selectedListItem
      scrollAndUpdateRange(list, ITEM_SIZE, from, to)
      return
    }

    // Navigation by keyboard (not by click)
    if (selectedListItem === 0 && selectedListItem < window.f) {
      scrollAndUpdateRange(list, ITEM_SIZE, 0, visibleCount - 1)
    } else if (
      selectedListItem === lastItemIndex &&
      selectedListItem > window.l
    ) {
      const from = lastItemIndex - (visibleCount - 1)
      scrollAndUpdateRange(list, ITEM_SIZE, from, lastItemIndex)
    } else if (selectedListItem > window.l) {
      scrollAndUpdateRange(list, ITEM_SIZE, window.f + 1, window.l + 1)
    } else if (selectedListItem < window.f) {
      scrollAndUpdateRange(list, ITEM_SIZE, window.f - 1, window.l - 1)
    } else {
      // Scrolled within current range: fine-tune scroll
      for (let i = 0; i < visibleCount; i++) {
        if (selectedListItem === window.l - i) {
          scrollAndUpdateRange(
            list,
            ITEM_SIZE,
            selectedListItem - (visibleCount - i - 1),
            selectedListItem + i
          )
          return
        }
      }
    }
  }, [selectedListItem, showEditionTab, rowDisplay, closedItems])
}
