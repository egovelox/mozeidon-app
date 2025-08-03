import { Fragment, KeyboardEvent, useEffect, useRef, useState } from "react"
import { useDebounce } from "use-debounce"
import { FixedSizeList as List } from "react-window"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import mozeidonLogo from "./assets/trident.svg"
import collapseIcon from "./assets/collapse.svg"
import maximizeIcon from "./assets/maximize.svg"
import webSearchIcon from "./assets/websearch.svg"
import noWebSearchIcon from "./assets/nowebsearch.svg"

import "./App.css"
import { BookmarkItem } from "./domain/bookmarks/models"
import { BmFormElement } from "./domain/bookmarks/validation"
import { AppSettings } from "./domain/settings/models"
import { TabItem } from "./domain/tabs/models"
import { ListContainer } from "./components/List"
import { WebSearchListContainer } from "./components/WebSearchListContainer"
import { BookmarksEditor, EditRefs } from "./components/BookmarksEditor"
import { SearchInput } from "./components/SearchInput"
import { SettingsView } from "./components/SettingsView"
import { ShortcutListenerContainer } from "./components/ShortcutListenerContainer"
import { WindowShortcutListener } from "./components/WindowShortcutListener"
import { useInit } from "./hooks/useInit"
import { SettingsProvider } from "./hooks/useSettings"
import { useNotification } from "./hooks/useUserNotification"
import { createBookmarkAction, updateBookmarkAction } from "./actions/actions"
import { runWithChrono } from "./utils/time"
import { useListNavigation } from "./utils/itemsInViewPort"
import {
  handleSearch,
  toggleSearchType,
  SearchType,
} from "./utils/searchHandler"
import {
  Context,
  GET_BOOKMARKS_COMMAND,
  GET_HISTORY_COMMAND,
  GET_RECENTLY_CLOSED_COMMAND,
  GET_TABS_COMMAND,
  RowDisplay,
} from "./utils/constants"
import { HistoryItem } from "./domain/history/models"
import { keyDownHandler } from "./utils/keyDownHandler"

type Items = BookmarkItem[] | TabItem[] | HistoryItem[]

const resetWindowMultiLine = () => {
  window.f = 0
  window.l = 3
}
const resetWindowOneLine = () => {
  window.f = 0
  window.l = 10
}

function App() {
  useInit()
  const { notify, userNotification, isNotificationVisible } = useNotification()
  const [context, setContext] = useState<Context>(Context.None)
  const [previousContext, setPreviousContext] = useState<Context>(Context.None)
  const [hItems, setHItems] = useState<Items>([])
  const [fuzzyItems, setFuzzyItems] = useState<Items>([])
  const [closedItems, setClosedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWebSearch, setIsWebSearch] = useState(false)
  const [rowDisplay, setRowDisplay] = useState<RowDisplay>(RowDisplay.OneLine)
  const [searchTerms, setSearchTerms] = useState("")
  const [searchType, setSearchType] = useState<SearchType>(SearchType.Exact)
  const [debouncedSearch] = useDebounce(searchTerms, 200)
  const [selectedListIndex, setSelectedListIndex] = useState(0)
  const [selectedWebSearchListIndex, setSelectedWebSearchListIndex] =
    useState(0)
  const [showEditionTab, setShowEditionTab] = useState(false)
  const editRefs = useRef<EditRefs>(null)
  const listRef = useRef<List>(null)

  useEffect(() => {
    restoreWindow()
  }, [isLoading])

  function restoreDefaults() {
    window.clickCoordinateY = 0
    setIsLoading(true)
    setContext(Context.None)
    setSelectedListIndex(0)
    setIsWebSearch(false)
    setSelectedWebSearchListIndex(0)
    setShowEditionTab(false)
    setSearchTerms("")
    setHItems([])
    setFuzzyItems([])
    setClosedItems([])
  }

  function resetForPreviousContext() {
    restoreWindow()
    setSelectedListIndex(0)
    setShowEditionTab(false)
  }

  function restoreWindow() {
    window.clickCoordinateY = 0
    setSelectedListIndex(0)
    if (rowDisplay === RowDisplay.MultiLine) {
      resetWindowMultiLine()
    }
    if (rowDisplay === RowDisplay.OneLine) {
      resetWindowOneLine()
    }
  }

  /* Listen on OS menubar click */
  useEffect(() => {
    listen<{ showSettings: boolean }>("toggle-settings", (event) => {
      if (event.payload.showSettings) {
        /*
         * here the SettingsView is shown after the user clicked OS menu-bar.
         * We set previousContext to None
         * so the SettingsView will not show a Back button.
         * ( see showBackButton in SettingsView props )
         */
        setPreviousContext(Context.None)
        setContext(Context.Settings)
      }
    })
  }, [])

  useListNavigation(
    listRef,
    selectedListIndex,
    showEditionTab,
    rowDisplay,
    // FIX
    // closedItems are required for useEffect inside,
    // or the list will lose the selected row
    closedItems,
    isWebSearch
  )

  const tabsShortcutHandler = async () => {
    restoreDefaults()
    /* show ui */
    setContext(Context.Tabs)
    await invoke("show")
    /* fetch items */
    const { res, duration } = await runWithChrono(() =>
      invoke("mozeidon", { context: Context.Tabs, args: GET_TABS_COMMAND })
    )
    const items: TabItem[] = JSON.parse(res as string)
    setHItems(items)
    setFuzzyItems(items)
    notify(`took ${duration} ms !`)
    setIsLoading(false)
  }

  const historyShortcutHandler = async () => {
    restoreDefaults()
    /* show ui */
    setContext(Context.History)
    await invoke("show")
    /* fetch items */
    const { res, duration } = await runWithChrono(() =>
      invoke("mozeidon", {
        context: Context.History,
        args: GET_HISTORY_COMMAND,
      })
    )
    const items: HistoryItem[] = JSON.parse(res as string)
    setHItems(items)
    setFuzzyItems(items)
    notify(`took ${duration} ms !`)
    setIsLoading(false)
  }

  const recentlyClosedShortcutHandler = async () => {
    restoreDefaults()
    /* show ui */
    setContext(Context.RecentlyClosed)
    await invoke("show")
    /* fetch items */
    const { res, duration } = await runWithChrono(() =>
      invoke("mozeidon", {
        context: Context.Tabs,
        args: GET_RECENTLY_CLOSED_COMMAND,
      })
    )
    const items: TabItem[] = JSON.parse(res as string)
    setHItems(items)
    setFuzzyItems(items)
    notify(`took ${duration} ms !`)
    setIsLoading(false)
  }

  const bookmarksShortcutHandler = async () => {
    restoreDefaults()
    /* show ui */
    setContext(Context.Bookmarks)
    await invoke("show")
    /* fetch items */
    const { res, duration } = await runWithChrono(() =>
      invoke("mozeidon", {
        context: Context.Bookmarks,
        args: GET_BOOKMARKS_COMMAND,
      })
    )
    const items: BookmarkItem[] = JSON.parse(res as string)
    setHItems(items)
    setFuzzyItems(items)
    setIsLoading(false)
    notify(`took ${duration} ms !`)
  }

  /* Handle KeyDown */
  const handleKeyDown = (event: KeyboardEvent, settings: AppSettings) =>
    keyDownHandler({
      event,
      settings,
      context,
      fuzzyItems,
      showEditionTab,
      isWebSearch,
      selectedListIndex,
      selectedWebSearchListIndex,
      searchTerms,
      closedItems,
      notify,
      setShowEditionTab,
      setSelectedListIndex,
      setSelectedWebSearchListIndex,
      setClosedItems,
      restoreDefaults,
    })

  /* Trigger search with debounce */
  useEffect(() => {
    if (debouncedSearch !== "") {
      handleSearch(setFuzzyItems, searchType, searchTerms, context, hItems)
    } else {
      setFuzzyItems(hItems)
    }
  }, [debouncedSearch, searchType])

  /* Handle Edit-Form submit */
  const handleEditFormSubmit = async (e: React.FormEvent<BmFormElement>) => {
    // Prevent the browser from reloading the page
    e.preventDefault()
    const { title, url, folderPath } = e.currentTarget.elements
    if (context === Context.Tabs) {
      await createBookmarkAction(title.value, url.value, folderPath.value)
      setShowEditionTab(false)
      notify("Bookmark created !")
    }

    if (context === Context.Bookmarks) {
      const bookmarkId = (fuzzyItems as BookmarkItem[])[selectedListIndex].id
      await updateBookmarkAction(
        bookmarkId,
        title.value,
        url.value,
        folderPath.value
      )
      setShowEditionTab(false)
      const newItems = fuzzyItems.map((item) => {
        if (item.id === bookmarkId) {
          return {
            ...item,
            title: title.value,
            url: url.value,
            parent: folderPath.value,
          }
        }
        return item
      })

      setFuzzyItems(newItems as BookmarkItem[])
      notify("Bookmark updated !")
    }
  }

  /*
   * We need this ref and this useEffect
   * to have the focus start on the SearchInput
   * rather than on the actionButtonInvertSearchType button.
   * We use context and showEditionTab changes to trigger this useEffect.
   * as those both changes imply focus change.
   */
  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    // Wait until after layout/paint to focus
    const frame = requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })

    return () => cancelAnimationFrame(frame)
  }, [context, showEditionTab])

  return (
    <SettingsProvider
      shortcutsHandlers={{
        global_shortcut_show_panel_tabs: tabsShortcutHandler,
        global_shortcut_show_panel_bookmarks: bookmarksShortcutHandler,
        global_shortcut_show_panel_history: historyShortcutHandler,
        global_shortcut_show_panel_recently_closed:
          recentlyClosedShortcutHandler,
      }}
    >
      <WindowShortcutListener
        closeWindowCallback={async () => {
          restoreDefaults()
          await invoke("hide")
        }}
      />
      {context === Context.Settings ? (
        <SettingsView
          showBackButton={previousContext !== Context.None}
          onBackToList={() => {
            resetForPreviousContext()
            setContext(previousContext)
          }}
        />
      ) : (
        <Fragment>
          {isLoading && <div className="loading"></div>}
          <ShortcutListenerContainer handleKeyDown={handleKeyDown}>
            {!showEditionTab ? (
              <div className="container">
                <div className="searchBar">
                  {
                    <button
                      className="loopButton"
                      onFocus={() =>
                        document.getElementById("actionButtonSettings")?.focus()
                      }
                    />
                  }
                  <button
                    type="button"
                    className="actionButton"
                    id="actionButtonToggleSearchType"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={() => {
                      restoreWindow()
                      setSearchType(toggleSearchType(searchType))
                      document.getElementById("searchInput")?.focus()
                    }}
                  >
                    &#x2713; {searchType}
                  </button>
                  <SearchInput
                    ref={searchInputRef}
                    value={searchTerms}
                    onChange={(e) => {
                      restoreWindow()
                      setSearchTerms(e.currentTarget.value)
                    }}
                  />
                  <button className="actionButton" disabled>
                    {`${fuzzyItems.length - closedItems.length} ${context} `}
                    &#x2713;
                  </button>
                  <button
                    className="actionButton"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(_) => {
                      if (isWebSearch) {
                        setIsWebSearch(false)
                      } else {
                        setIsWebSearch(true)
                      }
                      document.getElementById("searchInput")?.focus()
                    }}
                  >
                    <img
                      src={isWebSearch ? webSearchIcon : noWebSearchIcon}
                      className="svgIcon"
                      alt={isWebSearch ? "Web search" : "Web search disabled"}
                    />
                  </button>
                  <button
                    className="actionButton"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(_) => {
                      window.clickCoordinateY = 0
                      setSelectedListIndex(0)
                      if (rowDisplay === RowDisplay.MultiLine) {
                        resetWindowOneLine()
                        setRowDisplay(RowDisplay.OneLine)
                      } else {
                        resetWindowMultiLine()
                        setRowDisplay(RowDisplay.MultiLine)
                      }
                      document.getElementById("searchInput")?.focus()
                    }}
                  >
                    {rowDisplay === RowDisplay.MultiLine ? (
                      <img
                        src={maximizeIcon}
                        className="svgIcon"
                        alt="Collapse"
                      />
                    ) : (
                      <img
                        src={collapseIcon}
                        className="svgIcon"
                        alt="Maximize"
                      />
                    )}
                  </button>
                </div>
                <div className="row" id="listContainer" tabIndex={-1}>
                  {/* when fuzzyItems is empty, we display the WebSearch list */}
                  {(fuzzyItems.length && !isWebSearch) || isLoading ? (
                    <ListContainer
                      rowDisplay={rowDisplay}
                      closedItems={closedItems}
                      selectedListIndex={selectedListIndex}
                      fuzzyItems={fuzzyItems}
                      setSelectedListIndex={setSelectedListIndex}
                      setShowEditionTab={setShowEditionTab}
                      setClosedItems={setClosedItems}
                      context={context}
                      listRef={listRef}
                      restoreDefaults={restoreDefaults}
                    />
                  ) : (
                    <WebSearchListContainer
                      rowDisplay={rowDisplay}
                      selectedWebSearchListIndex={selectedWebSearchListIndex}
                      searchTerms={searchTerms}
                      setSelectedWebSearchListIndex={
                        setSelectedWebSearchListIndex
                      }
                      listRef={listRef}
                    />
                  )}
                </div>
                <div className="footerContainer">
                  <div>
                    {userNotification && (
                      <button
                        className={`actionButton userNotification ${isNotificationVisible ? "visible" : ""}`}
                        disabled
                      >
                        {userNotification}
                      </button>
                    )}
                    <button
                      className="actionButton"
                      id="actionButtonSettings"
                      onKeyDown={(e) => e.stopPropagation()}
                      onClick={() => {
                        setPreviousContext(context)
                        setContext(Context.Settings)
                      }}
                    >
                      <img
                        src={mozeidonLogo}
                        alt="Mozeidon logo"
                        style={{
                          width: "1em",
                          height: "1em",
                          verticalAlign: "middle",
                        }}
                      />
                    </button>
                    <button
                      className="loopButton"
                      onFocus={() =>
                        document
                          .getElementById("actionButtonToggleSearchType")
                          ?.focus()
                      }
                    />
                  </div>
                </div>
              </div>
            ) : (
              <BookmarksEditor
                ref={editRefs}
                onSubmit={handleEditFormSubmit}
                onBackToList={() => setShowEditionTab(false)}
                selectedItem={fuzzyItems[selectedListIndex] as BookmarkItem}
              />
            )}
          </ShortcutListenerContainer>
        </Fragment>
      )}
    </SettingsProvider>
  )
}

export default App
