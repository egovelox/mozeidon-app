import { writeText } from "@tauri-apps/plugin-clipboard-manager"
import { limitString } from "../utils/strings"
import mozeidonLogo from "../assets/trident.svg"
import { FILE_PREFIX_URL } from "../utils/constants"

interface TextSelectorProps {
  className: string
  content: string
  maxLength: number
  isRowSelected: boolean
  faviconUrl?: string
}
export const TextSelector = ({
  className,
  content,
  maxLength,
  isRowSelected,
  faviconUrl,
}: TextSelectorProps) => {
  const isTruncated = content.length > maxLength
  const getImgSrc = (faviconUrl: string) => {
    return faviconUrl.startsWith(FILE_PREFIX_URL) ? mozeidonLogo : faviconUrl
  }

  return (
    <div className={className + " tooltip-wrapper"}>
      {faviconUrl && (
        <img
          className="itemFavicon"
          src={getImgSrc(faviconUrl)}
          alt=""
          onError={(e) => {
            e.currentTarget.src = mozeidonLogo
          }}
        />
      )}
      <span>{limitString(content, maxLength)}</span>
      {isTruncated && isRowSelected && (
        <div
          className="tooltip"
          onClick={async () => {
            await writeText(content)
            console.log("ok")
          }}
        >
          {content}
        </div>
      )}
    </div>
  )
}
