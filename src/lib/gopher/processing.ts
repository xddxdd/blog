import type { GopherItemType, GopherItem } from './types.js';
import { ProcessingContext } from './context.js';
import {
  HeadingPrefix,
  ListPrefix,
  NumberedListPrefix,
  BlockquotePrefix,
  CodePrefix,
  prefixesToString,
} from './prefixes.js';
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
 * Apply prefixes to items and return the modified items
 */
function applyPrefixesToItems(
  items: GopherItem[],
  prefixes: any[],
  _context: ProcessingContext,
  isContinuation: boolean = false,
): GopherItem[] {
  if (items.length === 0 || prefixes.length === 0) {
    return items;
  }

  const prefixString = prefixesToString(prefixes, isContinuation);
  const modifiedItems = [...items];

  if (modifiedItems[0]) {
    modifiedItems[0] = {
      ...modifiedItems[0],
      text: prefixString + modifiedItems[0].text,
    };
  }

  return modifiedItems;
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
      return createTextItems(
        hasValue(node) ? node.value : '',
        context,
        undefined,
      );

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

  // Create heading prefix
  const headingPrefix = new HeadingPrefix(node.depth);
  const allPrefixes = [...context.prefixes, headingPrefix];
  const prefixString = prefixesToString(allPrefixes, false);

  const items: GopherItem[] = [createInfoItem(prefixString + text, context)];

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
    // If we have prefixes, apply them to the link
    if (context.prefixes.length > 0) {
      const linkItems = processNode(node.children[0]!, context);
      const prefixedItems = applyPrefixesToItems(
        linkItems,
        context.prefixes,
        context,
      );
      prefixedItems.push(createEmptyItem(context));
      return prefixedItems;
    } else {
      // Normal standalone link processing
      const items = processNode(node.children[0]!, context);
      items.push(createEmptyItem(context));
      return items;
    }
  }

  const items = processInlineContent(node, context);
  items.push(createEmptyItem(context));
  return items;
}

/**
 * Process list - adds spacing and processes items
 */
function processList(node: List, context: ProcessingContext): GopherItem[] {
  const items: GopherItem[] = [];

  // Only add empty item if this is a top-level list (no prefixes with indentation)
  if (context.prefixes.length === 0) {
    items.push(createEmptyItem(context));
  }

  if (!node.children) {
    return items;
  }

  for (let i = 0; i < node.children.length; i++) {
    const listItem = node.children[i];
    if (listItem) {
      // Create the appropriate list prefix
      const listPrefix = node.ordered
        ? new NumberedListPrefix(i + 1)
        : new ListPrefix();

      const scope = context.withPrefixes([listPrefix], { listItem: true });
      items.push(...processNode(listItem, context));
      scope.restore();
    }
  }

  return items;
}

/**
 * Process list item - adds bullet prefix to content and handles nesting
 */
function processListItem(
  node: ListItem,
  context: ProcessingContext,
): GopherItem[] {
  if (!node.children) {
    return [];
  }

  const items: GopherItem[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue;
    const isFirstChild = i === 0;

    if (child.type === 'paragraph') {
      // Handle paragraph children specially to avoid double processing
      const paragraphItems = processInlineContent(child, context);
      items.push(...paragraphItems);
    } else if (child.type === 'list') {
      // Handle nested lists with increased indentation
      const nestedItems = processNode(child, context);
      items.push(...nestedItems);
    } else {
      // For other children (like code blocks), add proper indentation
      // Use isContinuation=true for non-first children to get space prefixes
      const flagScope = context.withFlag('isContinuation', !isFirstChild);
      const childItems = processNode(child, context);
      items.push(...childItems);
      flagScope.restore();
    }
  }

  return items;
}

/**
 * Process blockquote - adds quote prefix to content and handles nesting
 */
function processBlockquote(
  node: Blockquote,
  context: ProcessingContext,
): GopherItem[] {
  const blockquotePrefix = new BlockquotePrefix();
  const scope = context.withPrefixes([blockquotePrefix]);

  if (!node.children) {
    scope.restore();
    return [];
  }

  const items: GopherItem[] = [];

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (!child) continue;

    if (child.type === 'blockquote') {
      // Handle nested blockquotes with accumulated prefix
      const nestedItems = processNode(child, context);
      items.push(...nestedItems);
    } else if (child.type === 'paragraph') {
      // Handle paragraph children with quote prefix
      const paragraphItems = processInlineContent(child, context);
      items.push(...paragraphItems);

      // Add empty line between paragraphs in blockquotes, but not after the last one
      const nextChild = node.children[i + 1];
      if (i < node.children.length - 1 && nextChild?.type === 'paragraph') {
        const firstLinePrefix = prefixesToString(context.prefixes, false);
        items.push(createInfoItem(firstLinePrefix.trim(), context));
      }
    } else {
      // Handle other elements (lists, headers, etc.) within blockquotes
      const childItems = processNode(child, context);
      items.push(...childItems);
    }
  }

  scope.restore();
  items.push(createEmptyItem(context));
  return items;
}

/**
 * Process code block
 */
function processCodeBlock(
  node: Code,
  context: ProcessingContext,
): GopherItem[] {
  if (!node.value) return [];

  // Preserve existing prefixes and only add CodePrefix if not already present
  let prefixes = context.prefixes;
  const hasCodePrefix = prefixes.some((prefix) => prefix instanceof CodePrefix);
  if (!hasCodePrefix) {
    prefixes = [...prefixes, new CodePrefix()];
  }

  const codeContext = {
    ...context,
    prefixes,
  };

  const firstLinePrefix = prefixesToString(
    codeContext.prefixes,
    context.isContinuation ?? false,
  );
  const continuationPrefix = prefixesToString(codeContext.prefixes, true);

  const items = node.value.split('\n').map((line, index) => {
    const prefix = index === 0 ? firstLinePrefix : continuationPrefix;
    return createInfoItem(prefix + line, context);
  });
  items.push(createEmptyItem(context));
  return items;
}

/**
 * Process thematic break (---)
 */
function processThematicBreak(
  _node: ThematicBreak,
  context: ProcessingContext,
): GopherItem[] {
  // Create a horizontal rule using dashes
  const rule = '-'.repeat(70);
  return [createInfoItem(rule, context), createEmptyItem(context)];
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
    // If this is a text node, inline code, or emphasis, accumulate it in the text buffer
    if (
      child.type === 'text' ||
      child.type === 'inlineCode' ||
      child.type === 'emphasis' ||
      child.type === 'strong'
    ) {
      if (child.type === 'text') {
        if (hasValue(child)) {
          // Normalize whitespace in text nodes by replacing multiple whitespace with single spaces
          const normalizedText = child.value.replace(/\s+/g, ' ');
          textBuffer += normalizedText;
        }
      } else if (child.type === 'inlineCode') {
        if (hasValue(child)) {
          textBuffer += `\`${child.value}\``;
        }
      } else if (child.type === 'emphasis') {
        // Handle italic text with *text*
        const emphasisText = extractText(child);
        textBuffer += `*${emphasisText}*`;
      } else if (child.type === 'strong') {
        // Handle bold text with **text**
        const strongText = extractText(child);
        textBuffer += `**${strongText}**`;
      }
    } else {
      // For non-text elements (links, images), flush any accumulated text first
      if (textBuffer.trim()) {
        const firstLinePrefix = prefixesToString(
          context.prefixes,
          context.isContinuation ?? false,
        );
        const continuationPrefix = prefixesToString(context.prefixes, true);
        const prefixedText = firstLinePrefix + textBuffer;
        const textItems = createTextItems(
          prefixedText,
          context,
          continuationPrefix,
        );
        items.push(...textItems);
        textBuffer = '';

        // Reset prefixes after first use in list items
        if (context.listItem && context.prefixes.length > 0) {
          context.prefixes = [];
        }
      }

      // Process the non-text element
      if (child.type === 'link' || child.type === 'image') {
        // If we're in a list context, apply prefixes to the link/image
        if (context.prefixes.length > 0) {
          const linkItems = processNode(child, context);
          const prefixedItems = applyPrefixesToItems(
            linkItems,
            context.prefixes,
            context,
          );
          items.push(...prefixedItems);
        } else {
          // Normal standalone link/image processing
          const childItems = processNode(child, context);
          items.push(...childItems);
        }
      } else {
        // Process other elements normally
        const childItems = processNode(child, context);
        items.push(...childItems);
      }
    }
  }

  // Flush any remaining text buffer
  if (textBuffer.trim()) {
    const firstLinePrefix = prefixesToString(
      context.prefixes,
      context.isContinuation ?? false,
    );
    const continuationPrefix = prefixesToString(context.prefixes, true);
    const prefixedText = firstLinePrefix + textBuffer;
    const textItems = createTextItems(
      prefixedText,
      context,
      continuationPrefix,
    );
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
  continuationPrefix?: string,
): GopherItem[] {
  // Don't trim leading whitespace if we have prefixes (for list indentation)
  const processedText =
    context.prefixes.length > 0 ? text.trimEnd() : text.trim();
  if (!processedText || processedText.trim().length <= 2) {
    return [];
  }

  // Check if the text already has prefixes applied
  const hasPrefixes = context.hasPrefixesApplied(text, false);

  let maxWidth: number;
  if (hasPrefixes) {
    // If text already has prefixes, use the base max length
    maxWidth = context.maxLength || 70;
  } else {
    // Calculate adjusted max width accounting for prefix length
    maxWidth = context.getAdjustedMaxLength(false);
  }

  const lines = wrapText(processedText, maxWidth);

  return lines
    .filter((line) => line.trim())
    .map((line, index) => {
      // For continuation lines in nested contexts, ensure proper indentation
      if (index > 0 && continuationPrefix) {
        // For continuation lines, use the continuation prefix
        return createInfoItem(continuationPrefix + line, context);
      }
      return createInfoItem(line, context);
    });
}

/**
 * Utility functions
 */
function extractText(node: Node): string {
  if (node.type === 'text') {
    if (hasValue(node)) {
      // Normalize whitespace in text nodes
      return node.value.replace(/\s+/g, ' ');
    }
    return '';
  }

  if (node.type === 'inlineCode') {
    return hasValue(node) ? `\`${node.value}\`` : '';
  }

  if (hasChildren(node)) {
    return node.children.map(extractText).join(' ').replace(/\s+/g, ' ');
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

  // Preserve leading whitespace
  const leadingSpaceMatch = text.match(/^(\s*)/);
  const leadingSpaces = leadingSpaceMatch?.[1] || '';
  const trimmedText = text.replace(/^\s*/, '');

  const words = trimmedText.split(' ');
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue;

    const wordWidth = getDisplayWidth(word);
    const currentWidth = getDisplayWidth(currentLine);
    const spaceWidth = currentLine ? 1 : 0; // Space character width
    const leadingSpaceWidth = currentLine ? 0 : getDisplayWidth(leadingSpaces); // Leading spaces only on first line

    // If adding this word would exceed the limit
    if (currentWidth + spaceWidth + wordWidth + leadingSpaceWidth > maxWidth) {
      // If current line has content, save it and start new line
      if (currentLine) {
        lines.push((lines.length === 0 ? leadingSpaces : '') + currentLine);

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
        if (brokenWords.length > 0) {
          const firstLine = brokenWords[0];
          if (firstLine) {
            lines.push((lines.length === 0 ? leadingSpaces : '') + firstLine);
          }
          lines.push(...brokenWords.slice(1, -1));
          currentLine = brokenWords[brokenWords.length - 1] || '';
        }
      }
    } else {
      // Add word to current line
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }

  // Add the last line if it has content
  if (currentLine) {
    const finalLine = (lines.length === 0 ? leadingSpaces : '') + currentLine;
    // Check if the final line is too long and needs to be broken
    if (getDisplayWidth(finalLine) > maxWidth) {
      const brokenLines = wrapContinuousText(finalLine, maxWidth);
      lines.push(...brokenLines);
    } else {
      lines.push(finalLine);
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
