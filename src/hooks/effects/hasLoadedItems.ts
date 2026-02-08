import { useEffect } from "react"
import { FixedSizeList as List } from "react-window"

import { Items } from "../../domain/ItemModel"
import { ProfileItem } from "../../domain/profiles/models"
import { GroupItem, TabItem, Window } from "../../domain/tabs/models"
import { Context, RowDisplay } from "../../utils/constants"
import { getLastVisitedTabIndex } from "../../utils/getOrderedTabs"
import { setLastVisitedPosition } from "./setLastVisitedPosition"

export const didLoadItemsEffect = (
  listRef: React.RefObject<List<any>>,
  currentProfile: ProfileItem | undefined,
  currentWindow: Window | undefined,
  list: TabItem[],
  groups: GroupItem[],
  context: Context,
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>,
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>,
  setBaseItems: React.Dispatch<React.SetStateAction<Items>>,
  setGroupItems: React.Dispatch<React.SetStateAction<GroupItem[]>>,
  rowDisplay: RowDisplay,
  isLoading: boolean
) => {
  return useEffect(() => {
    if (isLoading || context !== Context.Tabs) {
      return
    }
    if (!listRef.current || !currentWindow) return
    const setPositionOnLastAccessedTab = async () => {
      const { index, changes } = await getLastVisitedTabIndex(currentProfile, list, groups)
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
