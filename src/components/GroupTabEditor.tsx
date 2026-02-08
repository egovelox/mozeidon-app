import { updateTabAction } from "../actions/actions"
import { Items } from "../domain/ItemModel"
import { ProfileItem } from "../domain/profiles/models"
import { GroupItem, TabItem } from "../domain/tabs/models"
import { Utils } from "../utils/utils"

interface NewTabGroupFormElements extends HTMLFormControlsCollection {
  groupColor: HTMLInputElement
  groupTitle: HTMLInputElement
}

export interface NewTabGroupFormContent extends HTMLFormElement {
  readonly elements: NewTabGroupFormElements
}

interface GroupTabEditorProps {
  selectedListIndex: number
  currentProfile: ProfileItem | undefined
  searchTerms: string
  groupItems: GroupItem[]
  fuzzyItems: TabItem[]
  baseItems: TabItem[]
  setGroupItems: React.Dispatch<React.SetStateAction<GroupItem[]>>
  setSelectedListIndex: React.Dispatch<React.SetStateAction<number>>
  setBaseItems: React.Dispatch<React.SetStateAction<Items>>
  setFuzzyItems: React.Dispatch<React.SetStateAction<Items>>
  setShowGroupEditionTab: React.Dispatch<React.SetStateAction<boolean>>
  onBackToList: () => void
  onSubmit: React.FormEventHandler<NewTabGroupFormContent>
}

export const GroupTabEditor = ({
  selectedListIndex,
  currentProfile,
  setSelectedListIndex,
  searchTerms,
  groupItems,
  fuzzyItems,
  baseItems,
  setGroupItems,
  setBaseItems,
  setFuzzyItems,
  setShowGroupEditionTab,
  onBackToList,
  onSubmit,
}: GroupTabEditorProps) => {
  const tab = fuzzyItems[selectedListIndex] as TabItem
  const isLastListTab = selectedListIndex === fuzzyItems.length - 1
  const colors = ["blue", "cyan", "green", "grey", "orange", "pink", "purple", "red", "yellow"]
  if (!tab) return null
  const handleClickExistingGroup = (groupId: number) => async () => {
    // first of all, remove the tab from the list
    let listCopy = [...baseItems].filter((t) => t.id !== tab.id) as TabItem[]
    const listSearchableCopy = ([...fuzzyItems] as TabItem[]).filter((_, i) => i !== selectedListIndex)
    const groupItemsCopy = [...groupItems]
    const groupIndex = Utils.findIndex(groupItems, groupId)
    const group = groupItemsCopy[groupIndex]
    const groupListIndex = baseItems.findIndex((t) => t.type === "group" && t.groupId === group.id)
    // check the destination group is valid
    if (!group || !group.tabs.length || groupListIndex === -1) return

    // call browser to group Tab
    await updateTabAction(currentProfile, tab.id, tab.windowId, {
      groupId: group.id,
    })

    const oldIndex = tab.index
    const firstTabOfGroup = group.tabs[1]
    const lastTabOfGroup = group.tabs[group.tabs.length - 1]
    const isTabMovingDown = oldIndex < firstTabOfGroup.index
    const newIndex = isTabMovingDown ? firstTabOfGroup.index - 1 : lastTabOfGroup.index + 1

    const updatedTab: TabItem = {
      ...tab,
      index: newIndex,
      groupId,
      groupTitle: group.title,
      pinned: false,
    }
    if (isTabMovingDown) {
      group.tabs.splice(1, 0, updatedTab)
    } else {
      group.tabs.push(updatedTab)
    }
    groupItemsCopy.splice(groupIndex, 1, group)

    // Inside each group, rearrange tabs index for concerned tabs
    for (const groupItemsCopyGroup of groupItemsCopy) {
      for (const groupedTab of groupItemsCopyGroup.tabs) {
        if (groupedTab.type === "tab" && groupedTab.id !== tab.id) {
          groupedTab.index = groupedTab.index + getIndexShift(oldIndex, newIndex, groupedTab)
        }
      }
    }
    if (!group.collapsed) {
      const previousTabIndex = Utils.findIndex(baseItems, isTabMovingDown ? firstTabOfGroup.id : lastTabOfGroup.id)
      if (isTabMovingDown) {
        listCopy.splice(previousTabIndex - 1, 0, updatedTab)
      } else {
        listCopy.splice(previousTabIndex + 1, 0, updatedTab)
      }
    }

    // Inside list, rearrange tabs index for concerned tabs
    for (const listCopyTab of listCopy) {
      const groupIndex = Utils.findIndex(groupItemsCopy, listCopyTab.groupId)
      if (groupIndex !== -1) {
        // index was already updated above
        if (!groupItemsCopy[groupIndex].collapsed) {
          continue
        }
      }
      listCopyTab.index = listCopyTab.index + getIndexShift(oldIndex, newIndex, listCopyTab)
    }

    // prevent problem when tab is the last tab in list and when group is collapsed
    if (isLastListTab && group.collapsed) {
      setSelectedListIndex(selectedListIndex - 1)
    }

    setGroupItems(groupItemsCopy)
    if (searchTerms === "") {
      setBaseItems(listCopy)
      setFuzzyItems(listCopy)
    } else {
      setBaseItems(listCopy)
      setFuzzyItems(listSearchableCopy)
    }
    setShowGroupEditionTab(false)
  }
  return (
    <div className="groupTabEditorView">
      <div className="settingsContent settingsContentSmall">
        {groupItems.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: ".9em",
            }}
          >
            <h4>
              <span className="mozeidonColor">Tab title: </span>
              <span>{`${tab.title} `}</span> <br /> <br />
              Move this tab inside one of your groups ...
            </h4>
            <div style={{ display: "flex", flexWrap: "wrap", fontSize: ".9em" }}>
              {groupItems.map((g, i) => {
                return (
                  <button
                    key={g.id}
                    autoFocus={i === 0}
                    onClick={handleClickExistingGroup(g.id)}
                    style={{ fontSize: ".9em" }}
                    className={`actionButton actionButtonSmall tabGroupColor${g.color}`}
                  >
                    {g.title}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", fontSize: ".9em" }}>
          <br />
          {groupItems.length > 0 && <h4>... or into a new group</h4>}
          {groupItems.length === 0 && <h4>Group this tab into a new group</h4>}
          <form
            onSubmit={(e: React.FormEvent<NewTabGroupFormContent>) => {
              // create a new group
              onSubmit(e)
            }}
          >
            <div className="formFieldContainer">
              <label className="row formLabel">
                <span>&#x27A4; title</span>
              </label>
              <input
                autoComplete="off"
                autoCorrect="off"
                placeholder="Choose a group title"
                className={`actionRow editInput`}
                defaultValue={""}
                name="groupTitle"
              />
              <label className="row formLabel">
                <span>&#x27A4; color</span>
              </label>
              <div className="radioGroup">
                {colors.map((color, i) => {
                  return i === 0 ? (
                    <label>
                      <input type="radio" name="groupColor" value={color} defaultChecked />
                      <span className={`tabGroupColor${color}`} style={{ borderRadius: "4px" }}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                    </label>
                  ) : (
                    <label style={{ marginLeft: "1em" }}>
                      <input type="radio" name="groupColor" value={color} />
                      <span className={`tabGroupColor${color}`} style={{ borderRadius: "4px" }}>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div className="actionContainer">
              <button className="actionButton mozeidonColor" type="submit">
                Create a group &#x2713;
              </button>
              <button className="actionButton" onClick={onBackToList}>
                &#8617; Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function getIndexShift(oldIndex: number, newIndex: number, item: TabItem): -1 | 0 | 1 {
  if (item.type !== "tab") return 0

  const idx = item.index

  // moving down
  if (oldIndex < newIndex) {
    if (idx > oldIndex && idx <= newIndex) return -1

    // moving up
  } else if (oldIndex > newIndex) {
    if (idx >= newIndex && idx < oldIndex) return 1
  }

  return 0
}
