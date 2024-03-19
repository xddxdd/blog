import { defineConfig, type AstroUserConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import highlightLanguages from './src/lib/highlight-js-languages'
import { remarkGraphvizSvg } from './src/lib/remark-graphviz-svg'
import rehypeHighlight from 'rehype-highlight'
import rehypeMath from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkJoinCjkLines from 'remark-join-cjk-lines'
import remarkMath from 'remark-math'
import remarkMermaid from 'remark-mermaid'
import { visit } from 'unist-util-visit'
import react from '@astrojs/react'
import copyFiles from './src/lib/astro-plugins/copy-files'
import type { Node } from 'unist'

export const chineseQuotes = (s: any) =>
  typeof s === 'string'
    ? s
        .replaceAll('“', '「')
        .replaceAll('”', '」')
        .replaceAll('‘', '『')
        .replaceAll('’', '』')
    : s
let remarkChineseQuotes = () => (tree: Node) => {
  visit(tree, (node: any) => {
    if (typeof node.value === 'string') {
      node.value = chineseQuotes(node.value)
    }
  })
}
const markdownPluginOptions: AstroUserConfig['markdown'] = {
  syntaxHighlight: false,
  smartypants: false,
  remarkPlugins: [
    remarkFrontmatter,
    remarkGfm,
    remarkChineseQuotes,
    remarkJoinCjkLines,
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
      rehypeHighlight,
      {
        languages: highlightLanguages,
      },
    ],
    rehypeSlug,
  ],
}

// https://astro.build/config
export default defineConfig({
  site: 'https://lantian.pub',
  integrations: [
    mdx(),
    sitemap(),
    react(),
    copyFiles([{ source: './src/assets/favicon/generated', dest: '.' }]),
  ],
  markdown: markdownPluginOptions,
  build: {
    format: 'preserve',
    assets: 'assets',
  },
  // I use instant.page instead
  prefetch: false,
})
