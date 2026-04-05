#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import * as yaml from 'js-yaml'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'

import remarkUnifiedProtocol, {
  type RemarkGeminiOptions,
  type RemarkGophermapOptions,
  type UnifiedProtocolOptions,
} from './index.js'

interface CliOptions {
  input?: string
  outputGopher?: string
  outputGemini?: string
  host?: string
  port?: string
  geminiPort?: number
  baseSelector?: string
  maxLength?: number
  help?: boolean
  version?: boolean
  formatGopher?: boolean
  formatGemini?: boolean
  formatBoth?: boolean
}

function showHelp(): void {
  console.log(`
Usage: unified-gopher [options] <input-file>

Options:
  -o, --output-gopher <file>    Output file for Gopher format
  -g, --output-gemini <file>    Output file for Gemini format
  -h, --host <hostname>         Server hostname (default: localhost)
  -p, --port <string>           Gopher server port (default: '70')
      --gemini-port <number>    Gemini server port (default: 1965)
  -s, --selector <path>         Base selector path (default: /)
  -l, --max-length <number>     Maximum line length (default: 70)
      --gopher                  Generate only Gopher format
      --gemini                  Generate only Gemini format
      --both                    Generate both formats (default)
      --help                    Show this help message
      --version                 Show version information

Examples:
  # Generate both formats to stdout (frontmatter)
  unified-gopher README.md

  # Generate Gopher format to file
  unified-gopher README.md --gopher -o README.gophermap

  # Generate Gemini format to file
  unified-gopher README.md --gemini -g README.gmi

  # Generate both formats to separate files
  unified-gopher README.md --both -o README.gophermap -g README.gmi

  # With custom server settings
  unified-gopher blog-post.md --host blog.example.com --port 70 --gemini-port 1965
`)
}

function showVersion(): void {
  try {
    const packageJson = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8')
    )
    console.log(`unified-gopher v${packageJson.version}`)
  } catch {
    console.log('unified-gopher (version unknown)')
  }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {}
  let i = 0

  while (i < args.length) {
    const arg = args[i]

    switch (arg) {
      case '-o':
      case '--output-gopher':
        options.outputGopher = args[++i]
        break
      case '-g':
      case '--output-gemini':
        options.outputGemini = args[++i]
        break
      case '-h':
      case '--host':
        options.host = args[++i]
        break
      case '-p':
      case '--port':
        options.port = args[++i]
        break
      case '--gemini-port': {
        const geminiPortArg = args[++i]
        if (geminiPortArg) {
          options.geminiPort = parseInt(geminiPortArg, 10)
        }
        break
      }
      case '-s':
      case '--selector':
        options.baseSelector = args[++i]
        break
      case '-l':
      case '--max-length': {
        const maxLengthArg = args[++i]
        if (maxLengthArg) {
          options.maxLength = parseInt(maxLengthArg, 10)
        }
        break
      }
      case '--gopher':
        options.formatGopher = true
        break
      case '--gemini':
        options.formatGemini = true
        break
      case '--both':
        options.formatBoth = true
        break
      case '--help':
        options.help = true
        break
      case '--version':
        options.version = true
        break
      default:
        if (arg && !arg.startsWith('-')) {
          options.input = arg
        } else if (arg) {
          console.error(`Unknown option: ${arg}`)
          process.exit(1)
        }
        break
    }
    i++
  }

  // Set defaults for format flags
  if (!options.formatGopher && !options.formatGemini && !options.formatBoth) {
    options.formatBoth = true
  }

  return options
}

async function convertMarkdownToProtocols(
  markdownContent: string,
  options: UnifiedProtocolOptions
): Promise<{ gophermap?: string; gemtext?: string }> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkUnifiedProtocol, options)
    .use(remarkStringify)

  const result = await processor.process(markdownContent)

  // Extract gophermap and gemtext from frontmatter
  let gophermap: string | undefined
  let gemtext: string | undefined

  // Try to parse frontmatter from the processed content
  if (result.toString().includes('---')) {
    const lines = result.toString().split('\n')
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
        gophermap = frontmatterData.gophermap as string
        gemtext = frontmatterData.gemtext as string
      } catch {
        // If frontmatter parsing fails, return empty strings
      }
    }
  }

  return { gophermap, gemtext }
}

async function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    showHelp()
    process.exit(1)
  }

  const options = parseArgs(args)

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  if (options.version) {
    showVersion()
    process.exit(0)
  }

  if (!options.input) {
    console.error('Error: No input file specified')
    console.error('Use --help for usage information')
    process.exit(1)
  }

  try {
    // Read input file
    const markdownContent = readFileSync(options.input, 'utf8')

    // Determine which formats to generate
    const enableGopher = options.formatGopher || options.formatBoth
    const enableGemini = options.formatGemini || options.formatBoth

    // Convert to protocols
    const unifiedOptions: UnifiedProtocolOptions = {
      enableGopher,
      enableGemini,
      gopher: {
        host: options.host,
        port: options.port,
        baseSelector: options.baseSelector,
        maxLength: options.maxLength,
      } as RemarkGophermapOptions,
      gemini: {
        host: options.host,
        port: options.geminiPort,
        baseSelector: options.baseSelector,
        maxLength: options.maxLength,
      } as RemarkGeminiOptions,
    }

    const { gophermap, gemtext } = await convertMarkdownToProtocols(
      markdownContent,
      unifiedOptions
    )

    // Output results
    if (options.outputGopher && gophermap) {
      writeFileSync(options.outputGopher, gophermap)
      console.error(
        `✓ Generated Gopher: ${options.input} → ${options.outputGopher}`
      )
    }

    if (options.outputGemini && gemtext) {
      writeFileSync(options.outputGemini, gemtext)
      console.error(
        `✓ Generated Gemini: ${options.input} → ${options.outputGemini}`
      )
    }

    // If no specific output files, output to stdout
    if (!options.outputGopher && !options.outputGemini) {
      if (enableGopher && enableGemini) {
        console.log('=== GOPHER ===')
        if (gophermap) console.log(gophermap)
        console.log('\n=== GEMINI ===')
        if (gemtext) console.log(gemtext)
      } else if (enableGopher && gophermap) {
        console.log(gophermap)
      } else if (enableGemini && gemtext) {
        console.log(gemtext)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error(`Error: Input file '${options.input}' not found`)
      } else if (error.message.includes('EACCES')) {
        console.error(`Error: Permission denied accessing '${options.input}'`)
      } else {
        console.error(`Error: ${error.message}`)
      }
    } else {
      console.error('Error: An unknown error occurred')
    }
    process.exit(1)
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
