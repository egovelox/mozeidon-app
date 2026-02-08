import { useEffect, useState } from "react"

import { Notification } from "../hooks/useUserNotification"
import { Utils } from "../utils/utils"

export const UserNotification = ({ userNotification }: { userNotification: Notification | null }) => {
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized && userNotification) {
      setIsNotificationVisible(true)
      const hideTimeout = setTimeout(() => {
        setIsNotificationVisible(false)
      }, 1800)
      return () => {
        clearTimeout(hideTimeout)
      }
    }
  }, [userNotification])

  return (
    userNotification && (
      <div id="userNotificationContainer" onClick={() => Utils.focusSearchInput()}>
        <span className={`userNotification ${isNotificationVisible ? "visible" : ""}`}>{userNotification.message}</span>
      </div>
    )
  )
}
