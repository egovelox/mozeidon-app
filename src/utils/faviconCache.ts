const faviconCache = new Map<string, string>()

export function getFavicon(domain: string): string | undefined {
  return faviconCache.get(domain)
}

export function setFavicon(domain: string, url: string) {
  console.log("show cache size", faviconCache.size)
  faviconCache.set(domain, url)
}

export function clearFaviconCache() {
  if (faviconCache.size) faviconCache.clear()
}
