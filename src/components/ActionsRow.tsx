import { useState, ComponentType, SVGProps } from "react"

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>

interface ActionsRowProps {
  actionName: string
  action: () => Promise<void>
  Icon: SvgIcon
  id?: string
  addClassName?: string
}

export const ActionsRow = ({ action, id, Icon, actionName, addClassName }: ActionsRowProps) => {
  const handleOnKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key.toLowerCase() === "enter") {
      e.stopPropagation()
      e.preventDefault()
      await action()
    }
  }
  const [isOnFocus, setIsOnFocus] = useState(false)

  return (
    <div className={`actionsRowButtonContainer ${isOnFocus ? " actionsRowButtonContainerFocus" : ""}`}>
      <button
        id={id}
        title={actionName}
        className={"actionsRowButton"}
        onKeyDown={handleOnKeyDown}
        onClick={async (e) => {
          e.stopPropagation()
          e.preventDefault()
          await action()
        }}
        onFocus={() => setIsOnFocus(true)}
        onBlur={() => setIsOnFocus(false)}
        onPointerOver={() => setIsOnFocus(true)}
        onPointerLeave={() => setIsOnFocus(false)}
      >
        <Icon className={`svgIcon ${addClassName ?? ""}`} aria-label={actionName} />
      </button>
    </div>
  )
}
