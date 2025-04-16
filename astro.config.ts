import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import { remarkGraphvizSvg } from './src/lib/remark-graphviz-svg'
import rehypeMath from 'rehype-katex'
import rehypeShiki from '@shikijs/rehype'
import rehypeSlug from 'rehype-slug'
import rehypeExternalLinks from 'rehype-external-links'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
// @ts-ignore
import remarkJoinCjkLines from 'remark-join-cjk-lines'
import remarkMath from 'remark-math'
// @ts-ignore
import remarkMermaid from 'remark-mermaid'
import { visit } from 'unist-util-visit'
import react from '@astrojs/react'
import renameSitemap from './src/lib/astro-plugins/rename-sitemap'
import capo from './src/lib/astro-plugins/capo'
import compress from './src/lib/astro-plugins/compress'
import type { Node } from 'unist'
import favicons from './src/lib/astro-plugins/favicons'
import { SITE_TITLE } from './src/consts'

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
const markdownPluginOptions: Parameters<typeof defineConfig>[0]['markdown'] = {
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
  ],
}

// https://astro.build/config
export default defineConfig({
  site: 'https://lantian.pub',
  integrations: [
    mdx(),

    // Generate sitemap-index.xml and rename it to sitemap.xml with renameSitemap
    sitemap(),
    renameSitemap(),

    react(),

    favicons({
      input: './src/assets/favicon.svg',
      // I run capo myself
      withCapo: false,
      name: SITE_TITLE,
      short_name: SITE_TITLE,
      appleStatusBarStyle: 'black-translucent',
      themes: ['#03a9f4', '#212121'],
      background: '#bbdefb',
      manifest: {
        description: SITE_TITLE,
        start_url: 'https://lantian.pub',
        display_override: ['browser'],
      },
      icons: {
        favicons: true,
        android: true,
        appleIcon: true,
        appleStartup: true,
        windows: true,
        yandex: true,
      },
      pixel_art: true,
      manifestMaskable: false,
      shortcuts: [],
      screenshots: [],
      output: {
        images: true,
        files: true,
        html: true,
      },
    }),

    // Capo must be after all HTML pages are generated
    capo(),
    compress(),
  ],
  markdown: markdownPluginOptions,
  build: {
    format: 'preserve',
    assets: 'assets',
  },
  // I use instant.page instead
  prefetch: false,
})
