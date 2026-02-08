import { useEffect, useRef, useState } from "react"

import { openURLAction } from "../actions/actions"
import { HistoryItem } from "../domain/history/models"
import { useSettings } from "../hooks/useSettings"
import { FAVICON_PROVIDER_URL, FILE_PREFIX_URL, RowDisplay } from "../utils/constants"
import { clearFaviconCache, getFavicon, setFavicon } from "../utils/faviconCache"
import { SwellUi } from "../utils/ui"
import { RowProps } from "./RowProps"
import { TextSelector } from "./TextSelector"

export const HistoryRow = ({ index, style, data }: RowProps<HistoryItem>) => {
  /* Adding style attribute is very important here
    it supplies the row height to the elements. */
  const {
    settings: { appSettings: settings },
  } = useSettings()
  const isRowSelected = data.selected === index
  const rowDisplay = data.rowDisplay
  const item = data.items[index]
  let domain = ""
  const selectionClassName = (isRowSelected && "sliBox") || "liBox"
  try {
    domain = new URL(item.url).hostname
  } catch {}

  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(() => getFavicon(domain))

  useEffect(() => {
    if (settings.show_favicons) {
      //const url = `https://icons.duckduckgo.com/ip3/${domain}.ico`
      const url = item.url.startsWith(FILE_PREFIX_URL)
        ? FILE_PREFIX_URL
        : domain && `${FAVICON_PROVIDER_URL}?sz=128&domain=${domain}`
      setFaviconUrl(url)
      setFavicon(domain, url)
    } else {
      clearFaviconCache()
    }
  }, [domain])

  const url = data.items.map(({ url }) => url)[index]
  const title = data.items.map(({ title }) => title)[index]
  const visitCount = data.items.map(({ vc }) => vc)[index]
  const lastVisit = new Date(data.items.map(({ t }) => t)[index])
  const lastVisitLocalDate = lastVisit.toLocaleDateString(settings.date_locale || undefined)
  const lastVisitLocalTime = lastVisit.toLocaleTimeString(settings.date_locale || undefined)

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
    e.preventDefault()
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

  const handleDoubleClick = async () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
    }
    openURLAction(data.currentProfile, item.url)
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

  return (
    <div style={style} onClick={handleClick}>
      {rowDisplay === RowDisplay.MultiLine ? (
        <div className={selectionClassName} style={{ cursor: "default" }} onDoubleClick={handleDoubleClick}>
          <div>
            <TextSelector
              faviconUrl={faviconUrl}
              className="liFirstLine"
              content={title}
              isRowSelected={isRowSelected}
            />
          </div>
          <TextSelector className="liLineSmallFont" content={url} isRowSelected={isRowSelected} />
          <TextSelector
            className="liLine"
            content={`${lastVisitLocalDate}  ${lastVisitLocalTime} • visited ${visitCount} time${visitCount > 1 ? "s" : ""}`}
            isRowSelected={isRowSelected}
          />
        </div>
      ) : (
        <div className={`${selectionClassName}`} style={{ cursor: "default" }} onDoubleClick={handleDoubleClick}>
          <TextSelector
            faviconUrl={faviconUrl}
            className={`liFirstLineSmall`}
            content={`${lastVisitLocalDate}  ${lastVisitLocalTime} • ${title}`}
            isRowSelected={isRowSelected}
          />
        </div>
      )}
    </div>
  )
}
