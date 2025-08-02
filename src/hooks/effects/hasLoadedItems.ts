import { FixedSizeList as List } from "react-window"
import { Context, RowDisplay } from "../../utils/constants"
import { useEffect } from "react"
import { getLastVisitedTabIndex } from "../../utils/getOrderedTabs"
import { GroupItem, TabItem } from "../../domain/tabs/models"
import { setLastVisitedPosition } from "./setLastVisitedPosition"
import { Items } from "../../domain/ItemModel"

export const didLoadItemsEffect = (
  listRef: React.RefObject<List<any>>,
  list: TabItem[],
  groups: GroupItem[],
  context: Context,
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>,
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>,
  setBaseItems: React.Dispatch<React.SetStateAction<Items>>,
  setGroupItems: React.Dispatch<React.SetStateAction<GroupItem[]>>,
  rowDisplay: RowDisplay,
  { isLoading }: { isLoading: boolean }
) => {
  return useEffect(() => {
    if (isLoading || context !== Context.Tabs) return
    if (!listRef.current) return
    const setPositionOnLastAccessedTab = async () => {
      const { index, changes } = await getLastVisitedTabIndex(list, groups)
      if (!changes) {
        setLastVisitedPosition(index, setSelectedListIndex, rowDisplay, listRef)
      } else {
        const { newList, newGroups } = changes
        setFuzzyItems(newList)
        setBaseItems(newList)
        setGroupItems(newGroups)
        setLastVisitedPosition(index, setSelectedListIndex, rowDisplay, listRef)
      }
    }

    setPositionOnLastAccessedTab()
  }, [isLoading])
}
