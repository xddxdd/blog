'use strict';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { remarkGraphvizSvg } from "./remark-graphviz-svg";
import remarkMermaid from 'remark-mermaid';
import remark2rehype from 'remark-rehype';
import { includeMarkdown } from '@hashicorp/platform-remark-plugins';
import rehypeHighlight from 'rehype-highlight';
import rehypeMath from 'rehype-katex';
import rehypeFormat from 'rehype-format';
import rehypeStringify from 'rehype-stringify';
import path from 'path';

function remark2rehypeHexoMoreHandler(h, node) {
  const newNode = h(node);
  newNode.type = 'comment';
  newNode.value = 'more';

  delete newNode.tagName;

  return newNode;
}

const engine = unified()
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
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(rehypeFormat)
  .use(rehypeStringify);

async function renderer(data) {
  return engine.process(data.text).then((result) => {
    return result.toString();
  });
}

module.exports = renderer;
