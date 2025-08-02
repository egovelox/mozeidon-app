import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./style.css"
import { NotificationProvider } from "./hooks/useUserNotification"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <NotificationProvider>
    <App />
  </NotificationProvider>
)
