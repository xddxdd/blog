import { Graphviz } from '@hpcc-js/wasm-graphviz'
import rehypeParse from 'rehype-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const remarkGraphvizSvg = (options?: any) => {
  // Destructure options
  const { language = 'graphviz', graphvizEngine = 'dot' } = options ?? {}
  // transformer can be async
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async function transformer(ast: any) {
    const graphviz = await Graphviz.load()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instances: any[] = []
    // visit can't be async
    visit(ast, { type: 'code', lang: language }, (node, index, parent) => {
      instances.push([node.value, index, parent])
    })
    // Convert svg to hast
    const processor = unified().use(rehypeParse, {
      fragment: true,
      space: 'svg',
    })
    // Wait for rendering all instances
    const diagrams = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      instances.map(async ([code]: any) => {
        return graphviz.layout(code, 'svg', graphvizEngine)
      })
    )
    // Replace original code snippets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    instances.forEach(([, index, parent]: any, i: number) => {
      parent.children.splice(index, 1, {
        type: 'paragraph',
        children: [
          {
            type: 'html',
            value: diagrams[i],
          },
        ],
        data: {
          hChildren: processor.parse(diagrams[i] as string).children,
        },
      })
    })
  }
}
