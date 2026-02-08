import { invoke } from "@tauri-apps/api/core"
import { githubDarkTheme, JsonEditor } from "json-edit-react"

import { useSettings } from "../hooks/useSettings"
import { logEmit } from "../utils/logEmitter"
import { capitalize } from "../utils/strings"

export function NativeManifestJsonEditor({
  manifest,
  canBeDeleted,
}: {
  manifest: {
    browser: string
    path?: string
    content?: string
  }
  canBeDeleted?: boolean
}) {
  const { settings, setSettings } = useSettings()
  const handleDelete = async () => {
    try {
      await invoke("delete_custom_manifest", {
        nativeManifestPath: manifest.path,
      })
      const currentManifests = settings.appSettings.custom_browser_manifests
      const newManifests = currentManifests.filter((m) => m.path !== manifest.path)
      setSettings({
        ...settings,
        appSettings: {
          ...settings.appSettings,
          custom_browser_manifests: newManifests,
        },
      })
    } catch (e) {
      logEmit(`error: ${JSON.stringify(e)}`)
    }
  }

  return (
    <div>
      <span style={{ fontSize: ".7em" }}>&#x2713; {capitalize(manifest.browser)}</span>
      &nbsp;&nbsp;
      {
        canBeDeleted && (
          <button
            title="delete this native-manifest"
            className="actionButton actionButtonSmall"
            onClick={async () => await handleDelete()}
            style={{ fontSize: ".7em" }}
          >
            &#x292B;
          </button>
        ) // &#x292B a cross
      }
      {manifest.content && (
        <JsonEditor
          className="nativeManifestContent"
          theme={[
            githubDarkTheme,
            {
              string: {
                color: settings.appSettings.custom_theme?.main_font || "#de7cd4",
              },
              boolean: {
                color: settings.appSettings.custom_theme?.main_font || "#de7cd4",
              },
              container: {
                cursor: "default",
                fontSize: ".7em",
                background: "",
                fontFamily: "",
                color: "",
              },
              property: {
                color: settings.appSettings.custom_theme?.icon || "#155DAB",
              },
              bracket: { display: "none" },
            },
          ]}
          data={JSON.parse(manifest.content)}
          setData={() => {}}
          rootName={manifest.path}
          showIconTooltips
          restrictEdit
          restrictDelete
          restrictAdd
          collapse={0}
          restrictTypeSelection
          showCollectionCount={false}
          showStringQuotes={false}
          enableClipboard={false}
          indent={2}
          showErrorMessages={true}
          onUpdate={() => {}}
        />
      )}
    </div>
  )
}
