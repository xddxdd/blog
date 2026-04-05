import type { Root } from 'mdast'
import type { VFile } from 'vfile'

import remarkGemini from './gemini/index.js'
import type { RemarkGeminiOptions } from './gemini/types.js'
import remarkGophermap from './gopher/index.js'
import type { RemarkGophermapOptions } from './gopher/types.js'

// Re-export types for consumers
export type {
  GemtextLine,
  GemtextLineType,
  GemtextVFile,
  RemarkGeminiOptions,
} from './gemini/types.js'
export type {
  GopherItem,
  GopherItemType,
  GophermapVFile,
  RemarkGophermapOptions,
} from './gopher/types.js'
export type { Content, PhrasingContent, Root } from 'mdast'

/**
 * Combined options for both Gopher and Gemini protocols
 */
export interface UnifiedProtocolOptions {
  /** Gopher configuration */
  gopher?: RemarkGophermapOptions
  /** Gemini configuration */
  gemini?: RemarkGeminiOptions
  /** Enable Gopher output (default: true) */
  enableGopher?: boolean
  /** Enable Gemini output (default: true) */
  enableGemini?: boolean
}

/**
 * Unified remark plugin that generates both Gopher and Gemini formats
 *
 * This plugin processes markdown and generates both gophermap and gemtext
 * formats, storing them in the frontmatter of the document.
 */
export default function remarkUnifiedProtocol(
  options: UnifiedProtocolOptions = {}
) {
  const {
    gopher = {},
    gemini = {},
    enableGopher = true,
    enableGemini = true,
  } = options

  return function transformer(tree: Root, file: VFile): Root {
    let processedTree = tree

    // Apply Gopher processing if enabled
    if (enableGopher) {
      const gopherTransformer = remarkGophermap(gopher)
      processedTree = gopherTransformer(processedTree, file)
    }

    // Apply Gemini processing if enabled
    if (enableGemini) {
      const geminiTransformer = remarkGemini(gemini)
      processedTree = geminiTransformer(processedTree, file)
    }

    return processedTree
  }
}

// Also export individual plugins for direct use
export { remarkGemini, remarkGophermap }
