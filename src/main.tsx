import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./style.css"
import { NotificationProvider } from "./hooks/useUserNotification"

/* disable the default tauri menu ( reload ) available on right-click */
document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault()
  })
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <NotificationProvider>
    <App />
  </NotificationProvider>
)
