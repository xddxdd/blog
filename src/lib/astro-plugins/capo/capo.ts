// https://github.com/natemoo-re/astro-capo/blob/main/src/capo/index.ts
import type { ElementNode } from 'ultrahtml'
import { ELEMENT_NODE, parse, renderSync, walkSync } from 'ultrahtml'

import { getWeight } from './rules.ts'

export default function capo(html: string) {
  const ast = parse(html)
  try {
    walkSync(ast, (node, parent, index) => {
      if (node.type === ELEMENT_NODE && node.name === 'head') {
        if (parent) {
          parent.children.splice(index, 1, getSortedHead(node))
          throw 'done' // short-circuit
        }
      }
    })
  } catch (e) {
    if (e !== 'done') throw e
  }
  return renderSync(ast)
}

function getSortedHead(head: ElementNode): ElementNode {
  const weightedChildren = head.children
    .map(node => {
      if (node.type === ELEMENT_NODE) {
        const weight = getWeight(node)
        return [weight, node]
      }
      return false
    })
    .filter(Boolean) as [number, ElementNode][]
  const children = weightedChildren
    .sort((a, b) => b[0] - a[0])
    .map(([, element]) => element)
  return { ...head, children }
}
