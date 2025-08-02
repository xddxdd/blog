import type {
  RemarkGophermapOptions,
  MarkdownNode,
  GophermapVFile,
} from './types.js';

import { processNode, formatGopherItem } from './processing.js';
import * as yaml from 'js-yaml';

// Re-export types for consumers
export type {
  GopherItemType,
  RemarkGophermapOptions,
  ProcessingContext,
  GopherItem,
  MarkdownNode,
  GophermapVFile,
} from './types.js';

/**
 * Remark plugin to convert markdown AST to Gopher protocol format (gophermap)
 * and insert it into the frontmatter
 *
 * Architecture: Each processing function handles only one layer of the syntax tree
 * and returns structured gopher item objects. Recursion handles nested layers.
 */
export default function remarkGophermap(options: RemarkGophermapOptions = {}) {
  const { host = 'localhost', port = '70', baseSelector = '/' } = options;

  return function transformer(
    tree: MarkdownNode,
    _file: GophermapVFile,
  ): MarkdownNode {
    const gopherItems = processNode(tree, { host, port, baseSelector });
    const gophermapContent = gopherItems
      .map((item) => formatGopherItem(item))
      .join('\r\n');

    // Find or create frontmatter node
    let frontmatterNode = tree.children?.find(
      (child) => child.type === 'yaml' || child.type === 'toml',
    );

    if (frontmatterNode && frontmatterNode.type === 'yaml') {
      // Parse existing YAML frontmatter
      try {
        const frontmatterData = frontmatterNode.value
          ? (yaml.load(frontmatterNode.value) as Record<string, unknown>)
          : {};

        // Add gophermap field
        frontmatterData.gophermap = gophermapContent;

        // Update the frontmatter node
        frontmatterNode.value = yaml
          .dump(frontmatterData, {
            lineWidth: -1, // Prevent line wrapping
            noRefs: true, // Prevent YAML references
          })
          .trim();
      } catch (error) {
        // If parsing fails, create new frontmatter with just gophermap
        frontmatterNode.value = yaml
          .dump(
            { gophermap: gophermapContent },
            {
              lineWidth: -1,
              noRefs: true,
            },
          )
          .trim();
      }
    } else if (frontmatterNode && frontmatterNode.type === 'toml') {
      // For TOML, we'll just append the gophermap field as a comment for now
      // since TOML parsing/stringifying is more complex
      frontmatterNode.value =
        (frontmatterNode.value || '') + `\n# gophermap field would go here`;
    } else {
      // No frontmatter exists, create new YAML frontmatter
      const newFrontmatter: MarkdownNode = {
        type: 'yaml',
        value: yaml
          .dump(
            { gophermap: gophermapContent },
            {
              lineWidth: -1,
              noRefs: true,
            },
          )
          .trim(),
      };

      // Insert at the beginning of the document
      if (!tree.children) {
        tree.children = [];
      }
      tree.children.unshift(newFrontmatter);
    }

    return tree;
  };
}
