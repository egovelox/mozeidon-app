import { ProfileItem } from "../domain/profiles/models"
import { getBrowserRedirectionCommand } from "../utils/getPlatform"

interface ProfileRowProps {
  profile: ProfileItem
  platform: string
  setProfiles: React.Dispatch<React.SetStateAction<ProfileItem[]>>
  setShowEditor: React.Dispatch<
    React.SetStateAction<{
      isVisible: boolean
      profile: ProfileItem | undefined
    }>
  >
}
export const ProfileRow = ({ profile, setShowEditor, platform }: ProfileRowProps) => {
  const browserRedirectionCommand = getBrowserRedirectionCommand(platform)
  return (
    <div className="profileRowContainer">
      <div className="profileRow">
        <span>
          profile name: <b className="mozeidonColor">{profile.profileName}</b>
        </span>
        <span>registered: {new Date(profile.registeredAt).toLocaleString()}</span>
        <span>priority: {profile.profileRank}</span>
        <span>alias: {profile.profileAlias ? profile.profileAlias : "-"}</span>
        <span>redirection-alias: {profile.profileCommandAlias ? profile.profileCommandAlias : "-"}</span>
        <span>
          current redirection command: <br />
          <b>
            {profile.profileCommandAlias
              ? `${browserRedirectionCommand} "${profile.profileCommandAlias}"`
              : `${browserRedirectionCommand} "${profile.profileName}"`}
          </b>
        </span>
      </div>
      <div>
        <button
          title="Edit this profile ( priority, alias, etc )"
          className="actionButton"
          onClick={() => {
            setShowEditor({ isVisible: true, profile: profile })
          }}
        >
          Edit this profile
        </button>
      </div>
    </div>
  )
}
