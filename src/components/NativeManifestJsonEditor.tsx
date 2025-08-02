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
      <span style={{ fontSize: ".7em" }}>
        &#x2713; {capitalize(manifest.browser)}
      </span>

      {manifest.content && (
        <JsonEditor
          className="nativeManifestContent"
          theme={[
            githubDarkTheme,
            {
              string: { color: "#de7cd4" },
              boolean: { color: "#de7cd4" },
              container: {
                cursor: "default",
                fontSize: ".7em",
                background: "",
                fontFamily: "",
                color: "",
              },
              property: { color: "#83baf4" },
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
