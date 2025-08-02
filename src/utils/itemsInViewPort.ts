import { useLayoutEffect } from "react"
import { FixedSizeList as List } from "react-window"
import {
  MULTILINE_ITEM_SIZE,
  ONELINE_ITEM_SIZE,
  RowDisplay,
  M_THRESHOLDS,
  O_THRESHOLDS,
  Context,
} from "./constants"
import { logEmit } from "./logEmitter"

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
  showGroupEditionTab: boolean,
  rowDisplay: RowDisplay,
  isWebSearch: boolean,
  context: Context,
  isUserWebSearch: boolean
) {
  const isMultiline = rowDisplay === RowDisplay.MultiLine
  const ITEM_SIZE = isMultiline ? MULTILINE_ITEM_SIZE : ONELINE_ITEM_SIZE
  const thresholds = isMultiline ? M_THRESHOLDS : O_THRESHOLDS
  const visibleCount = isMultiline ? 5 : 12

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const lastItemIndex = list.props.itemCount - 1
    logEmit(
      `in viewPort with selected ${selectedListItem} and window.f ${window.f}, and window.l ${window.l}`
    )
    if (window.clickCoordinateY) {
      logEmit(`click logic with selected ${selectedListItem}`)
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
      logEmit(`viewPort #1 with selected ${selectedListItem}`)
      scrollAndUpdateRange(list, ITEM_SIZE, 0, visibleCount - 1)
    } else if (
      selectedListItem === lastItemIndex &&
      selectedListItem > window.l
    ) {
      logEmit(`vp #2 with selected ${selectedListItem}`)
      const from = lastItemIndex - (visibleCount - 1)
      scrollAndUpdateRange(list, ITEM_SIZE, from, lastItemIndex)
    } else if (selectedListItem > window.l) {
      logEmit(`vp #3 with selected ${selectedListItem}`)
      scrollAndUpdateRange(list, ITEM_SIZE, window.f + 1, window.l + 1)
    } else if (selectedListItem < window.f) {
      logEmit(`vp #4 with selected ${selectedListItem}`)
      scrollAndUpdateRange(list, ITEM_SIZE, window.f - 1, window.l - 1)
    } else {
      // Scrolled within current range: fine-tune scroll
      for (let i = 0; i < visibleCount; i++) {
        if (selectedListItem === window.l - i) {
          logEmit(`vp #5 with selected ${selectedListItem}`)
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
  }, [
    selectedListItem,
    showEditionTab,
    showGroupEditionTab,
    rowDisplay,
    isWebSearch,
    context,
    isUserWebSearch,
  ])
}
