import { Draggable } from "react-beautiful-dnd"
import { TabItem } from "../domain/tabs/models"
import { Context } from "../utils/constants"
import { RowProps } from "./RowProps"
import { TabRow } from "./RowTab"
import { BookmarkRow } from "./RowBookmark"
import { HistoryRow } from "./RowHistory"
import { Item } from "../domain/ItemModel"

export function getRows(context: Context) {
  switch (context) {
    case Context.None:
    case Context.Settings:
    case Context.Tabs:
      return ({ index, style, data, isDragging }: RowProps<Item>) => {
        const item = data.items[index] as TabItem
        return (
          <Draggable
            isDragDisabled={
              // disable drag group when group is not collapsed
              (item.type === "group" &&
                !data.groupItems.some(
                  (g) => g.id === item.groupId && g.collapsed
                )) ||
              // disable drag during search
              data.searchTerms.length !== 0
            }
            draggableId={`${item.id}`}
            index={index}
          >
            {(provided) => (
              <TabRow
                provided={provided}
                index={index}
                style={style}
                data={{ ...data, items: data.items as TabItem[] }}
                isDragging={isDragging}
              />
            )}
          </Draggable>
        )
      }
    case Context.RecentlyClosed:
      return TabRow as ({ index, style, data }: RowProps<Item>) => JSX.Element
    case Context.Bookmarks:
      return BookmarkRow as ({
        index,
        style,
        data,
      }: RowProps<Item>) => JSX.Element
    case Context.History:
      return HistoryRow as ({
        index,
        style,
        data,
      }: RowProps<Item>) => JSX.Element
  }
}
