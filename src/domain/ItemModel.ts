import { BookmarkItem } from "./bookmarks/models"
import { HistoryItem } from "./history/models"
import { TabItem } from "./tabs/models"

export type Items = BookmarkItem[] | TabItem[] | HistoryItem[]
export type Item = BookmarkItem | TabItem | HistoryItem
