import type {
  Blockquote,
  Code,
  Heading,
  Image,
  Link,
  List,
  ListItem,
  Literal,
  Node,
  Paragraph,
  Parent,
  ThematicBreak,
} from 'mdast'

import { GeminiProcessingContext } from './context.js'
import type { GemtextLine, GemtextLineType } from './types.js'

/**
 * Process a single node and return array of gemtext lines
 * Only processes direct children, uses recursion for nested content
 */
export function processNode(
  node: Node,
  context: GeminiProcessingContext
): GemtextLine[] {
  let lines: GemtextLine[]

  switch (node.type) {
    case 'root':
      lines = processChildren(node as Parent, context)
      break

    case 'heading':
      lines = processHeading(node as Heading, context)
      break

    case 'paragraph':
      lines = processParagraph(node as Paragraph, context)
      break

    case 'list':
      lines = processList(node as List, context)
      break

    case 'listItem':
      lines = processListItem(node as ListItem, context)
      break

    case 'blockquote':
      lines = processBlockquote(node as Blockquote, context)
      break

    case 'text':
      return createTextLines(hasValue(node) ? node.value : '', context)

    case 'link': {
      const linkNode = node as Link
      return [createLinkLine(linkNode.url || '', extractText(node))]
    }

    case 'image': {
      const imageNode = node as unknown as Image
      return [createLinkLine(imageNode.url || '', imageNode.alt || '')]
    }

    case 'code':
      return processCodeBlock(node as unknown as Code, context)

    case 'thematicBreak':
      return processThematicBreak(node as ThematicBreak, context)

    case 'yaml':
    case 'toml':
      // Skip frontmatter entirely - it's metadata, not content
      return []

    default:
      lines = hasChildren(node) ? processChildren(node, context) : []
      break
  }

  return lines
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
  context: GeminiProcessingContext
): GemtextLine[] {
  const lines: GemtextLine[] = []

  if (!node.children) {
    return lines
  }

  for (const child of node.children) {
    lines.push(...processNode(child, context))
  }

  return lines
}

/**
 * Process heading - returns appropriate heading level
 */
function processHeading(
  node: Heading,
  context: GeminiProcessingContext
): GemtextLine[] {
  const text = extractText(node)
  let type: GemtextLineType

  switch (node.depth) {
    case 1:
      type = 'heading1'
      break
    case 2:
      type = 'heading2'
      break
    default:
      type = 'heading3'
      break
  }

  const lines: GemtextLine[] = [createLine(type, text, context)]

  // Add empty line after headings
  lines.push(createEmptyLine())

  return lines
}

/**
 * Process paragraph - handles mixed content (text + links/images)
 */
function processParagraph(
  node: Paragraph,
  context: GeminiProcessingContext
): GemtextLine[] {
  if (!node.children) {
    return []
  }

  const lines = processInlineContent(node, context)
  lines.push(createEmptyLine())
  return lines
}

/**
 * Process list - adds list formatting
 */
function processList(
  node: List,
  context: GeminiProcessingContext
): GemtextLine[] {
  const lines: GemtextLine[] = []

  if (!node.children) {
    return lines
  }

  for (const listItem of node.children) {
    if (listItem) {
      context.prefixes.push('  ') // Indent for nested content
      lines.push(...processNode(listItem, context))
      context.prefixes.pop()
    }
  }

  lines.push(createEmptyLine())
  return lines
}

/**
 * Process list item - marks lines as list type
 */
function processListItem(
  node: ListItem,
  context: GeminiProcessingContext
): GemtextLine[] {
  if (!node.children) {
    return []
  }

  const lines: GemtextLine[] = []

  node.children.forEach((child, index) => {
    if (child.type === 'paragraph') {
      // Handle paragraph children specially for list formatting
      const paragraphLines = processInlineContent(child, context)
      paragraphLines.forEach((line, lineIndex) => {
        // Mark as list type, first line is primary
        line.type = 'list'
        ;(line as { isPrimary?: boolean }).isPrimary =
          index === 0 && lineIndex === 0
      })
      lines.push(...paragraphLines)
    } else {
      const childLines = processNode(child, context)
      lines.push(...childLines)
    }
  })

  return lines
}

/**
 * Process blockquote - marks lines as quote type
 */
function processBlockquote(
  node: Blockquote,
  context: GeminiProcessingContext
): GemtextLine[] {
  if (!node.children) {
    return []
  }

  const lines: GemtextLine[] = []

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (!child) continue

    if (child.type === 'paragraph') {
      // Handle paragraph children with quote type
      const paragraphLines = processInlineContent(child, context)
      paragraphLines.forEach(line => {
        line.type = 'quote'
      })
      lines.push(...paragraphLines)

      // Add empty line between paragraphs in blockquotes, but not after the last one
      const nextChild = node.children[i + 1]
      if (nextChild?.type === 'paragraph') {
        lines.push(createEmptyLine())
      }
    } else {
      // Handle other elements within blockquotes
      const childLines = processNode(child, context)
      childLines.forEach(line => {
        if (line.type === 'text') {
          line.type = 'quote'
        }
      })
      lines.push(...childLines)
    }
  }

  lines.push(createEmptyLine())
  return lines
}

/**
 * Process code block - uses preformatted text
 */
function processCodeBlock(
  node: Code,
  _context: GeminiProcessingContext
): GemtextLine[] {
  void _context
  if (!node.value) return []

  const lines: GemtextLine[] = []

  // Start preformatted block
  lines.push({
    type: 'preformat',
    content: '```' + (node.lang || ''),
  })

  // Add code content
  node.value.split('\n').forEach(line => {
    lines.push({
      type: 'preformat',
      content: line,
    })
  })

  // End preformatted block
  lines.push({
    type: 'preformat',
    content: '```',
  })

  lines.push(createEmptyLine())
  return lines
}

/**
 * Process thematic break (---)
 */
function processThematicBreak(
  _node: ThematicBreak,
  context: GeminiProcessingContext
): GemtextLine[] {
  // Create a horizontal rule using dashes
  const rule = '-'.repeat(Math.min(context.remainingWidth(), 20))
  return [createLine('text', rule, context), createEmptyLine()]
}

/**
 * Process inline content (paragraphs, list items, blockquotes)
 * Handles mixed text, links, and images
 */
function processInlineContent(
  node: Parent,
  context: GeminiProcessingContext
): GemtextLine[] {
  const lines: GemtextLine[] = []

  if (!node.children) {
    return lines
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
      textBuffer += extractText(child)
    } else {
      // For non-text elements (links, images), flush any accumulated text first
      if (textBuffer.trim()) {
        const textLines = createTextLines(textBuffer.trim(), context)
        lines.push(...textLines)
        textBuffer = ''
      }

      const childLines = processNode(child, context)
      lines.push(...childLines)
    }
  }

  // Flush any remaining text buffer
  if (textBuffer.trim()) {
    const textLines = createTextLines(textBuffer.trim(), context)
    lines.push(...textLines)
  }

  return lines
}

/**
 * Create gemtext line objects
 */
export function createLine(
  type: GemtextLineType,
  content: string,
  context: GeminiProcessingContext
): GemtextLine {
  return {
    type,
    content: context.prefixesToString() + content,
  }
}

export function createLinkLine(url: string, displayText: string): GemtextLine {
  return {
    type: 'link',
    content: displayText,
    url: url,
  }
}

export function createEmptyLine(): GemtextLine {
  return {
    type: 'empty',
    content: '',
  }
}

export function createTextLines(
  text: string,
  context: GeminiProcessingContext
): GemtextLine[] {
  return wrapText(text.trim(), context)
    .filter(line => line.trim())
    .map(line => createLine('text', line, context))
}

/**
 * Utility functions
 */
function extractText(node: Node): string {
  const nodeValue = hasValue(node) ? node.value : ''
  const childrenValue = hasChildren(node)
    ? node.children.map(extractText).join('')
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

/**
 * Simple text wrapping for Gemini (no complex CJK handling like Gopher)
 */
function wrapText(text: string, context: GeminiProcessingContext): string[] {
  const lines: string[] = []
  const maxWidth = context.remainingWidth()

  if (text.length <= maxWidth) {
    return [text]
  }

  const words = text.split(' ')
  let currentLine = ''

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is too long, break it
        lines.push(word.substring(0, maxWidth))
        currentLine = word.substring(maxWidth)
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length > 0 ? lines : ['']
}

export function formatGemtextLine(line: GemtextLine): string {
  switch (line.type) {
    case 'heading1':
      return `# ${line.content}`
    case 'heading2':
      return `## ${line.content}`
    case 'heading3':
      return `### ${line.content}`
    case 'link':
      return `=> ${line.url} ${line.content}`
    case 'list': {
      const isPrimary = (line as { isPrimary?: boolean }).isPrimary
      return isPrimary ? `* ${line.content}` : `  ${line.content}`
    }
    case 'quote':
      return `> ${line.content}`
    case 'preformat':
    case 'text':
    case 'empty':
    default:
      return line.content
  }
}
