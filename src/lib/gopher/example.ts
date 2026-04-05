import * as yaml from 'js-yaml'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

import remarkUnifiedProtocol, { type UnifiedProtocolOptions } from './index.js'

const markdownContent = `---
title: "Welcome to the Unified Protocol Demo"
author: "Protocol Converter"
---

# Welcome to Unified Protocol Support

This demo shows how markdown can be converted to both Gopher and Gemini formats simultaneously.

## Features

- **Gopher Protocol Support**: Traditional menu-based navigation
- **Gemini Protocol Support**: Modern lightweight markup
- **Unified Processing**: Generate both formats from a single markdown source

## Links and Media

Visit our [homepage](/) for more information.

Check out our [documentation](/docs/readme.txt) for detailed instructions.

See our [image gallery](/images/gallery.jpg) for visual content.

## Lists

Here are some key benefits:

* Easy to use
* Supports both protocols
* Maintains content structure
* Extensible architecture

### Numbered Lists

1. Parse markdown
2. Generate Gopher format
3. Generate Gemini format
4. Output results

## Code Example

\`\`\`typescript
import remarkUnifiedProtocol from 'unified-gopher';

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkUnifiedProtocol, {
    gopher: { host: 'gopher.example.com', port: '70' },
    gemini: {}
  });
\`\`\`

## Quotes

> The best way to predict the future is to invent it.
> 
> This unified approach brings together the best of both protocols.

---

Thank you for trying our unified protocol converter!`

async function example(): Promise<void> {
  console.log('='.repeat(60))
  console.log('UNIFIED GOPHER & GEMINI PROTOCOL CONVERTER DEMO')
  console.log('='.repeat(60))
  console.log()

  // Configure the unified processor
  const options: UnifiedProtocolOptions = {
    enableGopher: true,
    enableGemini: true,
    gopher: {
      host: 'gopher.example.com',
      port: '70',
      baseSelector: '/demo/',
      maxLength: 67,
    },
    gemini: {
      baseSelector: '/demo/',
      maxLength: 72,
    },
  }

  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkUnifiedProtocol, options)
    .use(remarkStringify)

  try {
    const result = await processor.process(markdownContent)
    const processedContent = result.toString()

    console.log('PROCESSED MARKDOWN WITH FRONTMATTER:')
    console.log('-'.repeat(60))
    console.log(processedContent)
    console.log()

    // Extract and display the generated formats
    const lines = processedContent.split('\n')
    let inFrontmatter = false
    const frontmatterLines: string[] = []

    for (const line of lines) {
      if (line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
        } else {
          break
        }
      } else if (inFrontmatter) {
        frontmatterLines.push(line)
      }
    }

    if (frontmatterLines.length > 0) {
      try {
        const frontmatterData = yaml.load(
          frontmatterLines.join('\n')
        ) as Record<string, unknown>

        if (frontmatterData.gophermap) {
          console.log('GENERATED GOPHER FORMAT:')
          console.log('-'.repeat(60))
          console.log(frontmatterData.gophermap)
          console.log()
        }

        if (frontmatterData.gemtext) {
          console.log('GENERATED GEMINI FORMAT:')
          console.log('-'.repeat(60))
          console.log(frontmatterData.gemtext)
          console.log()
        }
      } catch (error) {
        console.error('Error parsing frontmatter:', error)
      }
    }

    console.log('✓ Demo completed successfully!')
    console.log()
    console.log(
      'Both Gopher and Gemini formats have been generated from the same'
    )
    console.log('markdown source, demonstrating the unified protocol approach.')
  } catch (error) {
    console.error('Error processing markdown:', error)
    process.exit(1)
  }
}

// Only run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  example().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export default example
