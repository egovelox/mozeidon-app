import { useEffect, useState } from "react"
import { useSettings } from "../hooks/useSettings"
import { FILE_PREFIX_URL, RowDisplay } from "../utils/constants"
import {
  clearFaviconCache,
  getFavicon,
  setFavicon,
} from "../utils/faviconCache"
import { TextSelector } from "./TextSelector"

export interface WebSearchRowProps {
  index: number
  style?: React.CSSProperties
  data: {
    items: string[]
    selected: number
    searchTerms: string
    setSelection: (i: number) => void
    setClickCoordinateY: (y: number) => void
    rowDisplay: RowDisplay
  }
}

export const WebSearchRow = ({ index, style, data }: WebSearchRowProps) => {
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
    domain = new URL(item).hostname
  } catch {}

  const [faviconUrl, setFaviconUrl] = useState<string | undefined>(() =>
    getFavicon(domain)
  )

  useEffect(() => {
    if (settings.show_favicons) {
      if (!faviconUrl) {
        //const url = `https://icons.duckduckgo.com/ip3/${domain}.ico`
        const url = item.startsWith(FILE_PREFIX_URL)
          ? FILE_PREFIX_URL
          : domain &&
            `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
        setFaviconUrl(url)
        setFavicon(domain, url)
      }
    } else {
      clearFaviconCache()
    }
  }, [domain])

  return (
    <div
      style={style}
      onClick={(e) => {
        data.setClickCoordinateY(e.pageY)
        data.setSelection(index)
      }}
    >
      {rowDisplay === RowDisplay.MultiLine ? (
        <div className={`${selectionClassName}`} style={{ cursor: "default" }}>
          <TextSelector
            faviconUrl={faviconUrl}
            className="liFirstLine"
            content="Search the Web"
            maxLength={70}
            isRowSelected={isRowSelected}
          />
          <TextSelector
            className="liLine"
            content={domain || data.items[index]}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
          <TextSelector
            className="liLine"
            content={`${data.items[index]}${data.searchTerms.replaceAll(" ", "+")}`}
            maxLength={80}
            isRowSelected={isRowSelected}
          />
        </div>
      ) : (
        <div className={`${selectionClassName}`} style={{ cursor: "default" }}>
          <TextSelector
            faviconUrl={faviconUrl}
            className={"liFirstLineSmall"}
            content={"Search the Web with " + (domain || data.items[index])}
            maxLength={100}
            isRowSelected={isRowSelected}
          />
        </div>
      )}
    </div>
  )
}
