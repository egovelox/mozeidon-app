import { githubDarkTheme, JsonEditor } from "json-edit-react"
import { capitalize } from "../utils/strings"

export function NativeManifestJsonEditor({
  manifest,
}: {
  manifest: {
    browser: string
    path?: string
    content?: string
  }
}) {
  return (
    <div>
      <span>
        &#x2713; <b>{capitalize(manifest.browser)}</b>
      </span>

      {manifest.content && (
        <JsonEditor
          className="nativeManifestContent"
          theme={[
            githubDarkTheme,
            {
              string: { color: "" },
              boolean: { color: "" },
              container: {
                cursor: "default",
                fontSize: ".7em",
                background: "",
                fontFamily: "",
                color: "",
              },
              property: { color: "rgba(210, 85, 41, 0.5)" },
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
