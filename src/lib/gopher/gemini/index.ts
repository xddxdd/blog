import * as yaml from 'js-yaml'
import type { Yaml } from 'mdast'

import { GeminiProcessingContext } from './context.js'
import { formatGemtextLine, processNode } from './processing.js'
import type { GemtextVFile, RemarkGeminiOptions, Root } from './types.js'

// Re-export types for consumers
export type {
  Content,
  GemtextLine,
  GemtextLineType,
  GemtextVFile,
  PhrasingContent,
  RemarkGeminiOptions,
  Root,
} from './types.js'

export const LF = '\n'

/**
 * Remark plugin to convert markdown AST to Gemini protocol format (gemtext)
 * and insert it into the frontmatter
 *
 * Architecture: Each processing function handles only one layer of the syntax tree
 * and returns structured gemtext line objects. Recursion handles nested layers.
 */
export default function remarkGemini(options: RemarkGeminiOptions = {}) {
  const {
    host = 'localhost',
    port = 1965,
    baseSelector = '/',
    maxLength,
  } = options

  return function transformer(tree: Root, _file: GemtextVFile): Root {
    void _file
    const context = new GeminiProcessingContext({
      host,
      port,
      baseSelector,
      prefixes: [],
      maxLength,
    })
    const gemtextLines = processNode(tree, context)
    const gemtextContent = gemtextLines
      .map(line => formatGemtextLine(line))
      .join(LF)

    // Find or create frontmatter node
    const frontmatterNode = tree.children?.find(
      child => child.type === 'yaml'
    ) as Yaml | undefined

    if (frontmatterNode && frontmatterNode.type === 'yaml') {
      // Parse existing YAML frontmatter
      try {
        const yamlNode = frontmatterNode as Yaml
        const frontmatterData = yamlNode.value
          ? (yaml.load(yamlNode.value) as Record<string, unknown>)
          : {}

        // Add gemtext field
        frontmatterData.gemtext = gemtextContent

        // Update the frontmatter node
        yamlNode.value = yaml
          .dump(frontmatterData, {
            lineWidth: -1, // Prevent line wrapping
            noRefs: true, // Prevent YAML references
          })
          .trim()
      } catch {
        // If parsing fails, create new frontmatter with just gemtext
        const yamlNode = frontmatterNode as Yaml
        yamlNode.value = yaml
          .dump(
            { gemtext: gemtextContent },
            {
              lineWidth: -1,
              noRefs: true,
            }
          )
          .trim()
      }
    } else {
      // No frontmatter exists, create new YAML frontmatter
      const newFrontmatter: Yaml = {
        type: 'yaml',
        value: yaml
          .dump(
            { gemtext: gemtextContent },
            {
              lineWidth: -1,
              noRefs: true,
            }
          )
          .trim(),
      }

      // Insert at the beginning of the document
      if (!tree.children) {
        tree.children = []
      }
      tree.children.unshift(newFrontmatter)
    }

    return tree
  }
}
