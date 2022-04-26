'use strict';

import { includeMarkdown } from '@hashicorp/platform-remark-plugins';
import { remarkGraphvizSvg } from './remark-graphviz-svg';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import highlightLanguages from './highlight-js-languages';
import path from 'path';
import rehypeHighlight from 'rehype-highlight';
import rehypeMath from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkInlineLinks from 'remark-inline-links';
import remarkMath from 'remark-math';
import remarkMermaid from 'remark-mermaid';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

function remarkRehypeHexoMoreHandler(h, node) {
  const newNode = h(node);
  newNode.type = 'comment';
  newNode.value = 'more';

  delete newNode.tagName;

  return newNode;
}

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

export const markdownEngine = unified()
  .use(remarkParse)
  .use(includeMarkdown, {
    resolveFrom: path.join(__dirname, '../../../../source'),
  })
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkChineseQuotes)
  .use(remarkMath)
  .use(remarkGraphvizSvg)
  .use(remarkMermaid, { simple: true })
  .use(remarkRehype, {
    allowDangerousHtml: true,
    handlers: { excerptDelimitor: remarkRehypeHexoMoreHandler },
  })
  .use(rehypeMath)
  .use(rehypeHighlight, { languages: highlightLanguages })
  .use(rehypeStringify, {
    allowDangerousHtml: true,
  })
  .freeze();

export const gopherEngine = unified()
  .use(remarkParse)
  .use(includeMarkdown, {
    resolveFrom: path.join(__dirname, '../../../../source'),
  })
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkChineseQuotes)
  .use(remarkInlineLinks)
  .use(remarkStringify, {
    bullet: '-',
    fences: true,
    listItemIndent: 'one',
    resourceLink: false,
  })
  .freeze();
