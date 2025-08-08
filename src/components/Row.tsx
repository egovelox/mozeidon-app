import { useEffect, useRef, useState } from "react"
import { BookmarkItem } from "../domain/bookmarks/models"
import { TabItem } from "../domain/tabs/models"
import { Context, FILE_PREFIX_URL, RowDisplay } from "../utils/constants"
import { countUpperCaseOrNumberChars } from "../utils/strings"
import { TextSelector } from "./TextSelector"
import {
  clearFaviconCache,
  getFavicon,
  setFavicon,
} from "../utils/faviconCache"
import { useSettings } from "../hooks/useSettings"
import {
  closeTabAction,
  copyUrlToClipboard,
  deleteBookmarkAction,
  openURLAction,
  switchTabAction,
} from "../actions/actions"
import { useNotification } from "../hooks/useUserNotification"
import { HistoryItem } from "../domain/history/models"
import { invoke } from "@tauri-apps/api/core"

type Item = TabItem | BookmarkItem | HistoryItem
export interface RowProps<T> {
  index: number
  style?: React.CSSProperties
  data: {
    items: T[]
    context: Context
    closedItems: string[]
    selected: number
    setSelection: (i: number) => void
    setClickCoordinateY: (y: number) => void
    setShowEditionTab: (v: boolean) => void
    setClosedItems: (i: string[]) => void
    rowDisplay: RowDisplay
    restoreDefaults: () => void
  }
}

export function getRows(context: Context) {
  switch (context) {
    case Context.None:
    case Context.Settings:
    case Context.Tabs:
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

export const HistoryRow = ({ index, style, data }: RowProps<HistoryItem>) => {
  /* Adding style attribute is very important here
    it supplies the row height to the elements. */
  const {
    settings: { appSettings: settings },
  } = useSettings()
  const { notify } = useNotification()
  const isRowSelected = data.selected === index
  const rowDisplay = data.rowDisplay
  const item = data.items[index]
  let domain = ""
  const isRowClosedItem = data.closedItems.includes(item.id)
  const selectionClassName = (isRowSelected && "sliBox") || "liBox"
  const closedClassName = (isRowClosedItem && "closedItemBox") || ""
  try {
    domain = new URL(item.url).hostname
  } catch {}

  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(() =>
    getFavicon(domain)
  )

  useEffect(() => {
    /*
     * When unmounting the row, put the focus back on the searchInput.
     * This is particulary necessary due to conditional rendering of row-buttons :
     * when the user puts focus (e.g with tab) on a row button
     * but then takes no action on this row button, instead just selects another row up or down.
     * Had we not put the focus back on searchInput, focus would be kept on the row button,
     * which is not displayed anymore since the user selected another row up or down.
     */
    return () => {
      document.getElementById("searchInput")?.focus()
    }
  }, [data.selected])

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

  const handleOnEditButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    data.setShowEditionTab(true)
  }
  const handleOnCopyUrlButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await copyUrlToClipboard(item.url)
    data.setClosedItems([...data.closedItems])
    notify("Url copied !")
    document.getElementById("searchInput")?.focus()
  }
  const handleOnKeyDownButton = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.stopPropagation()
  }
  const url = data.items.map(({ url }) => url)[index]
  const title = data.items.map(({ title }) => title)[index]
  const visitCount = data.items.map(({ vc }) => vc)[index]
  const lastVisit = new Date(data.items.map(({ t }) => t)[index])
  const lastVisitLocalDate = lastVisit.toLocaleDateString(
    settings.date_locale || undefined
  )
  const lastVisitLocalTime = lastVisit.toLocaleTimeString(
    settings.date_locale || undefined
  )

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
    clickTimeout.current = window.setTimeout(() => {
      data.setClickCoordinateY(e.pageY)
      data.setSelection(index)
    }, 250)
  }

  const handleDoubleClick = async () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    }
    openURLAction(item.url, settings.web_browser)
    data.restoreDefaults()
    await invoke("hide")
  }
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
      }
    }
  }, [])

  return (
    <div style={style} onClick={handleClick}>
      {rowDisplay === RowDisplay.MultiLine ? (
        <div
          className={`${selectionClassName} ${closedClassName}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="rowWithButtons">
            <TextSelector
              faviconUrl={faviconUrl}
              className="liFirstLine"
              content={title}
              maxLength={countUpperCaseOrNumberChars(title) < 20 ? 80 : 70}
              isRowSelected={isRowSelected}
            />
            {isRowSelected && !isRowClosedItem && (
              <div className="rowButtonsContainer">
                <button
                  className="rowButton"
                  id="editBookmark"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnEditButtonClick}
                >
                  &#x2605;
                </button>
                <button
                  className="rowButton"
                  id="copyUrl"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCopyUrlButtonClick}
                >
                  &#x2750;
                </button>
              </div>
            )}
          </div>
          <TextSelector
            className="liLine"
            content={url}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
          <TextSelector
            className="liLine"
            content={`${lastVisitLocalDate}  ${lastVisitLocalTime} • visited ${visitCount} time${visitCount > 1 ? "s" : ""}`}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
        </div>
      ) : (
        <div
          className={`${selectionClassName}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="rowWithButtons">
            <TextSelector
              faviconUrl={faviconUrl}
              className={`liFirstLineSmall ${closedClassName}`}
              content={`${lastVisitLocalDate}  ${lastVisitLocalTime} • ${title}`}
              maxLength={
                countUpperCaseOrNumberChars(parent + title) < 12 ? 90 : 80
              }
              isRowSelected={isRowSelected}
            />
            {isRowSelected && !isRowClosedItem && (
              <div className="rowButtonsContainer">
                <button
                  className="rowButton"
                  id="editBookmark"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnEditButtonClick}
                >
                  &#x2605;
                </button>
                <button
                  className="rowButton"
                  id="copyUrl"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCopyUrlButtonClick}
                >
                  &#x2750;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export const BookmarkRow = ({ index, style, data }: RowProps<BookmarkItem>) => {
  /* Adding style attribute is very important here
    it supplies the row height to the elements. */
  const {
    settings: { appSettings: settings },
  } = useSettings()
  const { notify } = useNotification()
  const isRowSelected = data.selected === index
  const rowDisplay = data.rowDisplay
  const item = data.items[index]
  let domain = ""
  const isRowClosedItem = data.closedItems.includes(item.id)
  const selectionClassName = (isRowSelected && "sliBox") || "liBox"
  const closedClassName = (isRowClosedItem && "closedItemBox") || ""
  try {
    domain = new URL(item.url).hostname
  } catch {}

  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(() =>
    getFavicon(domain)
  )

  useEffect(() => {
    /*
     * When unmounting the row, put the focus back on the searchInput.
     * This is particulary necessary due to conditional rendering of row-buttons :
     * when the user puts focus (e.g with tab) on a row button
     * but then takes no action on this row button, instead just selects another row up or down.
     * Had we not put the focus back on searchInput, focus would be kept on the row button,
     * which is not displayed anymore since the user selected another row up or down.
     */
    return () => {
      document.getElementById("searchInput")?.focus()
    }
  }, [data.selected])

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

  const handleOnEditButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    data.setShowEditionTab(true)
  }
  const handleOnCopyUrlButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await copyUrlToClipboard(item.url)
    data.setClosedItems([...data.closedItems])
    notify("Url copied !")
    document.getElementById("searchInput")?.focus()
  }
  const handleOnCloseButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isRowClosedItem) return
    await deleteBookmarkAction(item.id)
    data.setClosedItems([...data.closedItems, item.id])
    notify("Bookmark deleted !")
    document.getElementById("searchInput")?.focus()
  }
  const handleOnKeyDownButton = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.stopPropagation()
  }
  const url = data.items.map(({ url }) => url)[index]
  const title = data.items.map(({ title }) => title)[index]
  const parent = data.items.map(({ parent }) => parent)[index]

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
    clickTimeout.current = window.setTimeout(() => {
      data.setClickCoordinateY(e.pageY)
      data.setSelection(index)
    }, 250)
  }

  const handleDoubleClick = async () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    }
    openURLAction(item.url, settings.web_browser)
    data.restoreDefaults()
    await invoke("hide")
  }
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
      }
    }
  }, [])

  return (
    <div style={style} onClick={handleClick}>
      {rowDisplay === RowDisplay.MultiLine ? (
        <div
          className={`${selectionClassName} ${closedClassName}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="rowWithButtons">
            <TextSelector
              faviconUrl={faviconUrl}
              className="liFirstLine"
              content={title}
              maxLength={countUpperCaseOrNumberChars(title) < 20 ? 90 : 80}
              isRowSelected={isRowSelected}
            />
            {isRowSelected && !isRowClosedItem && (
              <div className="rowButtonsContainer">
                <button
                  className="rowButton"
                  id="editBookmark"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnEditButtonClick}
                >
                  &#x2605;
                </button>
                <button
                  className="rowButton"
                  id="copyUrl"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCopyUrlButtonClick}
                >
                  &#x2750;
                </button>
                <button
                  className="rowButton"
                  id="removeItem"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCloseButtonClick}
                >
                  &#x2718;
                </button>
              </div>
            )}
          </div>
          <TextSelector
            className="liLine"
            content={url}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
          <TextSelector
            className="liLine"
            content={parent}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
        </div>
      ) : (
        <div
          className={`${selectionClassName}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="rowWithButtons">
            <TextSelector
              faviconUrl={faviconUrl}
              className={`liFirstLineSmall ${closedClassName}`}
              content={parent + " • " + title}
              maxLength={
                countUpperCaseOrNumberChars(parent + title) < 12 ? 90 : 80
              }
              isRowSelected={isRowSelected}
            />
            {isRowSelected && !isRowClosedItem && (
              <div className="rowButtonsContainer">
                <button
                  className="rowButton"
                  id="editBookmark"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnEditButtonClick}
                >
                  &#x2605;
                </button>
                <button
                  className="rowButton"
                  id="copyUrl"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCopyUrlButtonClick}
                >
                  &#x2750;
                </button>
                <button
                  className="rowButton"
                  id="removeItem"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCloseButtonClick}
                >
                  &#x2718;
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
export const TabRow = ({ index, style, data }: RowProps<TabItem>) => {
  /* Adding style attribute is very important here
    it supplies the row height to the elements. */
  const {
    settings: { appSettings: settings },
  } = useSettings()
  const { notify } = useNotification()
  const item = data.items[index]
  const domain = item.domain
  const isRecentlyClosedContext = data.context === Context.RecentlyClosed
  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(() =>
    getFavicon(domain)
  )
  const rowDisplay = data.rowDisplay
  const isRowSelected = data.selected === index
  const isRowClosedItem = data.closedItems.includes(
    `${item.windowId}:${item.id}`
  )
  const selectionClassName = (isRowSelected && "sliBox") || "liBox"
  const closedClassName = (isRowClosedItem && "closedItemBox") || ""

  useEffect(() => {
    /*
     * When unmounting the selected row,
     * put the focus back on the searchInput.
     * This is particulary necessary due to conditional rendering
     * of row-buttons on the selected row :
     * when the user puts focus (e.g with tab) on a row-button
     * but then takes no action on this row button, instead just selects another row up or down.
     * Had we not put the focus back on searchInput, focus would be kept on the row-button,
     * which is not displayed anymore since the user selected another row up or down.
     */
    return () => {
      document.getElementById("searchInput")?.focus()
    }
  }, [data.selected])

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
  const shortDomain = data.items
    .map(({ domain }) => domain)
    [index].replace("www.", "")
  const url = data.items.map(({ url }) => url)[index]

  const handleOnEditButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    data.setShowEditionTab(true)
  }
  const handleOnCopyUrlButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await copyUrlToClipboard(item.url)
    notify("Url copied !")
    document.getElementById("searchInput")?.focus()
  }
  const handleOnCloseButtonClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    const actionId = `${item.windowId}:${item.id}`
    if (data.closedItems.includes(actionId)) return
    await closeTabAction(actionId)
    data.setClosedItems([...data.closedItems, actionId])
    notify("Tab closed !")
    document.getElementById("searchInput")?.focus()
  }
  const handleOnKeyDownButton = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.stopPropagation()
  }

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
    clickTimeout.current = window.setTimeout(() => {
      data.setClickCoordinateY(e.pageY)
      data.setSelection(index)
    }, 250)
  }

  const handleDoubleClick = async () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    }
    await switchTabAction(`${item.windowId}:${item.id}`, settings.web_browser)
    data.restoreDefaults()
    await invoke("hide")
  }
  useEffect(() => {
    return () => {
      if (clickTimeout.current) {
        clearTimeout(clickTimeout.current)
      }
    }
  }, [])

  return (
    <div style={style} onClick={handleClick}>
      {rowDisplay === RowDisplay.MultiLine ? (
        <div
          className={`${selectionClassName} ${closedClassName}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="rowWithButtons">
            <TextSelector
              faviconUrl={faviconUrl}
              className="liFirstLine"
              content={title}
              maxLength={countUpperCaseOrNumberChars(title) < 20 ? 80 : 70}
              isRowSelected={isRowSelected}
            />
            {isRowSelected && !isRowClosedItem && (
              <div className="rowButtonsContainer">
                <button
                  className="rowButton"
                  id="editBookmark"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnEditButtonClick}
                >
                  &#x2605;
                </button>
                <button
                  className="rowButton"
                  id="copyUrl"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCopyUrlButtonClick}
                >
                  &#x2750;
                </button>
                {!isRecentlyClosedContext && (
                  <button
                    className="rowButton"
                    id="removeItem"
                    onKeyDown={handleOnKeyDownButton}
                    onClick={handleOnCloseButtonClick}
                  >
                    &#x2718;
                  </button>
                )}
              </div>
            )}
          </div>
          <TextSelector
            className="liLine"
            content={shortDomain || "local tab"}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
          <TextSelector
            className="liLine"
            content={url}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
        </div>
      ) : (
        <div
          className={`${selectionClassName}`}
          style={{ cursor: "default" }}
          onDoubleClick={handleDoubleClick}
        >
          <div className="rowWithButtons">
            <TextSelector
              faviconUrl={faviconUrl}
              className={`liFirstLineSmall ${closedClassName}`}
              content={(shortDomain && `${shortDomain} • `) + title}
              maxLength={
                countUpperCaseOrNumberChars(shortDomain + title) < 12 ? 90 : 80
              }
              isRowSelected={isRowSelected}
            />
            {isRowSelected && !isRowClosedItem && (
              <div className="rowButtonsContainer">
                <button
                  className="rowButton"
                  id="editBookmark"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnEditButtonClick}
                >
                  &#x2605;
                </button>
                <button
                  className="rowButton"
                  id="copyUrl"
                  onKeyDown={handleOnKeyDownButton}
                  onClick={handleOnCopyUrlButtonClick}
                >
                  &#x2750;
                </button>
                {!isRecentlyClosedContext && (
                  <button
                    className="rowButton"
                    id="removeItem"
                    onKeyDown={handleOnKeyDownButton}
                    onClick={handleOnCloseButtonClick}
                  >
                    &#x2718;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
