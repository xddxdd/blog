import type { VFile } from 'vfile'

/**
 * Plugin configuration options for Gemini
 */
export interface RemarkGeminiOptions {
  /** Base path for relative links */
  baseSelector?: string
  /** Maximum line length for text wrapping */
  maxLength?: number
}

/**
 * Gemini text line types
 */
export type GemtextLineType =
  | 'text' // Regular text line
  | 'heading1' // # Heading 1
  | 'heading2' // ## Heading 2
  | 'heading3' // ### Heading 3
  | 'link' // => URL
  | 'list' // * List item
  | 'quote' // > Quote
  | 'preformat' // ``` preformatted text
  | 'empty' // Empty line

/**
 * Gemini text line object structure
 */
export interface GemtextLine {
  type: GemtextLineType
  content: string
  url?: string
}

/**
 * Extended VFile with gemtext data
 */
export interface GemtextVFile extends VFile {
  data: {
    gemtext?: string
    [key: string]: unknown
  }
}

// Re-export mdast types for convenience
export type { Content, PhrasingContent, Root } from 'mdast'
