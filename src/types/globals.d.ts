export {}

declare global {
  interface Window {
    /* f is the index of the FIRST list-item visible in the scroll-view */
    f: number
    /* l is the index of the LAST list-item visible in the scroll-view */
    l: number
    /* clickCoordinateY is the y-position of the cursor when the scroll-view is clicked */
    clickCoordinateY: number
  }
}
