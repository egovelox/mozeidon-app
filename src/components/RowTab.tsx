import { useEffect, useRef, useState } from "react"

import { switchTabAction } from "../actions/actions"
import { toggleCollapseGroup } from "../actions/tabs"
import { TabItem } from "../domain/tabs/models"
import { useSettings } from "../hooks/useSettings"
import { FILE_PREFIX_URL, RowDisplay } from "../utils/constants"
import { clearFaviconCache, getFavicon, setFavicon } from "../utils/faviconCache"
import { SwellUi } from "../utils/ui"
import { Utils } from "../utils/utils"
import { RowProps } from "./RowProps"
import { TextSelector } from "./TextSelector"

export const TabRow = ({ index, style, data, provided, isDragging }: RowProps<TabItem>) => {
  /* Adding style attribute is very important here
    it supplies the row height to the elements. */
  const {
    settings: { appSettings: settings },
  } = useSettings()
  const item = data.items[index]
  const isGroupHeader = item.type === "group"
  const group = data.groupItems.find((g) => item.groupId === g.id)
  const domain = item.domain
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(() => getFavicon(domain))
  const rowDisplay = data.rowDisplay
  const isRowSelected = data.selected === index
  const selectionClassName = (isRowSelected && "sliBox") || "liBox"

  useEffect(() => {
    if (settings.show_favicons) {
      //const url = `https://icons.duckduckgo.com/ip3/${domain}.ico`
      const url = item.url.startsWith(FILE_PREFIX_URL)
        ? FILE_PREFIX_URL
        : domain && `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
      setFaviconUrl(url)
      setFavicon(domain, url)
    } else {
      clearFaviconCache()
    }
  }, [domain])

  const title = data.items.map(({ title }) => title)[index]
  const shortDomain = data.items.map(({ domain }) => domain)[index].replace("www.", "")
  const url = data.items.map(({ url }) => url)[index]

  /*
   * Because we use onClick to adjust the item in the list
   * ( cf data.setClickCoordinateY )
   * and because we use onDoubleClick to take an action
   * we need a timeout to not fire onClick before
   * we know that onDoubleClick is not fired.
   * This is our solution to prevent a double-click on an item
   * from firing the onDoubleClick on an other item
   * ( it happens when the first item is adjusted in the list,
   * and because of this adjustment, is not under the user cursor anymore )
   */
  const clickTimeout = useRef<number | null>(null)

  const handleClick = (e: React.MouseEvent) => {
    //e.stopPropagation()
    clickTimeout.current = window.setTimeout(() => {
      /*
       * reset focus on the searchIntput
       * to avoid a potential focus on a vertical-bar item
       * because vertical-bar items can be rendered or not
       * depending on the type of row (group or tab) you clicked.
       */
      data.searchInputRef.current?.focus()
      data.setClickCoordinateY(e.pageY)
      data.setSelection(index)
    }, 25)
  }

  const handleToggleCollapseGroup = async () => {
    const { newList, newGroups } = await toggleCollapseGroup({
      profile: data.currentProfile,
      listIndex: index,
      groupId: item.groupId,
      list: data.items,
      groups: data.groupItems,
    })
    data.setItems(newList)
    data.setBaseItems(newList)
    data.setGroupItems(newGroups)
    Utils.focusSearchInput()
  }

  const handleGroupClick = async (e: React.MouseEvent) => {
    data.setClickCoordinateY(e.pageY)
    data.setSelection(index)
    if (data.searchTerms.length === 0) {
      await handleToggleCollapseGroup()
    }
  }

  const handleDoubleClick = async () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    }
    await switchTabAction(data.currentProfile, `${item.windowId}:${item.id}`)
    data.restoreDefaults()
    await SwellUi.hide()
  }
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
      }
    }
  }, [])

  return !isGroupHeader ? (
    <div
      {...provided?.draggableProps}
      {...{
        ...provided?.dragHandleProps,
        tabIndex: -1,
      }}
      ref={provided?.innerRef}
      style={{ ...style, ...provided?.draggableProps.style }}
      onClick={handleClick}
      className={``}
    >
      {rowDisplay === RowDisplay.MultiLine ? (
        <div
          className={`${selectionClassName} ${isDragging ? "isDragging" : ""}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <TextSelector
            group={group}
            faviconUrl={faviconUrl}
            className="liFirstLine"
            content={title || "no title"}
            isRowSelected={isRowSelected}
            pinned={item.pinned}
          />
          <TextSelector className="liLineSmallFont" content={url} isRowSelected={isRowSelected} />
          <TextSelector className="liLine" content={shortDomain || "local tab"} isRowSelected={isRowSelected} />
        </div>
      ) : (
        <div
          className={`${selectionClassName} ${isDragging ? "isDragging" : ""}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <TextSelector
            group={group}
            faviconUrl={faviconUrl}
            className={`liFirstLineSmall`}
            content={title || "no title"}
            isRowSelected={isRowSelected}
            pinned={item.pinned}
          />
        </div>
      )}
    </div>
  ) : (
    <div
      {...provided?.draggableProps}
      {...{
        ...provided?.dragHandleProps,
        tabIndex: -1,
      }}
      ref={provided?.innerRef}
      style={{ ...style, ...provided?.draggableProps.style }}
      onClick={handleGroupClick}
      className={``}
    >
      {rowDisplay === RowDisplay.MultiLine ? (
        <div className={`${selectionClassName} ${isDragging ? "isDragging" : ""}`} style={{ cursor: "default" }}>
          <TextSelector
            group={group}
            isGroupHeader
            className="liFirstLine"
            content={group?.title ?? ""}
            isRowSelected={isRowSelected}
            pinned={item.pinned}
          />
          <TextSelector isGroupHeader className="liLineSmallFont" content={"Tab group"} isRowSelected={isRowSelected} />
          <TextSelector
            isGroupHeader
            className="liLine"
            content={`${(group?.tabs.length ?? 1) - 1} tabs`}
            isRowSelected={isRowSelected}
          />
        </div>
      ) : (
        <div className={`${selectionClassName} ${isDragging ? "isDragging" : ""}`} style={{ cursor: "default" }}>
          <TextSelector
            group={group}
            isGroupHeader
            className={`liFirstLineSmall`}
            content={title}
            isRowSelected={isRowSelected}
          />
        </div>
      )}
    </div>
  )
}
