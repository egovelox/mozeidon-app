import fuzzysort from "fuzzysort"
import { HistoryItem } from "../domain/history/models"
import { BookmarkItem } from "../domain/bookmarks/models"
import { TabItem } from "../domain/tabs/models"
import { Context } from "./constants"

/* TODO Try to improve typing */
type Items = Array<TabItem> | Array<BookmarkItem> | Array<HistoryItem>
type Item = Items[keyof Items]

export enum SearchType {
  Fuzzy = "fuzzy",
  Exact = "exact",
}

const TAB_KEYS: Array<keyof TabItem> = ["url", "title", "domain"]
const BOOKMARK_KEYS: Array<keyof BookmarkItem> = ["url", "title", "parent"]
const HISTORY_KEYS: Array<keyof HistoryItem> = ["url", "title"]

export function handleSearch(
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>,
  searchType: SearchType,
  searchTerms: string,
  context: Context,
  items: Items
) {
  const res = getSearchResults<Item>(
    searchType,
    searchTerms.trim(),
    items,
    getKeys(context)
  )
  setFuzzyItems(res as Items)
}

export function toggleSearchType(searchType: SearchType): SearchType {
  return searchType === SearchType.Exact ? SearchType.Fuzzy : SearchType.Exact
}

function getSearchResults<T extends Item>(
  searchType: SearchType,
  searchTerms: string,
  items: Array<T>,
  itemKeys: typeof TAB_KEYS | typeof BOOKMARK_KEYS | typeof HISTORY_KEYS
) {
  switch (searchType) {
    case SearchType.Fuzzy:
      return fuzzysort
        .go(searchTerms, items, { keys: itemKeys, threshold: 0 })
        .map((i) => i.obj)
    case SearchType.Exact:
      return items.filter((item) => {
        let exactMatch = false
        for (const k of itemKeys) {
          /* TODO improve typing */
          if (
            (item[k as keyof T] as string)
              .toLowerCase()
              .includes(searchTerms.toLowerCase())
          ) {
            exactMatch = true
            break
          }
        }
        return exactMatch
      })
  }
}

function getKeys(context: Context) {
  switch (context) {
    case Context.None:
    case Context.Settings:
    case Context.Tabs:
    case Context.RecentlyClosed:
      return TAB_KEYS
    case Context.History:
      return HISTORY_KEYS
    case Context.Bookmarks:
      return BOOKMARK_KEYS
  }
}
