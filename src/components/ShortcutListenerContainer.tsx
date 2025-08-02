import { KeyboardEvent } from "react"
import { Settings } from "../domain/settings/models"
import { useSettings } from "../hooks/useSettings"

type ShortcutListenerContainerProps = {
  handleKeyDown: (
    event: KeyboardEvent<HTMLDivElement>,
    settings: Settings
  ) => Promise<void>
  children: React.ReactNode
}

export function ShortcutListenerContainer({
  handleKeyDown,
  children,
}: ShortcutListenerContainerProps) {
  const { settings } = useSettings()
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    handleKeyDown(e, settings)
  }

  return (
    <div className="container" tabIndex={0} onKeyDown={onKeyDown}>
      {children}
    </div>
  )
}
