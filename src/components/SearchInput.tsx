import { forwardRef, useEffect, useState } from "react"
import { useDebounce } from "use-debounce"

import { Items } from "../domain/ItemModel"
import { ProfileItem } from "../domain/profiles/models"
import { GroupItem, TabItem } from "../domain/tabs/models"
import { setLastVisitedPosition } from "../hooks/effects/setLastVisitedPosition"
import { Context, RowDisplay } from "../utils/constants"
import { getLastVisitedTabIndex } from "../utils/getOrderedTabs"
import { handleSearch, SearchType } from "../utils/searchHandler"

interface SearchInputProps {
  value: string
  currentProfile: ProfileItem | undefined
  onChange: React.ChangeEventHandler<HTMLInputElement>
  searchTerms: string
  searchType: SearchType
  context: Context
  rowDisplay: RowDisplay
  baseItems: Items
  fuzzyItems: Items
  groupItems: GroupItem[]
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>
  selectedListIndex: number
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>
  setIsSearchNotFound: React.Dispatch<React.SetStateAction<boolean>>
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      currentProfile,
      onChange,
      searchTerms,
      searchType,
      context,
      rowDisplay,
      baseItems,
      fuzzyItems,
      groupItems,
      setFuzzyItems,
      setSelectedListIndex,
      setIsSearchNotFound,
    }: SearchInputProps,
    ref
  ) => {
    const [debouncedSearch] = useDebounce(searchTerms, 200)
    const [wasSearched, setWasSearched] = useState(false)

    useEffect(() => {
      const run = async () => {
        let searchMatchCount = fuzzyItems.length
        /* when the user types in, process search */
        if (debouncedSearch !== "") {
          setWasSearched(true)
          setSelectedListIndex(0)
          searchMatchCount = handleSearch(setFuzzyItems, searchType, searchTerms, context, baseItems, groupItems)
        } else {
          if (context === Context.Tabs) {
            setFuzzyItems(baseItems)
            if (wasSearched) {
              /* reset the selected list index to the last visited tab */
              const { index } = await getLastVisitedTabIndex(currentProfile, baseItems as TabItem[], groupItems)
              setLastVisitedPosition(index, setSelectedListIndex, rowDisplay)
            }
          } else {
            setFuzzyItems(baseItems)
          }
        }
        /* when the processed search returned no match */
        if (searchMatchCount === 0 && debouncedSearch !== "") {
          // this will switch to the web-search
          setIsSearchNotFound(true)
        } else {
          setIsSearchNotFound(false)
        }
      }
      run()
    }, [debouncedSearch])
    return (
      <input
        ref={ref}
        className="row"
        id="searchInput"
        autoComplete="off"
        autoCorrect="off"
        value={value}
        onChange={onChange}
      />
    )
  }
)
