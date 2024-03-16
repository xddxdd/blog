import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

// import { includeMarkdown } from '@hashicorp/platform-remark-plugins'
import highlightLanguages from './src/lib/highlight-js-languages';
import { remarkGraphvizSvg } from './src/lib/remark-graphviz-svg';
import path from 'path';
import rehypeHighlight from 'rehype-highlight';
import rehypeMath from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkJoinCjkLines from 'remark-join-cjk-lines';
import remarkMath from 'remark-math';
import remarkMermaid from 'remark-mermaid';
import { visit } from 'unist-util-visit';

export const chineseQuotes = (s) =>
  typeof s === 'string'
    ? s
        .replaceAll('“', '「')
        .replaceAll('”', '」')
        .replaceAll('‘', '『')
        .replaceAll('’', '』')
    : s;

let remarkChineseQuotes = () => (tree) => {
  visit(tree, (node) => {
    if (typeof node.value === 'string') {
      node.value = chineseQuotes(node.value);
    }
    return node;
  });
};

const markdownPluginOptions = {
  syntaxHighlight: false,
  remarkPlugins: [
    // [
    //   includeMarkdown,
    //   {
    //     resolveFrom: path.join(__dirname, 'src/content'),
    //   },
    // ],
    remarkFrontmatter,
    remarkGfm,
    remarkChineseQuotes,
    remarkJoinCjkLines,
    remarkMath,
    remarkGraphvizSvg,
    [remarkMermaid, { simple: true }],
  ],
  rehypePlugins: [
    rehypeMath,
    [rehypeHighlight, { languages: highlightLanguages }],
    rehypeSlug,
  ],
};

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(markdownPluginOptions), sitemap()],
  markdown: markdownPluginOptions,
});
