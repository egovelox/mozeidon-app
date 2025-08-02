import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react"

type NotificationContextType = {
  notify: (message: string) => void
  userNotification: string
  isNotificationVisible: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [userNotification, setUserNotification] = useState("")
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)

  const notify = (message: string) => {
    setUserNotification(message)
  }

  useEffect(() => {
    if (userNotification !== "") {
      setIsNotificationVisible(true)
      const hideTimeout = setTimeout(() => {
        setIsNotificationVisible(false)
      }, 2000)
      const clearTimeoutId = setTimeout(() => setUserNotification(""), 3000)
      return () => {
        clearTimeout(hideTimeout)
        clearTimeout(clearTimeoutId)
      }
    }
  }, [userNotification])

  return (
    <NotificationContext.Provider
      value={{ notify, userNotification, isNotificationVisible }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context)
    throw new Error("useNotification must be used within NotificationProvider")
  return context
}
