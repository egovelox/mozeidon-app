import md5 from "md5"
import { Fragment, KeyboardEvent, useEffect, useRef, useState } from "react"
import { FixedSizeList as List } from "react-window"

import "./App.css"
import {
  createBookmarkAction,
  switchTabAction,
  updateBookmarkAction,
  newGroupTab,
  closeTabAction,
} from "./actions/actions"
import { fetchBookmarks } from "./actions/bookmarks"
import { fetchHistory } from "./actions/history"
import { fetchProfiles } from "./actions/profiles"
import { fetchRecentlyClosedTabs, fetchTabs, fetchTabsLatestFirst, fetchTabsWithGroups } from "./actions/tabs"
import MaximizeIcon from "./assets/maximize.svg?react"
import SearchExactIcon from "./assets/searchExact.svg?react"
import SearchFuzzyIcon from "./assets/searchFuzzy.svg?react"
import SettingsIcon from "./assets/settings.svg?react"
import WebSearchIcon from "./assets/websearch.svg?react"
import { ActionsRow } from "./components/ActionsRow"
import { BookmarksEditor, EditRefs } from "./components/BookmarksEditor"
import { Error } from "./components/Error"
import { GroupTabEditor, NewTabGroupFormContent } from "./components/GroupTabEditor"
import { ListContainer } from "./components/List"
import { ProfileSelector } from "./components/ProfileSelector"
import { SearchInput } from "./components/SearchInput"
import { SettingsView } from "./components/SettingsView"
import { ShortcutListenerContainer } from "./components/ShortcutListenerContainer"
import { UserNotification } from "./components/UserNotification"
import { VerticalActionsView } from "./components/VerticalActionsView"
import { WebSearchListContainer } from "./components/WebSearchListContainer"
import { WindowShortcutListener } from "./components/WindowShortcutListener"
import { Items } from "./domain/ItemModel"
import { BookmarkItem } from "./domain/bookmarks/models"
import { BmFormElement } from "./domain/bookmarks/validation"
import { HistoryItem } from "./domain/history/models"
import { ProfileItem } from "./domain/profiles/models"
import { AppSettings, Settings } from "./domain/settings/models"
import { GroupItem, TabItem, TabsWithGroups, Window } from "./domain/tabs/models"
import { setLastVisitedPosition } from "./hooks/effects/setLastVisitedPosition"
import { useInit } from "./hooks/useInit"
import { SettingsProvider } from "./hooks/useSettings"
import { useNotification } from "./hooks/useUserNotification"
import { FolderIndex } from "./utils/bookmarksFolderIndex"
import { Context, RowDisplay } from "./utils/constants"
import { getLastVisitedTabIndex, getPreviousVisitedTabIndex, getWindowTabsAndGroups } from "./utils/getOrderedTabs"
import { getStartingProfile } from "./utils/getStartingProfile"
import { useListNavigation } from "./utils/itemsInViewPort"
import { keyDownHandler } from "./utils/keyDownHandler"
import { toggleSearchType, SearchType } from "./utils/searchHandler"
import { isErrorJsonString, numberWithSpaces } from "./utils/strings"
import { insertTabGroups } from "./utils/tabGroups"
import { pause } from "./utils/time"
import { SwellUi } from "./utils/ui"
import { Utils } from "./utils/utils"

let bookmarksCachedItems: Items = []
let bookmarksFolderIndex: {
  profile: ProfileItem | undefined
  folders: FolderIndex
} = { profile: undefined, folders: null! }
let bookmarksCachedItemsHash = md5(JSON.stringify(bookmarksCachedItems))
let isHandlerBusy = false

const withHandlerLock = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
  if (isHandlerBusy) {
    return null
  }
  isHandlerBusy = true
  try {
    return await fn()
  } finally {
    isHandlerBusy = false
  }
}

window.DEBUG = true

function App() {
  useInit()
  const { notify, userNotification } = useNotification()
  const [receivedTabs, setReceivedTabs] = useState<TabsWithGroups>()
  const [context, setContext] = useState<Context>(Context.None)
  const [error, setError] = useState("")
  const [previousContext, setPreviousContext] = useState<Context>(Context.None)
  const [groupItems, setGroupItems] = useState<GroupItem[]>([])
  // a list where all items remain present
  const [baseItems, setBaseItems] = useState<Items>([])
  // on the opposite, a list where items can be filtered depending on searchTerms
  const [fuzzyItems, setFuzzyItems] = useState<Items>([])
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [currentProfile, setCurrentProfile] = useState<ProfileItem | undefined>()
  const [windows, setWindows] = useState<Window[]>([])
  const [currentWindow, setCurrentWindow] = useState<Window>()
  const currentProfileRef = useRef(currentProfile)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchNotFound, setIsSearchNotFound] = useState(false)
  const [isUserWebSearch, setIsUserWebSearch] = useState(false)
  const [rowDisplay, setRowDisplay] = useState<RowDisplay>(RowDisplay.OneLine)
  const [searchTerms, setSearchTerms] = useState("")
  const [searchType, setSearchType] = useState<SearchType>(SearchType.Exact)
  const [selectedListIndex, setSelectedListIndex] = useState(0)
  const [selectedWebSearchListIndex, setSelectedWebSearchListIndex] = useState(0)
  const [showEditionTab, setShowEditionTab] = useState(false)
  const [showGroupEditionTab, setShowGroupEditionTab] = useState(false)
  const editRefs = useRef<EditRefs>(null)
  const listRef = useRef<List>(null)

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
    setProfiles([])
    setWindows([])
    setReceivedTabs(undefined)
    /*
     * currentProfile and currentWindow states
     * are not always restored
     */
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
    SwellUi.listenEvent((event) => {
      if (event.payload.isVisible) {
        /*
         * Note that the SettingsView is shown when the user clicked the OS menu-bar.
         * We set previousContext to None
         * so the SettingsView will not show a Back button.
         * ( see showBackButton in SettingsView props )
         */
        setPreviousContext(Context.None)
        setContext(Context.Settings)
        SwellUi.show()
      } else {
        restoreDefaults()
        SwellUi.hide()
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

  // Effect to set position on last accessed tab when tabs Panel loads
  useEffect(() => {
    if (!listRef.current || !currentWindow || !receivedTabs || isLoading || context !== Context.Tabs) {
      return
    }
    const { tabs, groupItems, groups } = getWindowTabsAndGroups({
      currentWindow,
      received: receivedTabs,
    })
    insertTabGroups(tabs, groups, groupItems)
    setBaseItems(tabs)
    setFuzzyItems(tabs)
    setGroupItems(groupItems)
    const setPositionOnLastAccessedTab = async () => {
      const { index, changes } = await getLastVisitedTabIndex(currentProfile, tabs as TabItem[], groupItems)

      if (!changes) {
        setLastVisitedPosition(index, setSelectedListIndex, rowDisplay, listRef)
      } else {
        const { newList, newGroups } = changes
        setFuzzyItems(newList)
        setBaseItems(newList)
        setGroupItems(newGroups)
        setLastVisitedPosition(index, setSelectedListIndex, rowDisplay, listRef)
      }

      // then we can fetch bookmarks ( to get folders )
      await getLazyBookmarks(currentProfile)
    }
    setPositionOnLastAccessedTab()
  }, [isLoading])

  useEffect(() => {
    // when currentWindow is changed inside the currentProfile
    if (!isLoading && context === Context.Tabs) {
      tabsHandler()
    }
  }, [currentWindow])

  useEffect(() => {
    if (!isLoading) {
      currentProfileRef.current = currentProfile
      switch (context) {
        case Context.Tabs:
          tabsHandler()
          break
        case Context.Bookmarks:
          bookmarksHandler()
          break
        case Context.History:
          historyHandler()
          break
        case Context.RecentlyClosed:
          recentlyClosedTabsHandler()
          break
        case Context.Settings:
        case Context.None:
        default:
          break
      }
    }
  }, [currentProfile])

  const countCurrentItems = () => {
    if (context === Context.Tabs) {
      let collapsedTabsCount = 0
      if (groupItems.length !== 0) {
        collapsedTabsCount = groupItems
          .filter((g) => g.collapsed)
          .flatMap((g) => g.tabs)
          .filter((t) => t.type === "tab").length
      }
      const f = fuzzyItems as TabItem[]
      if (searchTerms.length === 0) {
        const count = f.filter((t) => t.type === "tab").length + collapsedTabsCount
        return `${numberWithSpaces(Math.max(count, 0))} ${context} `
      } else {
        const count = f.filter((t) => t.type === "tab").length
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
    await SwellUi.show()
    await profilesHandler()
    setIsLoading(false)
  }

  /*
   * This handler simply redirects to Settings without invoking profilesHandler(),
   * allowing to access SettingsView when an error somehow happens.
   */
  const settingsSafeHandler = async () => {
    restoreDefaults()
    setPreviousContext(Context.None)
    setContext(Context.Settings)
    await SwellUi.show()
    setIsLoading(false)
  }

  const profilesHandler = async (): Promise<ProfileItem | undefined> => {
    //setCurrentWindow(undefined)
    const { res } = await fetchProfiles()
    if (!Utils.handleError(res, setError)) {
      const received: ProfileItem[] = Utils.jsonParse(res)
      const startingProfile = getStartingProfile(currentProfileRef.current, received)
      if (!startingProfile) {
        const errorMessage = `Did not found any connected profile.`
        setError(errorMessage)
      } else {
        setProfiles(received)
        setCurrentProfile(startingProfile)
        currentProfileRef.current = startingProfile
        return startingProfile
      }
    }
  }

  const tabsHandler = async () => {
    await withHandlerLock(async () => {
      restoreDefaults()
      const profile = await profilesHandler()
      await SwellUi.show()
      setContext(Context.Tabs)
      const { res, duration } = await fetchTabsWithGroups(profile)
      if (!Utils.handleError(res, setError)) {
        const received: TabsWithGroups = Utils.jsonParse(res)
        const receivedCurrentWindow = received.windows.find((w) => w.isLastFocused)
        setReceivedTabs(received)
        setWindows(received.windows)
        /*
         * when the user changed window in the same profile,
         * we keep the currentWindow state
         */
        if (!currentWindow) {
          setCurrentWindow(receivedCurrentWindow)
        }
        notify(`✓ took ${duration} ms`)
        /*
         * Note: useEffect[currentWindow] will run once isLoading is set to false
         * Caution: avoid fetch actions below it
         * or this might create concurrency in mozeidon cli
         * leading to weird behaviour
         *
         * pause 1ms to ensure that useEffect[currentWindow] is triggered
         * after all other states above are set.
         */
        await pause(1)
        setIsLoading(false)
      }
    })
  }

  const getLazyBookmarks = async (profile: ProfileItem | undefined) => {
    /*
     * this condition below allows to get bookmarks only if
     * - the bookmarks folders are missing
     * - the bookmarks of the current-profile are missing
     */
    if (!bookmarksFolderIndex.folders || bookmarksFolderIndex.profile?.profileId !== profile?.profileId) {
      const { res } = await fetchBookmarks(bookmarksCachedItemsHash, profile)
      if (!Utils.handleError(res, setError)) {
        if (res === "bookmarks_synchronized") {
          return
        }
        const items: BookmarkItem[] = Utils.jsonParse(res)
        bookmarksCachedItemsHash = md5(res as string)
        bookmarksCachedItems = items
        bookmarksFolderIndex = {
          profile: profile,
          folders: new FolderIndex(items.map((i) => i.parent)),
        }
      }
    }
  }

  const historyHandler = async () => {
    await withHandlerLock(async () => {
      restoreDefaults()
      const profile = await profilesHandler()
      setContext(Context.History)
      await SwellUi.show()
      const { res, duration } = await fetchHistory(profile)
      if (!Utils.handleError(res, setError)) {
        const items: HistoryItem[] = Utils.jsonParse(res)
        setBaseItems(items)
        setFuzzyItems(items)
        notify(`✓ took ${duration} ms`)
        setIsLoading(false)
        await getLazyBookmarks(profile)
      }
    })
  }

  const recentlyClosedTabsHandler = async () => {
    await withHandlerLock(async () => {
      restoreDefaults()
      const profile = await profilesHandler()
      /* show ui */
      setContext(Context.RecentlyClosed)
      await SwellUi.show()
      const { res, duration } = await fetchRecentlyClosedTabs(profile)
      if (!Utils.handleError(res, setError)) {
        const items: TabItem[] = Utils.jsonParse(res)
        setBaseItems(items)
        setFuzzyItems(items)
        notify(`✓ took ${duration} ms`)
        setIsLoading(false)
        await getLazyBookmarks(profile)
      }
    })
  }

  const bookmarksHandler = async () => {
    await withHandlerLock(async () => {
      restoreDefaults()
      const profile = await profilesHandler()
      /* show ui */
      setContext(Context.Bookmarks)
      await SwellUi.show()
      const { res, duration } = await fetchBookmarks(bookmarksCachedItemsHash, profile)
      if (!Utils.handleError(res, setError)) {
        if (res === "bookmarks_synchronized") {
          setBaseItems(bookmarksCachedItems)
          setFuzzyItems(bookmarksCachedItems)
          setIsLoading(false)
          notify(`✓ took ${duration} ms`)
        } else {
          const items: BookmarkItem[] = Utils.jsonParse(res)
          bookmarksCachedItemsHash = md5(res as string)
          bookmarksCachedItems = items
          bookmarksFolderIndex = {
            profile: profile,
            folders: new FolderIndex(items.map((i) => i.parent)),
          }
          setBaseItems(bookmarksCachedItems)
          setFuzzyItems(bookmarksCachedItems)
          setIsLoading(false)
          notify(`✓ took ${duration} ms`)
        }
      }
    })
  }

  const switchLastVisitedTabHandler = async (settings: Settings) => {
    /* First hide the panel if it's currently open */
    SwellUi.hide()
    const profile = await profilesHandler()
    restoreDefaults()
    const { res } = await fetchTabs(profile)
    if (!Utils.handleError(res, setError)) {
      const received: TabsWithGroups = Utils.jsonParse(res)
      const receivedCurrentWindow = received.windows.find((w) => w.isLastFocused)
      const currentWindowTabs = received.tabs.filter((t) => t.windowId === receivedCurrentWindow?.id)
      const lastVisitedTab = currentWindowTabs[getPreviousVisitedTabIndex(currentWindowTabs as TabItem[])]
      await switchTabAction(profile, `${lastVisitedTab.windowId}:${lastVisitedTab.id}`)
      restoreDefaults()
    }
  }

  const closeCurrentTabTabHandler = async (settings: Settings) => {
    /* First hide the panel if it's currently open */
    SwellUi.hide()
    restoreDefaults()
    const profile = await profilesHandler()
    const { res } = await fetchTabsLatestFirst(profile)
    if (!Utils.handleError(res, setError)) {
      const received: TabsWithGroups = Utils.jsonParse(res)
      const receivedCurrentWindow = received.windows.find((w) => w.isLastFocused)
      const currentWindowTabs = received.tabs.filter((t) => t.windowId === receivedCurrentWindow?.id)
      const currentTab = currentWindowTabs.length ? currentWindowTabs[0] : null
      if (currentTab) {
        await switchTabAction(profile, `${currentTab.windowId}:${currentTab.id}`)
        await closeTabAction(profile, `${currentTab.windowId}:${currentTab.id}`)
      }
      restoreDefaults()
    }
  }

  /* Handle KeyDown : where in-app user keypresses are listened to */
  const handleKeyDown = (event: KeyboardEvent, settings: AppSettings) =>
    keyDownHandler({
      listRef,
      searchTerms,
      searchInputRef,
      currentProfile,
      rowDisplay,
      event,
      settings,
      context,
      fuzzyItems,
      baseItems,
      groupItems,
      showEditionTab,
      showGroupEditionTab,
      selectedListIndex,
      selectedWebSearchListIndex,
      isWebSearch: isSearchNotFound || isUserWebSearch,
      notify,
      restoreDefaults,
      setFuzzyItems,
      setBaseItems,
      setGroupItems,
      setShowEditionTab,
      setSelectedListIndex,
      setSelectedWebSearchListIndex,
    })

  /* Handle New Tab Group Form submit */
  const handleNewTabGroupFormSubmit = async (e: React.FormEvent<NewTabGroupFormContent>) => {
    // Prevent the UI from reloading the page
    e.preventDefault()
    const { groupTitle, groupColor } = e.currentTarget.elements
    const tabList = baseItems as TabItem[]
    // spot the tab using fuzzyItems because user may have searched and filtered items.
    const tab = (fuzzyItems as TabItem[])[selectedListIndex]
    // retrieve the position in tabList
    const tabListPosition = Utils.findIndex(tabList, tab.id)
    const newGroupId = await newGroupTab(tab.id, tab.windowId, groupTitle.value, groupColor.value, currentProfile)
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
  const handleEditBookmarkFormSubmit = async (e: React.FormEvent<BmFormElement>) => {
    // Prevent the browser from reloading the page
    e.preventDefault()
    const { title, url, folderPath } = e.currentTarget.elements
    if (context === Context.Tabs) {
      await createBookmarkAction(title.value, url.value, folderPath.value, currentProfile)
      setShowEditionTab(false)
      notify("✓ bookmark created")
    }

    if (context === Context.Bookmarks) {
      const bookmarkId = (fuzzyItems as BookmarkItem[])[selectedListIndex].id
      await updateBookmarkAction(bookmarkId, title.value, url.value, folderPath.value)
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
      notify("✓ bookmark updated")
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
            await SwellUi.hide()
          }}
        />
        <Error error={error} redirectCallback={settingsSafeHandler} />
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
          await SwellUi.hide()
        }}
      />
      {context === Context.Settings ? (
        <SettingsView
          currentProfile={currentProfile}
          profiles={profiles}
          context={context}
          showBackButton={previousContext !== Context.None}
          setProfiles={setProfiles}
          restoreDefaults={restoreDefaults}
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
                    Icon={SettingsIcon}
                  />
                  <ActionsRow
                    action={async () => {
                      setSearchType(toggleSearchType(searchType))
                      Utils.focusSearchInput()
                    }}
                    actionName={
                      searchType === SearchType.Exact ? `${SearchType.Exact} match` : `${SearchType.Fuzzy} match`
                    }
                    Icon={searchType === SearchType.Exact ? SearchExactIcon : SearchFuzzyIcon}
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
                      Utils.focusSearchInput()
                    }}
                    actionName="Toggle list layout"
                    Icon={MaximizeIcon}
                  />
                  <ActionsRow
                    Icon={WebSearchIcon}
                    actionName={isUserWebSearch ? "back to list" : "open new tab via search-engine"}
                    addClassName={isUserWebSearch ? "actionsButtonWebSearchActivated" : ""}
                    action={async () => {
                      setIsUserWebSearch((isUserWebSearch) => !isUserWebSearch)
                      Utils.focusSearchInput()
                    }}
                  />
                  <SearchInput
                    ref={searchInputRef}
                    currentProfile={currentProfile}
                    groupItems={groupItems}
                    value={searchTerms}
                    selectedListIndex={selectedListIndex}
                    searchType={searchType}
                    fuzzyItems={fuzzyItems}
                    searchTerms={searchTerms}
                    rowDisplay={rowDisplay}
                    context={context}
                    baseItems={baseItems}
                    setIsSearchNotFound={setIsSearchNotFound}
                    setFuzzyItems={setFuzzyItems}
                    setSelectedListIndex={setSelectedListIndex}
                    onChange={(e) => {
                      setSearchTerms(e.currentTarget.value)
                    }}
                  />
                  <ProfileSelector
                    profiles={profiles}
                    currentProfile={currentProfile}
                    windows={windows}
                    currentWindow={currentWindow}
                    setCurrentProfile={setCurrentProfile}
                    setCurrentWindow={setCurrentWindow}
                    currentItemsCount={countCurrentItems()}
                  />
                  <VerticalActionsView
                    context={context}
                    currentProfile={currentProfile}
                    searchTerms={searchTerms}
                    isUserWebSearch={isUserWebSearch}
                    selectedListIndex={selectedListIndex}
                    fuzzyItems={fuzzyItems}
                    baseItems={baseItems}
                    groupItems={groupItems}
                    setGroupItems={setGroupItems}
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
                      currentProfile={currentProfile}
                      groupItems={groupItems}
                      rowDisplay={rowDisplay}
                      selectedListIndex={selectedListIndex}
                      fuzzyItems={fuzzyItems}
                      context={context}
                      listRef={listRef}
                      isSearchNotFound={isSearchNotFound}
                      isUserWebSearch={isUserWebSearch}
                      searchTerms={searchTerms}
                      setFuzzyItems={setFuzzyItems}
                      setBaseItems={setBaseItems}
                      setGroupItems={setGroupItems}
                      setSelectedListIndex={setSelectedListIndex}
                      setShowEditionTab={setShowEditionTab}
                      restoreDefaults={restoreDefaults}
                    />
                  }
                  {(isSearchNotFound || isUserWebSearch) && !isLoading && (
                    <WebSearchListContainer
                      listRef={listRef}
                      rowDisplay={rowDisplay}
                      selectedWebSearchListIndex={selectedWebSearchListIndex}
                      searchTerms={searchTerms}
                      setSelectedWebSearchListIndex={setSelectedWebSearchListIndex}
                    />
                  )}
                </div>
                <UserNotification userNotification={userNotification} />
              </div>
            )}
            {showEditionTab && (
              <BookmarksEditor
                ref={editRefs}
                selectedItem={fuzzyItems[selectedListIndex] as BookmarkItem}
                bookmarksFolderIndex={bookmarksFolderIndex.folders}
                onSubmit={handleEditBookmarkFormSubmit}
                onBackToList={() => setShowEditionTab(false)}
                context={context}
              />
            )}
            {showGroupEditionTab && (
              <GroupTabEditor
                currentProfile={currentProfile}
                searchTerms={searchTerms}
                selectedListIndex={selectedListIndex}
                groupItems={groupItems}
                baseItems={baseItems as TabItem[]}
                fuzzyItems={fuzzyItems as TabItem[]}
                onBackToList={() => setShowGroupEditionTab(false)}
                setShowGroupEditionTab={setShowGroupEditionTab}
                setSelectedListIndex={setSelectedListIndex}
                setGroupItems={setGroupItems}
                setFuzzyItems={setFuzzyItems}
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
