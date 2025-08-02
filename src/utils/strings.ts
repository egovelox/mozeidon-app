export function limitString(s: string, length: number) {
  return s.length <= length ? s : s.substring(0, length).concat("...")
}

export function countUpperCaseOrNumberChars(s: string) {
  return s.split("").filter((c) => c === c.toUpperCase() || /\d/.test(c)).length
}

export const handleFocus =
  (s: string, ref: React.ForwardedRef<HTMLTextAreaElement>) => () => {
    // Ensure that the caret positioning happens after the focus is applied
    setTimeout(() => {
      if (ref && "current" in ref && ref.current) {
        // Set the caret at the end of the text
        ref.current.setSelectionRange(s.length, s.length)
      }
    }, 0)
  }
