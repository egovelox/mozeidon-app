import { ProfileItem } from "../domain/profiles/models"
import { logEmit } from "./logEmitter"

export function getStartingProfile(
  currentProfile: ProfileItem | undefined,
  receivedProfiles: ProfileItem[]
): ProfileItem | undefined {
  if (!receivedProfiles.length) {
    return undefined
  }
  logEmit(`current profile: ${currentProfile?.profileName} ${currentProfile?.profileAlias}`)
  if (currentProfile) {
    const foundCurrentProfile = receivedProfiles.find((profile) => profile.profileId == currentProfile.profileId)
    if (foundCurrentProfile) {
      return foundCurrentProfile
    }
  }
  const sortedReceivedProfiles = sortProfiles(receivedProfiles)
  return receivedProfiles.filter((p) => p.profileId === sortedReceivedProfiles[0].profileId)[0]
}

export function sortProfiles(profiles: ProfileItem[]) {
  return profiles
    .map((profile) => ({
      ...profile,
      registeredAt: new Date(profile.registeredAt),
    }))
    .sort((p1, p2) => p2.registeredAt.getTime() - p1.registeredAt.getTime())
    .sort((p1, p2) => p2.profileRank - p1.profileRank)
    .map((profile) => ({
      ...profile,
      registeredAt: profile.registeredAt.toISOString(),
    }))
}
