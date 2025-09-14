import type { GopherItemType, GopherItem } from './types.js'
import { CharacterType } from './cjk.js'
import { ProcessingContext } from './context.js'
import {
  HeadingPrefix,
  ListPrefix,
  NumberedListPrefix,
  BlockquotePrefix,
  CodePrefix,
} from './prefixes.js'
import type {
  Heading,
  Paragraph,
  List,
  ListItem,
  Blockquote,
  Code,
  ThematicBreak,
  Link,
  Image,
  Node,
  Parent,
  Literal,
} from 'mdast'

/**
 * Process a single node and return array of gopher items
 * Only processes direct children, uses recursion for nested content
 */
export function processNode(
  node: Node,
  context: ProcessingContext
): GopherItem[] {
  let items: GopherItem[]

  switch (node.type) {
    case 'root':
      items = processChildren(node as Parent, context)
      break

    case 'heading':
      items = processHeading(node as Heading, context)
      break

    case 'paragraph':
      items = processParagraph(node as Paragraph, context)
      break

    case 'list':
      items = processList(node as List, context)
      break

    case 'listItem':
      items = processListItem(node as ListItem, context)
      break

    case 'blockquote':
      items = processBlockquote(node as Blockquote, context)
      break

    case 'text':
      return createTextItems(hasValue(node) ? node.value : '', context)

    case 'link': {
      const linkNode = node as Link
      if (!linkNode.url) {
        throw new Error('Link node URL is required')
      }
      return [createMediaItem(linkNode.url, extractText(node), context)]
    }

    case 'image': {
      const imageNode = node as Image
      return [
        createMediaItem(
          imageNode.url ||
            (() => {
              throw new Error('Image node URL is required')
            })(),
          imageNode.alt ||
            (() => {
              throw new Error('Image node alt text is required')
            })(),
          context
        ),
      ]
    }

    case 'code':
      return processCodeBlock(node as Code, context)

    case 'thematicBreak':
      return processThematicBreak(node as ThematicBreak, context)

    case 'yaml':
    case 'toml':
      // Skip frontmatter entirely - it's metadata, not content
      return []

    default:
      items = hasChildren(node) ? processChildren(node, context) : []
      break
  }

  return items
}

/**
 * Type guard to check if a node has children
 */
function hasChildren(node: Node): node is Parent {
  return 'children' in node && Array.isArray((node as Parent).children)
}

/**
 * Type guard to check if a node has a value
 */
function hasValue(node: Node): node is Literal {
  return 'value' in node && typeof (node as Literal).value === 'string'
}

/**
 * Process all children of a node
 */
function processChildren(
  node: Parent,
  context: ProcessingContext
): GopherItem[] {
  const items: GopherItem[] = []

  if (!node.children) {
    return items
  }

  for (const child of node.children) {
    items.push(...processNode(child, context))
  }

  return items
}

/**
 * Process heading - returns info item + optional separator
 */
function processHeading(
  node: Heading,
  context: ProcessingContext
): GopherItem[] {
  const text = extractText(node)

  context.prefixes.push(new HeadingPrefix(node.depth))
  const items: GopherItem[] = [createInfoItem(text, context)]
  context.prefixes.pop()

  // Add separator after h1
  if (node.depth === 1) {
    items.push(createEmptyItem(context))
  }

  return items
}

/**
 * Process paragraph - handles mixed content (text + links/images)
 */
function processParagraph(
  node: Paragraph,
  context: ProcessingContext
): GopherItem[] {
  if (!node.children) {
    return []
  }

  const items = processInlineContent(node, context)
  items.push(createEmptyItem(context))
  return items
}

/**
 * Process list - adds spacing and processes items
 */
function processList(node: List, context: ProcessingContext): GopherItem[] {
  const items: GopherItem[] = []

  if (!node.children) {
    return items
  }

  for (let i = 0; i < node.children.length; i++) {
    const listItem = node.children[i]
    if (listItem) {
      // Create the appropriate list prefix
      const listPrefix = node.ordered
        ? new NumberedListPrefix(i + 1)
        : new ListPrefix()

      context.prefixes.push(listPrefix)
      items.push(...processNode(listItem, context))
      context.prefixes.pop()
    }
  }

  return items
}

/**
 * Process list item - adds bullet prefix to content and handles nesting
 */
function processListItem(
  node: ListItem,
  context: ProcessingContext
): GopherItem[] {
  if (!node.children) {
    return []
  }

  const items: GopherItem[] = []

  node.children.forEach(child => {
    if (child.type === 'paragraph') {
      // Handle paragraph children specially to avoid double processing
      const paragraphItems = processInlineContent(child, context)
      items.push(...paragraphItems)
    } else {
      const childItems = processNode(child, context)
      items.push(...childItems)
    }
  })

  return items
}

/**
 * Process blockquote - adds quote prefix to content and handles nesting
 */
function processBlockquote(
  node: Blockquote,
  context: ProcessingContext
): GopherItem[] {
  if (!node.children) {
    return []
  }

  context.prefixes.push(new BlockquotePrefix())

  const items: GopherItem[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (!child) continue

    if (child.type === 'paragraph') {
      // Handle paragraph children with quote prefix
      const paragraphItems = processInlineContent(child, context)
      items.push(...paragraphItems)

      // Add empty line between paragraphs in blockquotes, but not after the last one
      const nextChild = node.children[i + 1]
      if (nextChild?.type === 'paragraph') {
        items.push(createEmptyItem(context))
      }
    } else {
      // Handle other elements (lists, headers, etc.) within blockquotes
      const childItems = processNode(child, context)
      items.push(...childItems)
    }
  }

  context.prefixes.pop()
  items.push(createEmptyItem(context))
  return items
}

/**
 * Process code block
 */
function processCodeBlock(
  node: Code,
  context: ProcessingContext
): GopherItem[] {
  if (!node.value) return []

  context.prefixes.push(new CodePrefix())
  const items = node.value
    .split('\n')
    .map(line => createInfoItem(line, context))
  context.prefixes.pop()

  items.push(createEmptyItem(context))
  return items
}

/**
 * Process thematic break (---)
 */
function processThematicBreak(
  _node: ThematicBreak,
  context: ProcessingContext
): GopherItem[] {
  // Create a horizontal rule using dashes
  const rule = '-'.repeat(context.remainingWidth())
  return [createInfoItem(rule, context), createEmptyItem(context)]
}

/**
 * Process inline content (paragraphs, list items, blockquotes)
 * Handles mixed text, links, and images
 */
function processInlineContent(
  node: Parent,
  context: ProcessingContext
): GopherItem[] {
  const items: GopherItem[] = []

  if (!node.children) {
    return items
  }

  let textBuffer = ''

  for (const child of node.children) {
    // If this is a text node, inline code, or emphasis, accumulate it in the text buffer
    if (
      child.type === 'text' ||
      child.type === 'inlineCode' ||
      child.type === 'emphasis' ||
      child.type === 'strong'
    ) {
      textBuffer += ' ' + extractText(child)
    } else {
      // For non-text elements (links, images), flush any accumulated text first
      if (textBuffer.trim()) {
        const textItems = createTextItems(textBuffer.trim(), context)
        items.push(...textItems)
        textBuffer = ''
      }

      const childItems = processNode(child, context)
      items.push(...childItems)
    }
  }

  // Flush any remaining text buffer
  if (textBuffer.trim()) {
    const textItems = createTextItems(textBuffer.trim(), context)
    items.push(...textItems)
  }

  return items
}

/**
 * Create gopher item objects
 */
function createInfoItem(text: string, context: ProcessingContext): GopherItem {
  return {
    type: 'i',
    text: context.prefixesToString() + text,
    selector: '',
    host: context.host,
    port: context.port,
  }
}

function createMediaItem(
  url: string,
  displayText: string,
  context: ProcessingContext
): GopherItem {
  const itemType = getGopherItemType(url)

  let selector: string
  if (url.startsWith('http')) {
    selector = `URL:${url}`
  } else {
    // Handle path concatenation to avoid double slashes
    const baseSelector = context.baseSelector
    if (url.startsWith('/') && baseSelector.endsWith('/')) {
      // Remove trailing slash from baseSelector to avoid double slashes
      selector = baseSelector.slice(0, -1) + url
    } else if (!url.startsWith('/') && !baseSelector.endsWith('/')) {
      // Add separator if neither has a slash
      selector = baseSelector + '/' + url
    } else {
      // Normal case - just concatenate
      selector = baseSelector + url
    }
  }

  return {
    type: itemType,
    text: context.prefixesToString() + displayText,
    selector: selector,
    host: context.host,
    port: context.port,
  }
}

function createEmptyItem(context: ProcessingContext): GopherItem {
  return {
    type: 'i',
    text: context.prefixesToString(),
    selector: '',
    host: context.host,
    port: context.port,
  }
}

function createTextItems(
  text: string,
  context: ProcessingContext
): GopherItem[] {
  return wrapText(text.trim(), context)
    .filter(line => line.trim())
    .map(line => createInfoItem(line, context))
}

/**
 * Utility functions
 */
function extractText(node: Node): string {
  const nodeValue = hasValue(node) ? node.value : ''
  const childrenValue = hasChildren(node)
    ? node.children.map(extractText).join(' ')
    : ''
  const value = `${nodeValue}${childrenValue}`.replace(/\s+/g, ' ')
  if (!value) {
    return ''
  }

  if (node.type === 'text') {
    return `${value}`
  }

  if (node.type === 'inlineCode') {
    return `\`${value}\``
  }

  if (node.type === 'emphasis') {
    return `*${value}*`
  }

  if (node.type === 'strong') {
    return `**${value}**`
  }

  return childrenValue
}

function getGopherItemType(url: string): GopherItemType {
  if (url.startsWith('http')) {
    return 'h'
  }

  const ext = url.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'txt':
    case 'md':
      return '0'
    case 'gif':
      return 'g'
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'I'
    case 'mp3':
    case 'wav':
      return 's'
    default:
      return '1'
  }
}

/**
 * Calculate display width of text, treating CJK characters as 2 characters
 */
function getDisplayWidth(text: string): number {
  let width = 0
  for (const char of text) {
    if (new CharacterType(char).isCJK()) {
      width += 2
    } else {
      width += 1
    }
  }
  return width
}

/**
 * Split text into words, treating each CJK character as a separate word
 * Also handles breaking of very long words that exceed the max width
 */
function splitIntoWords(text: string, maxWidth: number): string[] {
  const words: string[] = []
  let currentWord = ''

  for (const char of text) {
    if (char === ' ') {
      // Space separates words
      if (currentWord) {
        // Check if the word needs to be broken
        words.push(currentWord)
        currentWord = ''
      }
    } else if (new CharacterType(char).isCJK()) {
      // CJK characters are treated as separate words
      if (currentWord) {
        // Check if the word needs to be broken
        words.push(currentWord)
        currentWord = ''
      }
      words.push(char)
    } else {
      // Regular characters accumulate into words
      currentWord += char
    }

    if (getDisplayWidth(currentWord) >= maxWidth) {
      words.push(currentWord)
      currentWord = ''
    }
  }

  // Add the last word if there is one
  if (currentWord) {
    words.push(currentWord)
  }

  return words
}

/**
 * Wrap text to specified display width, treating CJK characters as 2 characters
 * Takes into account line prefixes for both first line and continuation lines
 * CJK characters are treated as separate words for natural breaking
 */
function wrapText(text: string, context: ProcessingContext): string[] {
  const lines: string[] = []
  const trimmedText = text.trim()

  // Split text into words, treating CJK characters as separate words and handling long word breaking
  const words = splitIntoWords(trimmedText, context.remainingWidth())
  let currentLine = ''

  const shouldAddSpace = (word: string) => {
    if (!currentLine) {
      return false
    }

    const lastChar = currentLine.charAt(currentLine.length - 1)
    return (
      (new CharacterType(lastChar).isLatin() &&
        new CharacterType(word).isLatin()) ||
      (new CharacterType(lastChar).isLatin() &&
        new CharacterType(word).isCJKCharacter()) ||
      (new CharacterType(lastChar).isCJKCharacter() &&
        new CharacterType(word).isLatin())
    )
  }

  words.forEach(word => {
    const wordWidth = getDisplayWidth(word)
    const currentWidth = getDisplayWidth(currentLine)
    const spaceWidth = shouldAddSpace(word) ? 1 : 0

    // If adding this word would exceed the limit
    if (
      currentLine &&
      currentWidth + spaceWidth + wordWidth > context.remainingWidth() &&
      // Only check line length for characters, not punctuations
      new CharacterType(word).isCharacter()
    ) {
      // Save current line and start new line
      lines.push(currentLine)
      currentLine = ''
    }

    if (shouldAddSpace(word)) {
      currentLine += ' '
    }
    currentLine += word
  })

  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}

export function formatGopherItem(item: GopherItem): string {
  return `${item.type}${item.text}\t${item.selector}\t${item.host}\t${item.port}`
}
