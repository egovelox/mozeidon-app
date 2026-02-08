import { useEffect, useRef, useState } from "react"

import mozeidonLogo from "../assets/trident.svg"
import { GroupItem } from "../domain/tabs/models"
import { FILE_PREFIX_URL } from "../utils/constants"

interface TextSelectorProps {
  className: string
  group?: GroupItem
  isGroupHeader?: boolean
  content: string
  isRowSelected: boolean
  faviconUrl?: string
  pinned?: boolean
}
export const TextSelector = ({
  className,
  content,
  isRowSelected,
  faviconUrl,
  pinned,
  group,
  isGroupHeader,
}: TextSelectorProps) => {
  const spanRef = useRef<HTMLSpanElement | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const getImgSrc = (faviconUrl: string) => {
    return faviconUrl.startsWith(FILE_PREFIX_URL) ? mozeidonLogo : faviconUrl
  }
  /* useEffect in order to conditionnaly render a tooltip */
  useEffect(() => {
    if (spanRef.current) {
      const hasOverflow = spanRef.current.scrollWidth > spanRef.current.clientWidth
      setIsOverflowing(hasOverflow)
    }
  }, [])
  return (
    <div className={className + " tooltip-wrapper"}>
      {faviconUrl !== "" && faviconUrl !== undefined ? (
        <img
          draggable={false}
          className="itemFavicon"
          src={getImgSrc(faviconUrl)}
          alt=""
          onError={(e) => {
            e.currentTarget.src = mozeidonLogo
          }}
        />
      ) : faviconUrl === "" ? (
        <img
          draggable={false}
          className="itemFavicon"
          src={mozeidonLogo}
          alt=""
          onError={(e) => {
            e.currentTarget.src = mozeidonLogo
          }}
        />
      ) : null}
      {
        // a colored dot to indicate the group
        group && !isGroupHeader ? (
          <span title={`group: ${group.title}`} className={`tabGroupDot tabGroupColor${group.color}`}></span>
        ) : null
      }
      <span className="itemLineSpan" ref={spanRef}>
        {pinned ? (
          <>
            <span style={{ fontSize: ".9em" }}>📌 </span>
            <span>{content}</span>
          </>
        ) : (
          <>
            <span
              className={isGroupHeader ? `tabGroupColor${group?.color}` : ""}
              style={
                isGroupHeader
                  ? {
                      display: "inline-block",
                      borderRadius: "3px",
                      padding: ".1em .3em",
                    }
                  : {}
              }
            >
              {content}
            </span>
            {isGroupHeader && group && (
              <>
                &nbsp; &nbsp;
                <span
                  className="groupHeaderCountIndicator"
                  style={{
                    borderRadius: "10px",
                    fontSize: ".8em",
                    padding: ".1em .2em",
                    border: "1px solid",
                  }}
                >
                  &nbsp;{`${(group?.tabs.length ?? 1) - 1}`}&nbsp;
                </span>
                {!group.collapsed && <span>&nbsp;&nbsp;</span>}
                {!group.collapsed && (
                  <span
                    style={{
                      display: "inline-block",
                      color: "gray",
                      transform: "rotate(90deg)",
                    }}
                  >
                    &nbsp;&nbsp;&#x276F;
                  </span>
                )}
                {group.collapsed && <span style={{ color: "gray" }}>&nbsp;&nbsp;&#x276F;</span>}
              </>
            )}
          </>
        )}
      </span>
      {isOverflowing && isRowSelected && <div className="tooltip">{content}</div>}
    </div>
  )
}
