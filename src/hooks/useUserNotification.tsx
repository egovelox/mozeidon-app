import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
export type Notification = {
  message: string
  id: number
}
type NotificationContextType = {
  notify: (message: string) => void
  userNotification: Notification | null
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [userNotification, setUserNotification] = useState<Notification | null>(null)

  const notify = (message: string) => {
    setUserNotification({ message, id: Date.now() })
  }

  return <NotificationContext.Provider value={{ notify, userNotification }}>{children}</NotificationContext.Provider>
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotification must be used within NotificationProvider")
  return context
}
