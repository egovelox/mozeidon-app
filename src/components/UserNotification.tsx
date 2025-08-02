import { useEffect, useState } from "react"
import { Notification } from "../hooks/useUserNotification"

export const UserNotification = ({
  userNotification,
}: {
  userNotification: Notification | null
}) => {
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
      <button
        className={`actionButton userNotification ${isNotificationVisible ? "visible" : ""}`}
        disabled
      >
        {userNotification.message}
      </button>
    )
  )
}
