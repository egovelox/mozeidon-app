import { useState } from "react"

interface ActionsRowProps {
  actionName: string
  action: () => Promise<void>
  image: string
  id?: string
  addClassName?: string
}

export const ActionsRow = ({
  action,
  id,
  image,
  actionName,
  addClassName,
}: ActionsRowProps) => {
  const handleOnKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key.toLowerCase() === "enter") {
      e.stopPropagation()
      e.preventDefault()
      await action()
    }
  }
  const [isOnFocus, setIsOnFocus] = useState(false)

  return (
    <div
      className={`actionsRowButtonContainer ${isOnFocus ? " actionsRowButtonContainerFocus" : ""}`}
    >
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
        <img
          draggable={false}
          className={`svgIcon ${addClassName ?? ""}`}
          src={image}
          title={actionName}
          alt={actionName}
        />
      </button>
    </div>
  )
}
