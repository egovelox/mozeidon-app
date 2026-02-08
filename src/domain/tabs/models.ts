export type TabItem = {
  type: "tab" | "group"
  id: number
  domain: string
  title: string
  url: string
  windowId: number
  groupId: number
  pinned: boolean
  lastAccessed: number
  index: number
  groupTitle?: string
}

export type GroupItem = {
  id: number
  windowId: number
  title: string
  color: string
  collapsed: boolean
  tabs: TabItem[]
}

export type Group = {
  id: number
  windowId: number
  title: string
  color: string
  collapsed: boolean
}

export type Window = {
  id: number
  isLastFocused: boolean
}

export type Tab = {
  id: number
  domain: string
  title: string
  url: string
  windowId: number
  groupId: number
  pinned: boolean
  lastAccessed: number
  index: number
}

export type TabsWithGroups = {
  tabs: Tab[]
  groups: Group[]
  windows: Window[]
}
