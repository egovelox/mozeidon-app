type TrieNode = {
  children: Map<string, TrieNode>
  isWord: boolean
}

class Trie {
  private root: TrieNode

  constructor() {
    this.root = { children: new Map(), isWord: false }
  }

  insert(word: string): void {
    let node = this.root
    for (const char of word) {
      if (!node.children.has(char)) {
        node.children.set(char, { children: new Map(), isWord: false })
      }
      node = node.children.get(char)!
    }
    node.isWord = true
  }

  /**
   * Return all words in the trie starting with the given prefix.
   */
  startsWith(prefix: string): string[] {
    let node = this.root
    for (const char of prefix) {
      if (!node.children.has(char)) return []
      node = node.children.get(char)!
    }
    return this.collectWords(node, prefix)
  }

  private collectWords(node: TrieNode, prefix: string): string[] {
    const results: string[] = []
    if (node.isWord) results.push(prefix)
    for (const [char, child] of node.children) {
      results.push(...this.collectWords(child, prefix + char))
    }
    return results
  }
}

export class FolderIndex {
  private trie: Trie
  private invertedIndex: Map<string, Set<string>>

  constructor(public paths: string[]) {
    this.trie = new Trie()
    this.invertedIndex = new Map()
    this.buildIndex(paths)
  }

  private buildIndex(paths: string[]): void {
    for (const path of paths) {
      const parts = path.split("/").filter(Boolean)
      for (const part of parts) {
        const tokens = part
          .split(/\s+/)
          .filter(Boolean)
          .map((t) => t.toLowerCase()) // split on whitespace too
        for (const token of tokens) {
          this.trie.insert(token)
          if (!this.invertedIndex.has(token)) {
            this.invertedIndex.set(token, new Set())
          }
          this.invertedIndex.get(token)!.add(path)
        }
      }
    }
  }

  /**
   * Search by prefix (e.g. "yo" → finds "you" → returns paths containing "you").
   */
  search(prefix: string): string[] {
    const normalized = prefix.toLowerCase()
    const matchingWords = this.trie.startsWith(normalized)
    const result = new Set<string>()
    for (const word of matchingWords) {
      for (const path of this.invertedIndex.get(word) || []) {
        result.add(path)
      }
    }
    return [...result]
  }
}
