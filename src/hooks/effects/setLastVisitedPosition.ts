import { FixedSizeList as List } from "react-window"

import { RowDisplay } from "../../utils/constants"

export const setLastVisitedPosition = (
  i: number,
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>,
  rowDisplay: RowDisplay,
  listRef?: React.RefObject<List<any>>
) => {
  setSelectedListIndex(i)

  if (rowDisplay === RowDisplay.OneLine) {
    if (listRef && listRef.current) {
      listRef.current.scrollToItem(i + 5)
    }
    window.f = i - 5
    window.l = i + 5
  }

  if (rowDisplay === RowDisplay.MultiLine) {
    if (listRef && listRef.current) {
      listRef.current.scrollToItem(i + 1)
    }
    window.f = i - 1
    window.l = i + 2
  }
}
