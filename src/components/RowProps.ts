import { Dispatch, SetStateAction } from "react"
import { DraggableProvided } from "react-beautiful-dnd"

import { Items } from "../domain/ItemModel"
import { ProfileItem } from "../domain/profiles/models"
import { GroupItem } from "../domain/tabs/models"
import { Context, RowDisplay } from "../utils/constants"

export interface RowProps<T> {
  index: number
  style?: React.CSSProperties
  data: {
    currentProfile: ProfileItem | undefined
    searchInputRef: React.RefObject<HTMLInputElement>
    searchTerms: string
    groupItems: GroupItem[]
    setGroupItems: (gi: GroupItem[]) => void
    items: T[]
    setItems: Dispatch<SetStateAction<Items>>
    setBaseItems: Dispatch<SetStateAction<Items>>
    context: Context
    selected: number
    setSelection: (i: number) => void
    setClickCoordinateY: (y: number) => void
    setShowEditionTab: (v: boolean) => void
    rowDisplay: RowDisplay
    restoreDefaults: () => void
  }
  isDragging?: boolean
  provided?: DraggableProvided
}
