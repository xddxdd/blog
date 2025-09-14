import rehypeShiki from '@shikijs/rehype'
import { defineConfig } from 'astro/config'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeMath from 'rehype-katex'
import rehypePicture from 'rehype-picture'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
// @ts-expect-error - remark-join-cjk-lines types are not available
import remarkJoinCjkLines from 'remark-join-cjk-lines'
import remarkMath from 'remark-math'
// @ts-expect-error - remark-mermaid types are not available
import remarkMermaid from 'remark-mermaid'
import type { Node } from 'unist'
import { visit } from 'unist-util-visit'

import { CRLF } from './gopher'
import { ProcessingContext } from './gopher/context'
import { formatGopherItem, processNode } from './gopher/processing'
import { remarkGraphvizSvg } from './remark-graphviz-svg'

const remarkChineseQuotes = () => (tree: Node) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  visit(tree, (node: any) => {
    if (typeof node.value === 'string') {
      node.value = node.value
        .replaceAll('“', '「')
        .replaceAll('”', '」')
        .replaceAll('‘', '『')
        .replaceAll('’', '』')
    }
  })
}

const remarkGophermap = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function transformer(tree: any, file: any) {
    const context = new ProcessingContext({
      host: '{{server_addr}}',
      port: '{{server_port}}',
      baseSelector: '/',
      prefixes: [],
    })
    const gopherItems = processNode(tree, context)
    const gophermapContent = gopherItems
      .map(item => formatGopherItem(item))
      .join(CRLF)

    file.data.astro.frontmatter.gophermap = gophermapContent
  }
}

export const markdownPluginOptions: Parameters<
  typeof defineConfig
>[0]['markdown'] = {
  syntaxHighlight: false,
  smartypants: false,
  remarkPlugins: [
    remarkFrontmatter,
    remarkChineseQuotes,
    remarkJoinCjkLines,
    remarkGophermap,
    remarkGfm,
    remarkMath,
    remarkGraphvizSvg,
    [
      remarkMermaid,
      {
        simple: true,
      },
    ],
  ],
  rehypePlugins: [
    rehypeMath,
    [
      rehypeShiki,
      {
        themes: {
          dark: 'dark-plus',
          light: 'light-plus',
        },
        wrap: true,
        defaultColor: false,
      },
    ],
    rehypeSlug,
    [
      rehypeExternalLinks,
      {
        rel: ['noopener', 'noreferrer'],
        target: '_blank',
      },
    ],
    [
      rehypePicture,
      Object.fromEntries(
        ['gif', 'jpg', 'png'].map(ext => [
          ext,
          {
            [`${ext}.webp`]: 'image/webp',
            [`${ext}.avif`]: 'image/avif',
            [`${ext}.jxl`]: 'image/jxl',
          },
        ])
      ),
    ],
  ],
}
