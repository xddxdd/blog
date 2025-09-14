import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import remarkGophermap from './index.js';
import * as yaml from 'js-yaml';

const markdown = `# Welcome to My Gopher Site

This is a sample markdown document that will be converted to a gophermap.

## About Gopher

The Gopher protocol is a simple protocol for distributing documents over the internet. It was popular before the World Wide Web became dominant.

### Features

- Simple text-based protocol
- Hierarchical menu structure
- Fast and lightweight

## Images and Media

Check out these visual resources:

- [Gopher Logo](gopher-logo.gif)
- [Network Diagram](network-diagram.png)
- [Protocol Chart](protocol-chart.jpg)
- [Audio Guide](gopher-guide.mp3)

## Links

Here are some useful links:

- [Gopher Wikipedia](https://en.wikipedia.org/wiki/Gopher_(protocol))
- [RFC 1436](https://tools.ietf.org/html/rfc1436)
- [sample.txt](sample.txt)

## Code Example

Here's a simple gopher client:

\`\`\`
telnet gopher.floodgap.com 70
\`\`\`

> "The Gopher protocol is a communications protocol designed for distributing, searching, and retrieving documents in Internet Protocol networks."

Thank you for visiting!
`;

async function example(): Promise<void> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGophermap, {
      host: 'example.com',
      port: '70',
      baseSelector: '/docs/',
    })
    .use(remarkStringify);

  const result = await processor.process(markdown);
  const processedMarkdown = String(result);

  console.log('Generated Markdown with Gophermap in Frontmatter:');
  console.log('=================================================');
  console.log(processedMarkdown);

  // Extract just the gophermap content
  const frontmatterMatch = processedMarkdown.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    try {
      const frontmatterData = yaml.load(frontmatterMatch[1]!) as Record<
        string,
        unknown
      >;
      const gophermap = frontmatterData.gophermap;
      if (typeof gophermap === 'string') {
        console.log('\nExtracted Gophermap:');
        console.log('===================');
        console.log(gophermap);
      }
    } catch (error) {
      console.error('Error parsing frontmatter:', error);
    }
  }
}

example().catch(console.error);
