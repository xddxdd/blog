'use strict';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { remarkGraphvizSvg } from './remark-graphviz-svg';
import remarkMermaid from 'remark-mermaid';
import remark2rehype from 'remark-rehype';
import { includeMarkdown } from '@hashicorp/platform-remark-plugins';
import rehypeHighlight from 'rehype-highlight';
import rehypeMath from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import path from 'path';
import highlightLanguages from './highlight-js-languages';

function remark2rehypeHexoMoreHandler(h, node) {
  const newNode = h(node);
  newNode.type = 'comment';
  newNode.value = 'more';

  delete newNode.tagName;

  return newNode;
}

export const markdownEngine = unified()
  .use(remarkParse)
  .use(includeMarkdown, {
    resolveFrom: path.join(__dirname, '../../../../source'),
  })
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkGraphvizSvg)
  .use(remarkMermaid, { simple: true })
  .use(remark2rehype, {
    allowDangerousHTML: true,
    handlers: { excerptDelimitor: remark2rehypeHexoMoreHandler },
  })
  .use(rehypeMath)
  .use(rehypeHighlight, { languages: highlightLanguages })
  .use(rehypeStringify);
