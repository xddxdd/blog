import * as yaml from 'js-yaml'
import type { Yaml } from 'mdast'

import { ProcessingContext } from './context.js'
import { formatGopherItem, processNode } from './processing.js'
import type { RemarkGophermapOptions, Root } from './types.js'

// Re-export types for consumers
export type {
  Content,
  GopherItem,
  GopherItemType,
  GophermapVFile,
  PhrasingContent,
  RemarkGophermapOptions,
  Root,
} from './types.js'

export const CRLF = '\r\n'

/**
 * Remark plugin to convert markdown AST to Gopher protocol format (gophermap)
 * and insert it into the frontmatter
 *
 * Architecture: Each processing function handles only one layer of the syntax tree
 * and returns structured gopher item objects. Recursion handles nested layers.
 */
export default function remarkGophermap(options: RemarkGophermapOptions = {}) {
  const {
    host = 'localhost',
    port = '70',
    baseSelector = '/',
    maxLength,
  } = options

  return function transformer(tree: Root): Root {
    const context = new ProcessingContext({
      host,
      port,
      baseSelector,
      prefixes: [],
      maxLength,
    })
    const gopherItems = processNode(tree, context)
    const gophermapContent = gopherItems
      .map(item => formatGopherItem(item))
      .join(CRLF)

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

        // Add gophermap field
        frontmatterData.gophermap = gophermapContent

        // Update the frontmatter node
        yamlNode.value = yaml
          .dump(frontmatterData, {
            lineWidth: -1, // Prevent line wrapping
            noRefs: true, // Prevent YAML references
          })
          .trim()
      } catch {
        // If parsing fails, create new frontmatter with just gophermap
        const yamlNode = frontmatterNode as Yaml
        yamlNode.value = yaml
          .dump(
            { gophermap: gophermapContent },
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
            { gophermap: gophermapContent },
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
