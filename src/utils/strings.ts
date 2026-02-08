export function capitalize(s: string) {
  return String(s).charAt(0).toUpperCase() + String(s).slice(1)
}

export function numberWithSpaces(x: number) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export function isErrorJsonString(result: unknown) {
  return typeof result === "string" && result.startsWith(`{"error"`)
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str
  }
  return str.slice(0, maxLength) + "..."
}
