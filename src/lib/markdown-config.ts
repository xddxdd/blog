import { defineConfig } from 'astro/config'
import { remarkGraphvizSvg } from './remark-graphviz-svg'
import rehypeMath from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import rehypeSlug from 'rehype-slug'
import rehypeExternalLinks from 'rehype-external-links'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { processNode, formatGopherItem } from './gopher/processing'
// @ts-ignore
import remarkJoinCjkLines from 'remark-join-cjk-lines'
import remarkMath from 'remark-math'
// @ts-ignore
import remarkMermaid from 'remark-mermaid'
import rehypePicture from 'rehype-picture'
import { visit } from 'unist-util-visit'
import type { Node } from 'unist'
import { CRLF } from './gopher'
import { ProcessingContext } from './gopher/context'

let remarkChineseQuotes = () => (tree: Node) => {
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

let remarkGophermap = () => {
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
