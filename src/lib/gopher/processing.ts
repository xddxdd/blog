import type { GopherItemType, ProcessingContext, GopherItem } from './types.js';
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
  Yaml,
  Node,
  Parent,
  Literal,
} from 'mdast';

/**
 * Remove consecutive empty items from a list of gopher items
 */
function removeConsecutiveEmptyItems(items: GopherItem[]): GopherItem[] {
  const result: GopherItem[] = [];
  let lastWasEmpty = false;

  for (const item of items) {
    const isEmptyItem = item.type === 'i' && item.text === '';

    // Only add empty items if the last item wasn't empty
    if (!isEmptyItem || !lastWasEmpty) {
      result.push(item);
    }

    lastWasEmpty = isEmptyItem;
  }

  return result;
}

/**
 * Process a single node and return array of gopher items
 * Only processes direct children, uses recursion for nested content
 */
export function processNode(
  node: Node,
  context: ProcessingContext,
): GopherItem[] {
  // Handle special nodes that have children but should be processed as units
  if (node.type === 'link' || node.type === 'image') {
    return processLeafNode(node, context);
  }

  // Handle literal nodes (nodes with values, not children)
  if (
    node.type === 'text' ||
    node.type === 'code' ||
    node.type === 'thematicBreak'
  ) {
    return processLeafNode(node, context);
  }

  if (!hasChildren(node)) {
    return processLeafNode(node, context);
  }

  let items: GopherItem[];

  switch (node.type) {
    case 'root':
      items = processChildren(node, context);
      break;

    case 'heading':
      items = processHeading(node as Heading, context);
      break;

    case 'paragraph':
      items = processParagraph(node as Paragraph, context);
      break;

    case 'list':
      items = processList(node as List, context);
      break;

    case 'listItem':
      items = processListItem(node as ListItem, context);
      break;

    case 'blockquote':
      items = processBlockquote(node as Blockquote, context);
      break;

    default:
      items = hasChildren(node) ? processChildren(node, context) : [];
      break;
  }

  // Remove consecutive empty items for root-level processing
  if (node.type === 'root') {
    return removeConsecutiveEmptyItems(items);
  }

  return items;
}

/**
 * Type guard to check if a node has children
 */
function hasChildren(node: Node): node is Parent {
  return 'children' in node && Array.isArray((node as Parent).children);
}

/**
 * Type guard to check if a node has a value
 */
function hasValue(node: Node): node is Literal {
  return 'value' in node && typeof (node as Literal).value === 'string';
}

/**
 * Process leaf nodes (text, link, image, code, etc.)
 */
function processLeafNode(node: Node, context: ProcessingContext): GopherItem[] {
  switch (node.type) {
    case 'text':
      return createTextItems(hasValue(node) ? node.value : '', context);

    case 'link':
      const linkNode = node as Link;
      return [createMediaItem(linkNode.url || '', extractText(node), context)];

    case 'image':
      const imageNode = node as Image;
      return [
        createMediaItem(imageNode.url || '', imageNode.alt || '', context),
      ];

    case 'code':
      return processCodeBlock(node as Code, context);

    case 'thematicBreak':
      return processThematicBreak(node as ThematicBreak, context);

    case 'yaml':
    case 'toml':
      return processFrontmatter(node as Yaml, context);

    default:
      return [];
  }
}

/**
 * Process all children of a node
 */
function processChildren(
  node: Parent,
  context: ProcessingContext,
): GopherItem[] {
  const items: GopherItem[] = [];

  if (!node.children) {
    return items;
  }

  for (const child of node.children) {
    items.push(...processNode(child, context));
  }

  return items;
}

/**
 * Process heading - returns info item + optional separator
 */
function processHeading(
  node: Heading,
  context: ProcessingContext,
): GopherItem[] {
  const text = extractText(node);
  const items: GopherItem[] = [createInfoItem(text, context)];

  // Add separator after h1
  if (node.depth === 1) {
    items.push(createEmptyItem(context));
  }

  return items;
}

/**
 * Process paragraph - handles mixed content (text + links/images)
 */
function processParagraph(
  node: Paragraph,
  context: ProcessingContext,
): GopherItem[] {
  if (!node.children) {
    return [];
  }

  // Check if paragraph contains only a single link or image
  if (
    node.children.length === 1 &&
    (node.children[0]?.type === 'link' || node.children[0]?.type === 'image')
  ) {
    const items = processNode(node.children[0], context);
    items.push(createEmptyItem(context));
    return items;
  }

  const items = processInlineContent(node, context);
  items.push(createEmptyItem(context));
  return items;
}

/**
 * Process list - adds spacing and processes items
 */
function processList(node: List, context: ProcessingContext): GopherItem[] {
  const items: GopherItem[] = [createEmptyItem(context)];

  if (!node.children) {
    return items;
  }

  for (const listItem of node.children) {
    items.push(...processNode(listItem, { ...context, listItem: true }));
  }

  return items;
}

/**
 * Process list item - adds bullet prefix to content
 */
function processListItem(
  node: ListItem,
  context: ProcessingContext,
): GopherItem[] {
  const childItems = processInlineContent(node, { ...context, prefix: '- ' });
  return childItems;
}

/**
 * Process blockquote - adds quote prefix to content
 */
function processBlockquote(
  node: Blockquote,
  context: ProcessingContext,
): GopherItem[] {
  const childItems = processInlineContent(node, {
    ...context,
    prefix: '> ',
    maxLength: 68, // 70 - 2 for "> " prefix
  });
  childItems.push(createEmptyItem(context));
  return childItems;
}

/**
 * Process code block
 */
function processCodeBlock(
  node: Code,
  context: ProcessingContext,
): GopherItem[] {
  if (!node.value) return [];

  const items = node.value
    .split('\n')
    .map((line) => createInfoItem(line, context));
  items.push(createEmptyItem(context));
  return items;
}

/**
 * Process thematic break (---)
 */
function processThematicBreak(
  _node: ThematicBreak,
  _context: ProcessingContext,
): GopherItem[] {
  // For YAML frontmatter, we'll just ignore thematic breaks
  // This helps with frontmatter parsing issues
  return [];
}

/**
 * Process frontmatter (YAML/TOML)
 */
function processFrontmatter(
  _node: Yaml,
  _context: ProcessingContext,
): GopherItem[] {
  // Skip frontmatter entirely - it's metadata, not content
  return [];
}

/**
 * Process inline content (paragraphs, list items, blockquotes)
 * Handles mixed text, links, and images
 */
function processInlineContent(
  node: Parent,
  context: ProcessingContext,
): GopherItem[] {
  const items: GopherItem[] = [];

  if (!node.children) {
    return items;
  }

  let textBuffer = '';

  for (const child of node.children) {
    // If this is a text node or inline code, accumulate it in the text buffer
    if (child.type === 'text' || child.type === 'inlineCode') {
      if (child.type === 'text') {
        if (hasValue(child)) {
          textBuffer += child.value;
        }
      } else if (child.type === 'inlineCode') {
        if (hasValue(child)) {
          textBuffer += `\`${child.value}\``;
        }
      }
    } else {
      // For non-text elements (links, images), flush any accumulated text first
      if (textBuffer.trim()) {
        const prefixedText = context.prefix
          ? context.prefix + textBuffer
          : textBuffer;
        const textItems = createTextItems(prefixedText, context);
        items.push(...textItems);
        textBuffer = '';

        // Reset prefix after first use in list items
        if (context.listItem && context.prefix) {
          context.prefix = '';
        }
      }

      // Process the non-text element normally
      const childItems = processNode(child, context);
      items.push(...childItems);
    }
  }

  // Flush any remaining text buffer
  if (textBuffer.trim()) {
    const prefixedText = context.prefix
      ? context.prefix + textBuffer
      : textBuffer;
    const textItems = createTextItems(prefixedText, context);
    items.push(...textItems);
  }

  return items;
}

/**
 * Create gopher item objects
 */
function createInfoItem(text: string, context: ProcessingContext): GopherItem {
  return {
    type: 'i',
    text: text,
    selector: '',
    host: context.host,
    port: context.port,
  };
}

function createMediaItem(
  url: string,
  displayText: string,
  context: ProcessingContext,
): GopherItem {
  const itemType = getGopherItemType(url);

  let selector: string;
  if (url.startsWith('http')) {
    selector = `URL:${url}`;
  } else {
    // Handle path concatenation to avoid double slashes
    const baseSelector = context.baseSelector;
    if (url.startsWith('/') && baseSelector.endsWith('/')) {
      // Remove trailing slash from baseSelector to avoid double slashes
      selector = baseSelector.slice(0, -1) + url;
    } else if (!url.startsWith('/') && !baseSelector.endsWith('/')) {
      // Add separator if neither has a slash
      selector = baseSelector + '/' + url;
    } else {
      // Normal case - just concatenate
      selector = baseSelector + url;
    }
  }

  return {
    type: itemType,
    text: displayText,
    selector: selector,
    host: context.host,
    port: context.port,
  };
}

function createEmptyItem(context: ProcessingContext): GopherItem {
  return {
    type: 'i',
    text: '',
    selector: '',
    host: context.host,
    port: context.port,
  };
}

function createTextItems(
  text: string,
  context: ProcessingContext,
): GopherItem[] {
  const trimmedText = text.trim();
  if (!trimmedText || trimmedText.length <= 2) {
    return [];
  }

  const maxWidth = context.maxLength || 70;
  const lines = wrapText(trimmedText, maxWidth);

  return lines
    .filter((line) => line.trim())
    .map((line) => createInfoItem(line, context));
}

/**
 * Utility functions
 */
function extractText(node: Node): string {
  if (node.type === 'text') {
    return hasValue(node) ? node.value : '';
  }

  if (node.type === 'inlineCode') {
    return hasValue(node) ? `\`${node.value}\`` : '';
  }

  if (hasChildren(node)) {
    return node.children.map(extractText).join('');
  }

  return '';
}

function getGopherItemType(url: string): GopherItemType {
  if (url.startsWith('http')) {
    return 'h';
  }

  const ext = url.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt':
    case 'md':
      return '0';
    case 'gif':
      return 'g';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'I';
    case 'mp3':
    case 'wav':
      return 's';
    default:
      return '1';
  }
}

/**
 * Calculate display width of text, treating CJK characters as 2 characters
 */
function getDisplayWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    // CJK Unicode ranges:
    // - CJK Unified Ideographs: U+4E00-U+9FFF
    // - CJK Extension A: U+3400-U+4DBF
    // - CJK Extension B: U+20000-U+2A6DF
    // - CJK Symbols and Punctuation: U+3000-U+303F
    // - Hiragana: U+3040-U+309F
    // - Katakana: U+30A0-U+30FF
    // - Hangul: U+AC00-U+D7AF
    const code = char.codePointAt(0) || 0;
    if (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
      (code >= 0x20000 && code <= 0x2a6df) || // CJK Extension B
      (code >= 0x3000 && code <= 0x303f) || // CJK Symbols and Punctuation
      (code >= 0x3040 && code <= 0x309f) || // Hiragana
      (code >= 0x30a0 && code <= 0x30ff) || // Katakana
      (code >= 0xac00 && code <= 0xd7af) // Hangul
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Wrap text to specified display width, treating CJK characters as 2 characters
 */
function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];

  // Handle text that contains no spaces (like long URLs or continuous CJK text)
  if (!text.includes(' ')) {
    return wrapContinuousText(text, maxWidth);
  }

  const words = text.split(' ');
  let currentLine = '';

  for (const word of words) {
    const wordWidth = getDisplayWidth(word);
    const currentWidth = getDisplayWidth(currentLine);
    const spaceWidth = currentLine ? 1 : 0; // Space character width

    // If adding this word would exceed the limit
    if (currentWidth + spaceWidth + wordWidth > maxWidth) {
      // If current line has content, save it and start new line
      if (currentLine) {
        lines.push(currentLine);

        // Check if the word itself is too long and needs to be broken
        if (wordWidth > maxWidth) {
          const brokenWords = wrapContinuousText(word, maxWidth);
          lines.push(...brokenWords.slice(0, -1));
          currentLine = brokenWords[brokenWords.length - 1] || '';
        } else {
          currentLine = word;
        }
      } else {
        // Word itself is too long, need to break it
        const brokenWords = wrapContinuousText(word, maxWidth);
        lines.push(...brokenWords.slice(0, -1));
        currentLine = brokenWords[brokenWords.length - 1] || '';
      }
    } else {
      // Add word to current line
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }

  // Add the last line if it has content
  if (currentLine) {
    // Check if the final line is too long and needs to be broken
    if (getDisplayWidth(currentLine) > maxWidth) {
      const brokenLines = wrapContinuousText(currentLine, maxWidth);
      lines.push(...brokenLines);
    } else {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [''];
}

/**
 * Wrap continuous text (no spaces) by breaking at character boundaries
 */
function wrapContinuousText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const char of text) {
    const charWidth = getDisplayWidth(char);
    const currentWidth = getDisplayWidth(currentLine);

    if (currentWidth + charWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine += char;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [''];
}

export function formatGopherItem(item: GopherItem): string {
  return `${item.type}${item.text}\t${item.selector}\t${item.host}\t${item.port}`;
}
