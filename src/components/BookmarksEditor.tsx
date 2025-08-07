import {
  forwardRef,
  RefObject,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { handleFocus } from "../utils/strings"
import { BookmarkItem } from "../domain/bookmarks/models"
import {
  BmFormElement,
  isValidBookmark,
  ValidationError,
} from "../domain/bookmarks/validation"

interface EditFormProps {
  onSubmit: React.FormEventHandler<HTMLFormElement>
  onBackToList: () => void
  selectedItem: BookmarkItem
}
interface EditableProps {
  autoFocus?: boolean
  id: string
  defaultValue: string
}

export type EditRefs = {
  editTitleRef: RefObject<HTMLTextAreaElement>
  editUrlRef: RefObject<HTMLTextAreaElement>
  editParentRef: RefObject<HTMLTextAreaElement>
}

export const BookmarksEditor = forwardRef<EditRefs, EditFormProps>(
  ({ onSubmit, onBackToList, selectedItem }: EditFormProps, ref) => {
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
            onSubmit(e)
          } else e.preventDefault()
        }}
      >
        <div className="formFieldContainer">
          <button
            className="loopButton"
            onFocus={() => document.getElementById("lastButton")?.focus()}
          ></button>
          <label className="row actionLabel" htmlFor="title">
            <span>
              &#x2605; title
            </span>
          </label>
          <div className="formDocInfo">
            ( optional ) Choose your bookmark's title.
            <br />
          </div>
          <Editable
            defaultValue={selectedItem.title}
            id="title"
            ref={editTitleRef}
            autoFocus
          />
          <label className="row actionLabel" htmlFor="url">
            <span>
              &#x2605; url
            </span>
          </label>
          <div className="formDocInfo">
            ( required ) The bookmark's url.
            It must be well-formatted
            <br />
          </div>
          <Editable defaultValue={selectedItem.url} id="url" ref={editUrlRef} />
          <label className="row actionLabel" htmlFor="folderPath">
            <span>
              &#x2605; folder-path
            </span>
          </label>
          <div className="formDocInfo">
            ( optional ) The bookmark's folder expressed as a path, e.g /articles/health technologies/
            <br />
            The folder-path must start with <b>/</b> and end with <b>/</b>
            <br />
          </div>

          <Editable
            defaultValue={selectedItem.parent}
            id="folderPath"
            ref={editParentRef}
          />
          <div className="actionContainer">
            <button className="actionButton" type="submit">
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
          <button
            className="loopButton"
            onFocus={() => document.getElementById("title")?.focus()}
          ></button>
        </div>
      </form>
    ) : (
      <div className="container">
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
  ({ autoFocus, id, defaultValue }: EditableProps, ref) => {
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
      />
    )
  }
)
