import { Fragment, KeyboardEvent, useEffect, useRef, useState } from "react"
import settingsLogo from "./assets/settings.svg"
import searchExactIcon from "./assets/searchExact.svg"
import searchFuzzyIcon from "./assets/searchFuzzy.svg"
import webSearchIcon from "./assets/websearch.svg"
import maximizeIcon from "./assets/maximize.svg"
import md5 from "md5"
import { FixedSizeList as List } from "react-window"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import "./App.css"
import { BookmarkItem } from "./domain/bookmarks/models"
import { BmFormElement } from "./domain/bookmarks/validation"
import { AppSettings, Settings } from "./domain/settings/models"
import { GroupItem, TabItem, TabsWithGroups } from "./domain/tabs/models"
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
import {
  createBookmarkAction,
  switchTabAction,
  updateBookmarkAction,
  newGroupTab,
  closeTabAction,
} from "./actions/actions"
import { useListNavigation } from "./utils/itemsInViewPort"
import { toggleSearchType, SearchType } from "./utils/searchHandler"
import { Context, RowDisplay } from "./utils/constants"
import { HistoryItem } from "./domain/history/models"
import { Items } from "./domain/ItemModel"
import { keyDownHandler } from "./utils/keyDownHandler"
import { isErrorJsonString, numberWithSpaces } from "./utils/strings"
import { didLoadItemsEffect } from "./hooks/effects/hasLoadedItems"
import { UserNotification } from "./components/UserNotification"
import { ActionButton } from "./components/ActionButton"
import { getPreviousVisitedTabIndex } from "./utils/getOrderedTabs"
import { VerticalActionsView } from "./components/VerticalActionsView"
import { Error } from "./components/Error"
import { insertTabGroups } from "./utils/tabGroups"
import {
  GroupTabEditor,
  NewTabGroupFormContent,
} from "./components/GroupTabEditor"
import { FolderIndex } from "./utils/bookmarksFolderIndex"
import {
  fetchRecentlyClosedTabs,
  fetchTabs,
  fetchTabsWithGroups,
} from "./actions/tabs"
import { fetchBookmarks } from "./actions/bookmarks"
import { fetchHistory } from "./actions/history"
import { ActionsRow } from "./components/ActionsRow"

let bookmarksCachedItems: Items = []
let bookmarksFolderIndex: FolderIndex
let bookmarksCachedItemsHash = md5(JSON.stringify(bookmarksCachedItems))

window.DEBUG = true

function App() {
  useInit()
  const { notify, userNotification } = useNotification()
  const [context, setContext] = useState<Context>(Context.None)
  const [error, setError] = useState("")
  const [previousContext, setPreviousContext] = useState<Context>(Context.None)
  const [groupItems, setGroupItems] = useState<GroupItem[]>([])
  // a list where all items remain present
  const [baseItems, setBaseItems] = useState<Items>([])
  // on the opposite, a list where items can be filtered depending on searchTerms
  const [fuzzyItems, setFuzzyItems] = useState<Items>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchNotFound, setIsSearchNotFound] = useState(false)
  const [isUserWebSearch, setIsUserWebSearch] = useState(false)
  const [rowDisplay, setRowDisplay] = useState<RowDisplay>(RowDisplay.OneLine)
  const [searchTerms, setSearchTerms] = useState("")
  const [searchType, setSearchType] = useState<SearchType>(SearchType.Exact)
  const [selectedListIndex, setSelectedListIndex] = useState(0)
  const [selectedWebSearchListIndex, setSelectedWebSearchListIndex] =
    useState(0)
  const [showEditionTab, setShowEditionTab] = useState(false)
  const [showGroupEditionTab, setShowGroupEditionTab] = useState(false)
  const editRefs = useRef<EditRefs>(null)
  const listRef = useRef<List>(null)

  didLoadItemsEffect(
    listRef,
    baseItems as TabItem[],
    groupItems,
    context,
    setSelectedListIndex,
    setFuzzyItems,
    setBaseItems,
    setGroupItems,
    rowDisplay,
    { isLoading }
  )

  const resetWindowMultiLine = () => {
    if (!listRef.current) return
    const i = selectedListIndex
    setSelectedListIndex(i)
    window.f = i - 1
    window.l = i + 2
  }

  const resetWindowOneLine = () => {
    if (!listRef.current) return
    const i = selectedListIndex
    setSelectedListIndex(i)
    window.f = i - 5
    window.l = i + 5
  }

  function restoreDefaults() {
    window.clickCoordinateY = 0
    setIsLoading(true)
    setError("")
    setContext(Context.None)
    setPreviousContext(Context.None)
    setSelectedListIndex(0)
    setIsSearchNotFound(false)
    setSelectedWebSearchListIndex(0)
    setShowEditionTab(false)
    setShowGroupEditionTab(false)
    setSearchTerms("")
    setGroupItems([])
    setBaseItems([])
    setFuzzyItems([])
  }

  function resetForPreviousContext() {
    setShowEditionTab(false)
    restoreWindow()
  }

  function restoreWindow() {
    window.clickCoordinateY = 0
    if (rowDisplay === RowDisplay.MultiLine) {
      resetWindowMultiLine()
    }
    if (rowDisplay === RowDisplay.OneLine) {
      resetWindowOneLine()
    }
  }

  /*
   * Listen on app visibility :
   * - OS menubar click
   * - (macOS only) click outside of app
   */
  useEffect(() => {
    listen<{ isVisible: boolean }>("toggle-visible", (event) => {
      if (event.payload.isVisible) {
        /*
         * here the SettingsView is shown when the user clicked OS menu-bar.
         * We set previousContext to None
         * so the SettingsView will not show a Back button.
         * ( see showBackButton in SettingsView props )
         */
        setPreviousContext(Context.None)
        setContext(Context.Settings)
        invoke("show")
      } else {
        restoreDefaults()
        invoke("hide")
      }
    })
  }, [])

  useListNavigation(
    listRef,
    selectedListIndex,
    showEditionTab,
    showGroupEditionTab,
    rowDisplay,
    // FIX
    // following are required for useEffect inside,
    // or the list will lose the selected row
    isSearchNotFound,
    context,
    isUserWebSearch
  )

  const countCurrentItems = () => {
    if (context === Context.Tabs) {
      let collapsedTabsCount = 0
      if (groupItems.length !== 0) {
        collapsedTabsCount = groupItems
          .filter((g) => g.collapsed)
          .flatMap((g) => g.tabs)
          .filter((t) => t.type === "tab").length
      }
      if (searchTerms.length === 0) {
        const count =
          (fuzzyItems as TabItem[]).filter((t) => t.type === "tab").length +
          collapsedTabsCount
        return `${numberWithSpaces(Math.max(count, 0))} ${context} `
      } else {
        const count = (fuzzyItems as TabItem[]).filter(
          (t) => t.type === "tab"
        ).length
        return `${numberWithSpaces(Math.max(count, 0))} ${context} `
      }
    } else {
      const count = fuzzyItems.length
      return `${numberWithSpaces(Math.max(count, 0))} ${context} `
    }
  }

  const settingsHandler = async () => {
    restoreDefaults()
    setPreviousContext(Context.None)
    setContext(Context.Settings)
    await invoke("show")
    setIsLoading(false)
  }

  const tabsHandler = async () => {
    restoreDefaults()
    setContext(Context.Tabs)
    await invoke("show")
    const { res, duration } = await fetchTabsWithGroups()
    if (isErrorJsonString(res)) {
      const error: { error: string } = JSON.parse(res as string)
      setError(error.error)
    } else {
      const received: TabsWithGroups = JSON.parse(res as string)
      const groupItems: GroupItem[] = received.groups.map((g) => ({
        ...g,
        tabs: [],
      }))
      const tabs: TabItem[] = [
        ...received.tabs.map((t) => {
          const group = groupItems.find((g) => g.id === t.groupId)
          return {
            type: "tab" as const,
            groupTitle: group ? group.title : undefined,
            ...t,
          }
        }),
      ]
      insertTabGroups(tabs, received.groups, groupItems)
      setBaseItems(tabs)
      setFuzzyItems(tabs)
      setGroupItems(groupItems)
      notify(`took ${duration} ms`)
      setIsLoading(false)
      // for tabs to be bookmarked, we need a bookmarksFolderIndex
      getLazyBookmarks()
    }
  }

  const getLazyBookmarks = async () => {
    if (!bookmarksFolderIndex) {
      const { res } = await fetchBookmarks(bookmarksCachedItemsHash)
      if (isErrorJsonString(res)) {
        const error: { error: string } = JSON.parse(res as string)
        setError(error.error)
      } else {
        const items: BookmarkItem[] = JSON.parse(res as string)
        bookmarksCachedItemsHash = md5(res as string)
        bookmarksCachedItems = items
        bookmarksFolderIndex = new FolderIndex(items.map((i) => i.parent))
      }
    }
  }

  const historyHandler = async () => {
    restoreDefaults()
    setContext(Context.History)
    await invoke("show")
    const { res, duration } = await fetchHistory()
    if (isErrorJsonString(res)) {
      const error: { error: string } = JSON.parse(res as string)
      setError(error.error)
    } else {
      const items: HistoryItem[] = JSON.parse(res as string)
      setBaseItems(items)
      setFuzzyItems(items)
      notify(`took ${duration} ms`)
      setIsLoading(false)
      // for history items to be bookmarked, we need a bookmarksFolderIndex
      getLazyBookmarks()
    }
  }

  const recentlyClosedTabsHandler = async () => {
    restoreDefaults()
    /* show ui */
    setContext(Context.RecentlyClosed)
    await invoke("show")
    const { res, duration } = await fetchRecentlyClosedTabs()
    if (isErrorJsonString(res)) {
      const error: { error: string } = JSON.parse(res as string)
      setError(error.error)
    } else {
      const items: TabItem[] = JSON.parse(res as string)
      setBaseItems(items)
      setFuzzyItems(items)
      notify(`took ${duration} ms`)
      setIsLoading(false)
      // for recently-closed-tabs to be bookmarked, we need a bookmarksFolderIndex
      getLazyBookmarks()
    }
  }

  const bookmarksHandler = async () => {
    restoreDefaults()
    /* show ui */
    setContext(Context.Bookmarks)
    await invoke("show")
    const { res, duration } = await fetchBookmarks(bookmarksCachedItemsHash)
    if (isErrorJsonString(res)) {
      const error: { error: string } = JSON.parse(res as string)
      setError(error.error)
    } else if (res === "bookmarks_synchronized") {
      setBaseItems(bookmarksCachedItems)
      setFuzzyItems(bookmarksCachedItems)
      setIsLoading(false)
      notify(`took ${duration} ms`)
    } else {
      const items: BookmarkItem[] = JSON.parse(res as string)
      bookmarksCachedItemsHash = md5(res as string)
      bookmarksCachedItems = items
      bookmarksFolderIndex = new FolderIndex(items.map((i) => i.parent))
      setBaseItems(bookmarksCachedItems)
      setFuzzyItems(bookmarksCachedItems)
      setIsLoading(false)
      notify(`took ${duration} ms`)
    }
  }

  const switchLastVisitedTabHandler = async (settings: Settings) => {
    /* First hide the panel if it's currently open */
    invoke("hide")
    restoreDefaults()
    const { res } = await fetchTabs()
    if (isErrorJsonString(res)) {
      const error: { error: string } = JSON.parse(res as string)
      setError(error.error)
    } else {
      const items: TabItem[] = JSON.parse(res as string)
      const lastVisitedTab =
        items[getPreviousVisitedTabIndex(items as TabItem[])]
      await switchTabAction(
        `${lastVisitedTab.windowId}:${lastVisitedTab.id}`,
        settings.appSettings.web_browser
      )
      restoreDefaults()
    }
  }

  const closeCurrentTabTabHandler = async (settings: Settings) => {
    /* First hide the panel if it's currently open */
    invoke("hide")
    restoreDefaults()
    const { res } = await fetchTabs()
    if (isErrorJsonString(res)) {
      const error: { error: string } = JSON.parse(res as string)
      setError(error.error)
    } else {
      const items: TabItem[] = JSON.parse(res as string)
      const currentTab = items.length ? items[0] : null
      if (currentTab) {
        await switchTabAction(
          `${currentTab.windowId}:${currentTab.id}`,
          settings.appSettings.web_browser
        )
        await closeTabAction(`${currentTab.windowId}:${currentTab.id}`)
      }
      restoreDefaults()
    }
  }

  /* Handle KeyDown : where in-app user keypresses are listened to */
  const handleKeyDown = (event: KeyboardEvent, settings: AppSettings) =>
    keyDownHandler({
      searchInputRef,
      event,
      settings,
      context,
      fuzzyItems,
      baseItems,
      groupItems,
      showEditionTab,
      showGroupEditionTab,
      isWebSearch: isSearchNotFound || isUserWebSearch,
      selectedListIndex,
      selectedWebSearchListIndex,
      searchTerms,
      notify,
      setShowEditionTab,
      setSelectedListIndex,
      setSelectedWebSearchListIndex,
      restoreDefaults,
      setFuzzyItems,
      setBaseItems,
      setGroupItems,
    })

  /* Handle New Tab Group Form submit */
  const handleNewTabGroupFormSubmit = async (
    e: React.FormEvent<NewTabGroupFormContent>
  ) => {
    // Prevent the browser from reloading the page
    e.preventDefault()
    const { groupTitle, groupColor } = e.currentTarget.elements
    const tabList = baseItems as TabItem[]
    // spot the tab using fuzzyItems because user may have searched and filtered items.
    const tab = (fuzzyItems as TabItem[])[selectedListIndex]
    // retrieve the position in tabList
    const tabListPosition = tabList.findIndex((t) => t.id === tab.id)
    const newGroupId = await newGroupTab(
      tab.id,
      tab.windowId,
      groupTitle.value,
      groupColor.value
    )
    if (isErrorJsonString(newGroupId)) {
      return
    }
    const tabGroupId = Number(newGroupId)
    const groupedTab = {
      ...tab,
      pinned: false,
      groupTitle: groupTitle.value,
      groupId: tabGroupId,
    }
    const groupHeader = {
      ...groupedTab,
      type: "group" as const,
      id: tabGroupId,
      index: -1,
      domain: "",
      url: "",
      title: groupTitle.value,
      lastAccessed: 0,
      pinned: false,
    }
    groupItems.push({
      windowId: tab.windowId,
      id: tabGroupId,
      collapsed: false,
      title: groupTitle.value,
      color: groupColor.value,
      tabs: [groupHeader, groupedTab],
    })
    const listCopy: TabItem[] = [
      ...tabList.slice(0, tabListPosition),
      groupHeader,
      groupedTab,
      ...tabList.slice(tabListPosition + 1),
    ]

    setGroupItems(groupItems)

    if (searchTerms === "") {
      setBaseItems(listCopy)
      setFuzzyItems(listCopy)
    } else {
      setBaseItems(listCopy)
      /*
       * now the tab is member of one of our groups,
       * we can remove it from our current list
       */
      setFuzzyItems(fuzzyItems.filter((t) => t.id !== tab.id) as TabItem[])
    }
    setShowGroupEditionTab(false)
  }

  /* Handle Edit Bookmark Form submit */
  const handleEditBookmarkFormSubmit = async (
    e: React.FormEvent<BmFormElement>
  ) => {
    // Prevent the browser from reloading the page
    e.preventDefault()
    const { title, url, folderPath } = e.currentTarget.elements
    if (context === Context.Tabs) {
      await createBookmarkAction(title.value, url.value, folderPath.value)
      setShowEditionTab(false)
      notify("Bookmark created")
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
      notify("Bookmark updated")
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
  }, [context, showEditionTab, showGroupEditionTab])

  if (error) {
    return (
      <SettingsProvider
        shortcutsHandlers={{
          global_shortcut_show_panel_tabs: tabsHandler,
          global_shortcut_show_panel_bookmarks: bookmarksHandler,
          global_shortcut_show_panel_history: historyHandler,
          global_shortcut_show_panel_recently_closed: recentlyClosedTabsHandler,
          global_shortcut_show_panel_settings: settingsHandler,
          global_shortcut_switch_last_visited_tab: switchLastVisitedTabHandler,
          global_shortcut_close_current_tab: closeCurrentTabTabHandler,
        }}
      >
        <WindowShortcutListener
          closeWindowCallback={async () => {
            restoreDefaults()
            await invoke("hide")
          }}
        />
        <Error error={error} redirectCallback={settingsHandler} />
      </SettingsProvider>
    )
  }
  return (
    <SettingsProvider
      shortcutsHandlers={{
        global_shortcut_show_panel_tabs: tabsHandler,
        global_shortcut_show_panel_bookmarks: bookmarksHandler,
        global_shortcut_show_panel_history: historyHandler,
        global_shortcut_show_panel_recently_closed: recentlyClosedTabsHandler,
        global_shortcut_show_panel_settings: settingsHandler,
        global_shortcut_switch_last_visited_tab: switchLastVisitedTabHandler,
        global_shortcut_close_current_tab: closeCurrentTabTabHandler,
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
          restoreDefaults={restoreDefaults}
          context={context}
          showBackButton={previousContext !== Context.None}
          tabsHandler={tabsHandler}
          bookmarksHandler={bookmarksHandler}
          historyHandler={historyHandler}
          recentlyClosedTabsHandler={recentlyClosedTabsHandler}
          settingsHandler={settingsHandler}
          onBackToList={() => {
            resetForPreviousContext()
            setContext(previousContext)
          }}
        />
      ) : (
        <Fragment>
          {isLoading && <div className="loading"></div>}
          <ShortcutListenerContainer handleKeyDown={handleKeyDown}>
            {!showEditionTab && !showGroupEditionTab && (
              <div className="container">
                <div className="searchBar">
                  <ActionsRow
                    action={async () => {
                      setPreviousContext(context)
                      setContext(Context.Settings)
                    }}
                    actionName={`Go to settings`}
                    image={settingsLogo}
                  />
                  <ActionsRow
                    action={async () => {
                      setSearchType(toggleSearchType(searchType))
                      document.getElementById("searchInput")?.focus()
                    }}
                    actionName={
                      searchType === SearchType.Exact
                        ? `${SearchType.Exact} match`
                        : `${SearchType.Fuzzy} match`
                    }
                    image={
                      searchType === SearchType.Exact
                        ? searchExactIcon
                        : searchFuzzyIcon
                    }
                  />
                  <ActionsRow
                    action={async () => {
                      if (rowDisplay === RowDisplay.MultiLine) {
                        setRowDisplay(RowDisplay.OneLine)
                        const i = selectedListIndex
                        setSelectedListIndex(i)
                        window.f = i - 5
                        window.l = i + 5
                      } else {
                        setRowDisplay(RowDisplay.MultiLine)
                        const i = selectedListIndex
                        setSelectedListIndex(i)
                        window.f = i - 1
                        window.l = i + 2
                      }
                      document.getElementById("searchInput")?.focus()
                    }}
                    actionName="Toggle list layout"
                    image={maximizeIcon}
                  />
                  <ActionsRow
                    image={webSearchIcon}
                    action={async () => {
                      setIsUserWebSearch((isUserWebSearch) => !isUserWebSearch)
                      document.getElementById("searchInput")?.focus()
                    }}
                    actionName="Toggle web search"
                    addClassName={
                      isUserWebSearch ? "actionsButtonWebSearchActivated" : ""
                    }
                  />
                  <SearchInput
                    ref={searchInputRef}
                    groupItems={groupItems}
                    value={searchTerms}
                    onChange={(e) => {
                      setSearchTerms(e.currentTarget.value)
                    }}
                    setIsSearchNotFound={setIsSearchNotFound}
                    selectedListIndex={selectedListIndex}
                    searchType={searchType}
                    setFuzzyItems={setFuzzyItems}
                    fuzzyItems={fuzzyItems}
                    setSelectedListIndex={setSelectedListIndex}
                    searchTerms={searchTerms}
                    rowDisplay={rowDisplay}
                    context={context}
                    baseItems={baseItems}
                  />
                  <UserNotification userNotification={userNotification} />
                  <ActionButton id="actionButtonContext" disabled>
                    {countCurrentItems()}
                    &#x2713;
                  </ActionButton>
                  <VerticalActionsView
                    setRowDisplay={setRowDisplay}
                    rowDisplay={rowDisplay}
                    searchTerms={searchTerms}
                    isUserWebSearch={isUserWebSearch}
                    setIsUserWebSearch={setIsUserWebSearch}
                    context={context}
                    setContext={setContext}
                    setPreviousContext={setPreviousContext}
                    fuzzyItems={fuzzyItems}
                    baseItems={baseItems}
                    groupItems={groupItems}
                    setGroupItems={setGroupItems}
                    selectedListIndex={selectedListIndex}
                    setFuzzyItems={setFuzzyItems}
                    setBaseItems={setBaseItems}
                    setSelectedListIndex={setSelectedListIndex}
                    setShowEditionTab={setShowEditionTab}
                    setShowGroupEditionTab={setShowGroupEditionTab}
                  />
                </div>
                <div className="row" id="listContainer">
                  {
                    <ListContainer
                      searchInputRef={searchInputRef}
                      groupItems={groupItems}
                      setGroupItems={setGroupItems}
                      rowDisplay={rowDisplay}
                      selectedListIndex={selectedListIndex}
                      fuzzyItems={fuzzyItems}
                      setFuzzyItems={setFuzzyItems}
                      setBaseItems={setBaseItems}
                      setSelectedListIndex={setSelectedListIndex}
                      setShowEditionTab={setShowEditionTab}
                      context={context}
                      listRef={listRef}
                      restoreDefaults={restoreDefaults}
                      isSearchNotFound={isSearchNotFound}
                      isUserWebSearch={isUserWebSearch}
                      searchTerms={searchTerms}
                    />
                  }
                  {(isSearchNotFound || isUserWebSearch) && !isLoading && (
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
              </div>
            )}
            {showEditionTab && (
              <BookmarksEditor
                ref={editRefs}
                onSubmit={handleEditBookmarkFormSubmit}
                onBackToList={() => setShowEditionTab(false)}
                selectedItem={fuzzyItems[selectedListIndex] as BookmarkItem}
                bookmarksFolderIndex={bookmarksFolderIndex}
                context={context}
              />
            )}
            {showGroupEditionTab && (
              <GroupTabEditor
                onBackToList={() => setShowGroupEditionTab(false)}
                searchTerms={searchTerms}
                setShowGroupEditionTab={setShowGroupEditionTab}
                setSelectedListIndex={setSelectedListIndex}
                selectedListIndex={selectedListIndex}
                groupItems={groupItems}
                setGroupItems={setGroupItems}
                fuzzyItems={fuzzyItems}
                setFuzzyItems={setFuzzyItems}
                baseItems={baseItems}
                setBaseItems={setBaseItems}
                onSubmit={handleNewTabGroupFormSubmit}
              />
            )}
          </ShortcutListenerContainer>
        </Fragment>
      )}
    </SettingsProvider>
  )
}

export default App
