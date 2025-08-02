import { forwardRef } from "react"

interface SearchInputProps {
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange }: SearchInputProps, ref) => {
    return (
      <input
        ref={ref}
        className="row"
        id="searchInput"
        autoComplete="off"
        autoCorrect="off"
        value={value}
        onChange={onChange}
      />
    )
  }
)
