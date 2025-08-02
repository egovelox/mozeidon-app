import { forwardRef, useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { Items } from "../domain/ItemModel"
import { handleSearch, SearchType } from "../utils/searchHandler"
import { Context, RowDisplay } from "../utils/constants"
import { logEmit } from "../utils/logEmitter"
import { GroupItem, TabItem } from "../domain/tabs/models"
import { getLastVisitedTabIndex } from "../utils/getOrderedTabs"
import { setLastVisitedPosition } from "../hooks/effects/setLastVisitedPosition"

interface SearchInputProps {
  value: string
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
      onChange,
      searchTerms,
      searchType,
      context,
      rowDisplay,
      baseItems,
      fuzzyItems,
      groupItems,
      setFuzzyItems,
      selectedListIndex,
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
          searchMatchCount = handleSearch(
            setFuzzyItems,
            searchType,
            searchTerms,
            context,
            baseItems,
            groupItems
          )
        } else {
          if (context === Context.Tabs) {
            logEmit(`List component with selected: ${selectedListIndex}`)
            setFuzzyItems(baseItems)
            if (wasSearched) {
              /* reset the selected list index to the last visited tab */
              const { index } = await getLastVisitedTabIndex(
                baseItems as TabItem[],
                groupItems
              )
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
