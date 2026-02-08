import { invoke } from "@tauri-apps/api/core"

import { ProfileItem } from "../domain/profiles/models"
import { GET_PROFILES_COMMAND, UPDATE_PROFILE_COMMAND } from "../utils/constants"
import { isErrorJsonString } from "../utils/strings"
import { runWithChrono } from "../utils/time"

export const fetchProfiles = async () => {
  return await runWithChrono(() =>
    invoke("mozeidon", {
      context: "profiles",
      args: GET_PROFILES_COMMAND,
    })
  )
}

type UpdatedProfile = {
  id: string
  name: string
  alias: string
  commandAlias: string
  rank: number
}
export const updateProfile = async (newProfile: ProfileItem, oldProfile: ProfileItem): Promise<ProfileItem> => {
  const args = [
    ...(UPDATE_PROFILE_COMMAND + getProfileIdArg(newProfile)).split(" "),
    "-c",
    `${newProfile.profileCommandAlias}`,
    "-a",
    `${newProfile.profileAlias}`,
    "-r",
    `${newProfile.profileRank}`,
  ]
  try {
    const updated = await invoke("mozeidon_write", { args })
    if (isErrorJsonString(updated)) {
      return oldProfile
    }
    const received: UpdatedProfile = JSON.parse(updated as string)
    return {
      ...newProfile,
      profileId: received.id,
      profileName: received.name,
      profileRank: received.rank,
      profileAlias: received.alias,
      profileCommandAlias: received.commandAlias,
    }
  } catch (e) {
    return oldProfile
  }
}

export const getProfileIdArg = (profile: ProfileItem | undefined) => {
  return profile ? ` --profile-id ${profile.profileId}` : ""
}
