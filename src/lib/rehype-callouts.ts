import type { Element, ElementContent, Root } from 'hast'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

import { DEFAULT_LANGUAGE, LANGUAGES } from './language'

// Maps the `> [!TYPE]` marker (GitHub alert style) at the start of a
// blockquote to a canonical callout type
type CalloutType = 'info' | 'tip' | 'important' | 'warning' | 'error'
const CALLOUT_TYPES: Record<string, CalloutType> = {
  note: 'info',
  info: 'info',
  tip: 'tip',
  important: 'important',
  warning: 'warning',
  attention: 'warning',
  caution: 'error',
  error: 'error',
  danger: 'error',
}

export const rehypeCallouts: Plugin<[], Root> = () => (tree, file) => {
  // Language of the rendered document, taken from its content directory,
  // e.g. src/content/article/zh/<category>/... (article may have an
  // intermediate category level) or src/content/lab/en/...
  const languageSegment = /(?:article|lab|page)\/(?:[^/]+\/)*(en|zh)\//.exec(
    file.path ?? ''
  )?.[1]
  const language = LANGUAGES[languageSegment ?? ''] ?? DEFAULT_LANGUAGE

  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'blockquote') return
    // remark-rehype interleaves '\n' text nodes between block elements
    const paragraph = node.children.find(
      (child): child is Element => child.type === 'element'
    )
    if (!paragraph || paragraph.tagName !== 'p') return
    const firstInline = paragraph.children.find(
      (child): child is ElementContent =>
        child.type === 'element' ||
        (child.type === 'text' && child.value.trim() !== '')
    )
    if (!firstInline || firstInline.type !== 'text') return
    const match = /^\[!([a-zA-Z]+)\]/.exec(firstInline.value)
    const key = match?.[1]
    if (!key) return
    const type = CALLOUT_TYPES[key.toLowerCase()]
    if (!type) return

    // marker length: `[!` + key + `]`
    firstInline.value = firstInline.value.slice(key.length + 3)
    if (firstInline.value.trim() === '') {
      paragraph.children = paragraph.children.filter(
        child => child !== firstInline
      )
    }
    if (
      paragraph.children.every(
        child => child.type === 'text' && child.value.trim() === ''
      )
    ) {
      node.children = node.children.filter(child => child !== paragraph)
    }

    node.tagName = 'div'
    node.properties.className = ['callout', `callout-${type}`]
    node.children.unshift({
      type: 'element',
      tagName: 'p',
      properties: { className: ['callout-title'] },
      children: [
        {
          type: 'element',
          tagName: 'i',
          properties: { className: ['callout-icon'] },
          children: [],
        },
        { type: 'text', value: language.getTranslation(`callout_${type}`) },
      ],
    })
  })
}
