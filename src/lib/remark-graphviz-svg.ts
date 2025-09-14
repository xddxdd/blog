import { visit } from 'unist-util-visit'
import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import { Graphviz, type Engine } from '@hpcc-js/wasm-graphviz'
import type { Root, Code, Paragraph, Html, Parent } from 'mdast'
import type { ElementContent } from 'hast'

export const remarkGraphvizSvg = (options?: {
  language?: string
  graphvizEngine?: string
}) => {
  // Destructure options
  const { language = 'graphviz', graphvizEngine = 'dot' } = options ?? {}
  // transformer can be async
  return async function transformer(ast: Root) {
    const graphviz = await Graphviz.load()
    const instances: [string, number, Parent][] = []
    // visit can't be async
    visit(
      ast,
      { type: 'code', lang: language },
      (node: Code, index: number | undefined, parent: Parent) => {
        if (index !== undefined) {
          instances.push([node.value, index, parent])
        }
      }
    )
    // Convert svg to hast
    const processor = unified().use(rehypeParse, {
      fragment: true,
      space: 'svg',
    })
    // Wait for rendering all instances
    const diagrams = await Promise.all(
      instances.map(async ([code]) => {
        return graphviz.layout(
          code as string,
          'svg',
          graphvizEngine as Engine
        )
      })
    )
    // Replace original code snippets
    instances.forEach(([, index, parent], i) => {
      const htmlNode: Html = {
        type: 'html',
        value: diagrams[i] || '',
      }

      const paragraphNode: Paragraph = {
        type: 'paragraph',
        children: [htmlNode],
        data: {
          hChildren: processor.parse(diagrams[i] || '')
            .children as ElementContent[],
        },
      }
      parent.children.splice(index, 1, paragraphNode)
    })
  }
}
