import { useEffect, useRef, useState } from "react"
import CreatableSelect, { MenuListProps, SingleValue, components } from "react-select"

import { ProfileItem } from "../domain/profiles/models"
import { Window } from "../domain/tabs/models"
import { useSettings } from "../hooks/useSettings"
import { getKeyCombination } from "../utils/getKeyCombination"
import { sortProfiles } from "../utils/getStartingProfile"
import { truncateString } from "../utils/strings"
import { Utils } from "../utils/utils"

interface ProfileSelectorProps {
  currentProfile: ProfileItem | undefined
  profiles: ProfileItem[]
  currentWindow: Window | undefined
  windows: Window[]
  currentItemsCount: string
  setCurrentProfile: React.Dispatch<React.SetStateAction<ProfileItem | undefined>>
  setCurrentWindow: React.Dispatch<React.SetStateAction<Window | undefined>>
}

enum OptionType {
  PROFILE = "profile",
  WINDOW = "window",
}

type ProfileOption = {
  value: string
  label: string
  type: OptionType
  isDisabled?: boolean
}
type WindowOption = {
  value: string
  label: string
  type: OptionType
  isDisabled?: boolean
}
export type GroupedOption = {
  readonly label: string
  readonly options: readonly ProfileOption[] | readonly WindowOption[]
}

export const ProfileSelector = ({
  currentProfile,
  profiles,
  setCurrentProfile,
  currentItemsCount,
  currentWindow,
  windows,
  setCurrentWindow,
}: ProfileSelectorProps) => {
  const selectRef = useRef<any>(null)

  const getWindowLabel = (): string => {
    // no label when there is only one window
    if (windows.length < 2) {
      return ""
    }
    const index = windows.map((w, i) => ({ ...w, index: i })).find((w) => w.id === currentWindow?.id)?.index

    return `#${index !== undefined ? index + 1 : undefined}`
  }

  const [chosenProfile, setChosenProfile] = useState<ProfileOption | WindowOption | undefined>(
    currentProfile
      ? {
          type: OptionType.PROFILE,
          label: truncateString(currentProfile.profileAlias || currentProfile.profileName, 16) + ` ${getWindowLabel()}`,
          value: currentProfile.profileId,
        }
      : undefined
  )

  useEffect(() => {
    if (currentProfile) {
      setChosenProfile({
        type: OptionType.PROFILE,
        label: truncateString(currentProfile.profileAlias || currentProfile.profileName, 16) + ` ${getWindowLabel()}`,
        value: currentProfile.profileId,
      })
    } else {
      setChosenProfile(undefined)
    }
  }, [currentProfile, currentWindow])

  const {
    settings: {
      appSettings: { shortcut_list_up, shortcut_list_down, shortcut_hide_panel },
    },
  } = useSettings()

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const keyCombo = getKeyCombination(e)
    const menu = document.querySelector(".profileSelector__menu")

    if (e.key === "Enter") {
      e.stopPropagation()
      if (!menu) {
        selectRef.current?.focus()
        selectRef.current?.onMenuOpen()
      }
    }

    if (e.key === "Escape") {
      if (menu) {
        e.preventDefault()
        e.stopPropagation()
        selectRef.current?.onMenuClose()
        Utils.focusSearchInput()
      }
    }

    if (keyCombo.toLowerCase() === shortcut_hide_panel.toLowerCase()) {
      if (menu) {
        e.preventDefault()
        e.stopPropagation()
        selectRef.current?.onMenuClose()
        Utils.focusSearchInput()
      }
    }

    if (keyCombo.toLowerCase() === shortcut_list_down.toLowerCase()) {
      e.preventDefault()
      e.stopPropagation()
      const down = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
      })
      e.currentTarget.dispatchEvent(down)
    }

    if (keyCombo.toLowerCase() === shortcut_list_up.toLowerCase()) {
      e.preventDefault()
      e.stopPropagation()
      const up = new KeyboardEvent("keydown", {
        key: "ArrowUp",
        bubbles: true,
      })
      e.currentTarget.dispatchEvent(up)
    }
  }

  const onChange = (option: SingleValue<ProfileOption | WindowOption>) => {
    if (!option) return
    Utils.focusSearchInput()
    switch (option.type) {
      case OptionType.PROFILE:
        setCurrentWindow(undefined)
        setChosenProfile(option)
        setCurrentProfile(profiles.find((p) => p.profileId === option.value))
        break
      case OptionType.WINDOW:
        setCurrentWindow(windows.find((w) => `${w.id}` === option.value))
        break
    }
  }

  const getOptions = (): GroupedOption[] => {
    const profileOptions = [
      ...new Set(
        sortProfiles(profiles).map(({ profileId, profileName, profileAlias }) => ({
          type: OptionType.PROFILE,
          label: truncateString(profileAlias || profileName, 16),
          value: profileId,
          isDisabled: currentProfile?.profileId === profileId,
        }))
      ),
    ].filter((o) => o.value !== chosenProfile?.value)

    const windowOptions = [
      ...new Set(
        windows.map(({ id }, index) => ({
          type: OptionType.WINDOW,
          label: `window #${index + 1}`,
          value: `${id}`,
          isDisabled: currentWindow?.id === id,
        }))
      ),
    ].filter((o) => o.value !== `${currentWindow?.id}`)

    return [
      {
        label: `window ${getWindowLabel()}`,
        options: windowOptions,
      },
      {
        label: `${currentProfile?.profileAlias || currentProfile?.profileName}`,
        options: profileOptions,
      },
    ]
  }

  // Custom Menu Component to display the "tip" above the options
  const customMenuList = (props: MenuListProps<ProfileOption | WindowOption, false, GroupedOption>) => {
    return (
      <components.MenuList {...props}>
        {props.children}
        {shouldShowTip(profiles) && (
          <div className="profileSelector__tip">
            &#x270E; Tip
            <br />
            you can alias your profiles.
            <br />
            go to Settings {">"} Browsers.
          </div>
        )}
      </components.MenuList>
    )
  }

  return (
    <div
      id="profileSelector"
      // Stop almoset all keyboard events from this component from bubbling
      onKeyDown={(e) => {
        const keyCombo = getKeyCombination(e)
        if (e.key !== "Escape" && keyCombo.toLowerCase() !== shortcut_hide_panel.toLowerCase()) {
          e.stopPropagation()
        }
      }}
    >
      <CreatableSelect<ProfileOption | WindowOption, false, GroupedOption>
        tabSelectsValue={false}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        components={{
          DropdownIndicator: () => null, // hide the dropdown arrow,
          MenuList: customMenuList, // custom menu component with tip
        }}
        formatOptionLabel={(option, { context }) => {
          // context is 'menu' when in dropdown, 'value' when selected
          if (context === "value") {
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div className="profileSelectorLabel1">{currentItemsCount} ✓</div>
                <div className="profileSelectorLabel2">{option.label}</div>
              </div>
            )
          }
          return option.label
        }}
        className="basic-single"
        classNamePrefix="profileSelector"
        placeholder={`loading...`}
        isClearable={false}
        isSearchable={false}
        value={chosenProfile}
        noOptionsMessage={() => null}
        ref={selectRef}
        onKeyDown={onKeyDown}
        options={getOptions()}
        onChange={onChange}
      />
    </div>
  )
}

function shouldShowTip(profiles: ProfileItem[]): boolean {
  const charactersDetectionRegEx = /[^a-zA-Z0-9 ]/

  const profileMap = new Map<string, ProfileItem[]>()

  // Loop through profiles to check conditions
  for (const profile of profiles) {
    const lowerCaseProfileName = profile.profileName.toLowerCase()

    if (!profileMap.has(lowerCaseProfileName)) {
      profileMap.set(lowerCaseProfileName, [])
    }

    profileMap.get(lowerCaseProfileName)?.push(profile)

    // Check if profileName contains non-alphabetical characters and no profileAlias
    if (charactersDetectionRegEx.test(profile.profileName) && !profile.profileAlias) {
      return true // Return true immediately if condition met
    }
  }

  // Check if any profile name has no alias, and if there are multiple profiles with the same name
  for (const [_, profilesWithSameName] of profileMap) {
    if (profilesWithSameName.length > 1) {
      const allProfilesHaveNoAlias = profilesWithSameName.every((profile) => !profile.profileAlias)
      if (allProfilesHaveNoAlias) {
        return true // Return true if found
      }
    }
  }

  return false // No conditions met
}
