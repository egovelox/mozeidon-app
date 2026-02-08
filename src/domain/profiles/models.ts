export type ProfileItem = {
  profileId: string
  profileName: string
  profileAlias: string
  profileCommandAlias: string
  profileRank: number
  registeredAt: string
}

export type Profile = {
  id: string
  label: string
  profileCommand: string
  rank: number
}
