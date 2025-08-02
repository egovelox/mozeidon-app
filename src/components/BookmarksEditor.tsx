import {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { BookmarkItem } from "../domain/bookmarks/models"
import {
  BmFormElement,
  isValidBookmark,
  ValidationError,
} from "../domain/bookmarks/validation"
import { FolderIndex } from "../utils/bookmarksFolderIndex"
import { logEmit } from "../utils/logEmitter"
import CreatableSelect from "react-select"
import { useSettings } from "../hooks/useSettings"
import { getKeyCombination } from "../utils/getKeyCombination"
import { components } from "react-select"
import { Context } from "../utils/constants"

interface EditFormProps {
  onSubmit: React.FormEventHandler<BmFormElement>
  onBackToList: () => void
  selectedItem: BookmarkItem
  bookmarksFolderIndex: FolderIndex
  context: Context
}
interface EditableProps {
  autoFocus?: boolean
  id: string
  defaultValue: string
  onChange?: (s: string) => void
}

export type EditRefs = {
  editTitleRef: RefObject<HTMLTextAreaElement>
  editUrlRef: RefObject<HTMLTextAreaElement>
  editParentRef: RefObject<HTMLTextAreaElement>
}

export const BookmarksEditor = forwardRef<EditRefs, EditFormProps>(
  (
    {
      onSubmit,
      onBackToList,
      selectedItem,
      bookmarksFolderIndex,
      context,
    }: EditFormProps,
    ref
  ) => {
    /* A way to pass 3 distinct refs in a forwardRef */
    const editTitleRef = useRef<HTMLTextAreaElement>(null)
    const editUrlRef = useRef<HTMLTextAreaElement>(null)
    const editParentRef = useRef<HTMLTextAreaElement>(null)
    useImperativeHandle(ref, () => ({
      editTitleRef: editTitleRef,
      editUrlRef: editUrlRef,
      editParentRef: editParentRef,
    }))

    const [validationErrors, setValidationErrors] = useState<
      ValidationError[] | null
    >(null)

    type Option = { value: string; label: string }
    const [folderPathInputValue, setFolderPathInputValue] = useState("")
    const [folderPathSelected, setFolderPathSelected] = useState<Option | null>(
      null
    )

    // for bookmarks, we display the current folderPath
    useEffect(() => {
      if (context === Context.Bookmarks) {
        setFolderPathSelected({
          value: selectedItem.parent,
          label: selectedItem.parent,
        })
      }
    }, [])

    const selectRef = useRef<any>(null)
    const {
      settings: {
        appSettings: { shortcut_list_up, shortcut_list_down },
      },
    } = useSettings()

    return !validationErrors ? (
      <form
        onSubmit={(e: React.FormEvent<BmFormElement>) => {
          const {
            title: { value: title },
            url: { value: url },
            folderPath: { value: folderPath },
          } = e.currentTarget.elements
          if (
            isValidBookmark({ title, url, folderPath }, setValidationErrors)
          ) {
            logEmit(`folderPath: ${folderPath}`)
            onSubmit(e)
          } else e.preventDefault()
        }}
      >
        <div className="formFieldContainer" style={{ marginTop: "1em" }}>
          <label className="row formLabel" htmlFor="folderPath">
            <span className="mozeidonColor">&#x2605; folder-path</span>
          </label>
          <div className="formDocInfo">
            ( optional ) The bookmark folder expressed as a path, e.g
            /articles/health technologies/
            <br />
            The folder-path must start with <b>/</b> and must end with <b>/</b>
            <br />
          </div>
          <CreatableSelect<Option, false>
            components={{
              DropdownIndicator: (props) => {
                const { selectProps } = props
                const { inputValue, options } = selectProps

                const matches = options.filter((o: any) =>
                  o.label.toLowerCase().includes(inputValue.toLowerCase())
                )

                // Hide arrow if no matches OR only one match
                if (matches.length === 0 || matches.length === 1) return null

                return <components.DropdownIndicator {...props} />
              },
            }}
            id="bookmarkFolderSelect"
            autoFocus
            className="basic-single bookmarkFolderSelect"
            classNamePrefix="bookmarkFolderSelect"
            placeholder="type to search folders..."
            isClearable={false}
            isSearchable={true}
            inputValue={folderPathInputValue}
            value={folderPathSelected}
            noOptionsMessage={() => null}
            ref={selectRef}
            onKeyDown={(e) => {
              const keyCombo = getKeyCombination(e)
              const menu = document.querySelector(".bookmarkFolderSelect__menu")

              if (e.key === "Enter") {
                if (!menu) {
                  e.preventDefault() // stops form submit
                  e.stopPropagation()
                  selectRef.current?.focus()
                  selectRef.current?.onMenuOpen()
                }
              }

              if (e.key === "Escape") {
                if (menu) {
                  e.preventDefault()
                  e.stopPropagation()
                  selectRef.current?.onMenuClose()
                }
              }

              if (keyCombo.toLowerCase() === shortcut_list_down.toLowerCase()) {
                e.preventDefault()
                const down = new KeyboardEvent("keydown", {
                  key: "ArrowDown",
                  bubbles: true,
                })
                e.currentTarget.dispatchEvent(down)
              }

              if (keyCombo.toLowerCase() === shortcut_list_up.toLowerCase()) {
                e.preventDefault()
                const up = new KeyboardEvent("keydown", {
                  key: "ArrowUp",
                  bubbles: true,
                })
                e.currentTarget.dispatchEvent(up)
              }
            }}
            options={
              Array.from(new Set(bookmarksFolderIndex.paths)).map((p) => ({
                value: p,
                label: p,
              })) as Option[]
            }
            filterOption={(option, rawInput) =>
              option.label.toLowerCase().includes(rawInput.toLowerCase())
            }
            onInputChange={(value, { action }) => {
              if (action === "input-change") {
                // keep selected if input starts with it
                if (
                  !folderPathSelected ||
                  !value.startsWith(folderPathSelected.label)
                ) {
                  setFolderPathSelected(null)
                }
                setFolderPathInputValue(value)
              }
              return value
            }}
            onChange={(option) => {
              if (option) {
                setFolderPathSelected(option as Option)
                setFolderPathInputValue((option as Option).label) // fill input with selected
              } else {
                setFolderPathSelected(null)
                setFolderPathInputValue("")
              }
            }}
          />
          <input
            tabIndex={-1}
            type="hidden"
            name="folderPath"
            value={folderPathInputValue}
          />
          <label className="row formLabel" htmlFor="title">
            <span className="mozeidonColor">&#x2605; title</span>
          </label>
          <div className="formDocInfo">
            ( optional ) Choose your bookmark title.
            <br />
          </div>
          <Editable
            defaultValue={selectedItem.title}
            id="title"
            ref={editTitleRef}
          />
          <label className="row formLabel" htmlFor="url">
            <span className="mozeidonColor">&#x2605; url</span>
          </label>
          <div className="formDocInfo">
            ( required ) The bookmark URL. It must be well-formatted
            <br />
          </div>
          <Editable defaultValue={selectedItem.url} id="url" ref={editUrlRef} />
          <div className="actionContainer">
            <button className="actionButton mozeidonColor" type="submit">
              Save &#x2713;
            </button>
            <button
              className="actionButton"
              id="lastButton"
              onClick={() => onBackToList()}
            >
              Back &#8617;
            </button>
          </div>
        </div>
      </form>
    ) : (
      <div className="container" style={{ padding: "1em" }}>
        <h4>
          Bookmark validation : {validationErrors.length} error
          {validationErrors.length > 1 ? "s" : ""}
        </h4>
        <div style={{ fontSize: ".9em" }}>
          {validationErrors.map(({ settingName, received, details }) => {
            return (
              <div key={settingName}>
                <div>
                  ❌ <b>{settingName}</b> could not be validated for{" "}
                  <b>{received}</b> !
                </div>
                <div>{details}</div>
              </div>
            )
          })}
        </div>
        <div className="actionContainer">
          <button
            className="loopButton"
            onFocus={() =>
              document.getElementById("bookmarkdsEditorBackButton")?.focus()
            }
          />
          <button
            autoFocus
            id="bookmarkdsEditorBackButton"
            className="actionButton"
            onClick={() => setValidationErrors(null)}
          >
            &#8617; Back
          </button>
          <button
            className="loopButton"
            onFocus={() =>
              document.getElementById("bookmarkdsEditorBackButton")?.focus()
            }
          />
        </div>
      </div>
    )
  }
)

const Editable = forwardRef<HTMLTextAreaElement, EditableProps>(
  ({ autoFocus, id, defaultValue, onChange }: EditableProps, ref) => {
    return (
      <textarea
        ref={ref}
        autoComplete="off"
        autoCorrect="off"
        className="actionRow editInput editBookmarkInput"
        id={id}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        onFocus={handleFocus(defaultValue, ref)} // The focus handler is still passed
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    )
  }
)

const handleFocus =
  (s: string, ref: React.ForwardedRef<HTMLTextAreaElement>) => () => {
    // Ensure that the caret positioning happens after the focus is applied
    setTimeout(() => {
      if (ref && "current" in ref && ref.current) {
        // Set the caret at the end of the text
        ref.current.setSelectionRange(s.length, s.length)
      }
    }, 0)
  }
