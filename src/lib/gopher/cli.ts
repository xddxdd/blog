#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import remarkGophermap, { type RemarkGophermapOptions } from './index.js';
import * as yaml from 'js-yaml';

interface CliOptions {
  input: string;
  output?: string;
  host: string;
  port: string;
  baseSelector: string;
  maxLength?: number;
  help?: boolean;
  version?: boolean;
}

function showHelp() {
  console.log(`
remark-gophermap CLI - Convert Markdown to Gopher protocol format

Usage:
  remark-gophermap <input.md> [options]

Options:
  -o, --output <file>        Output file (default: stdout)
  -h, --host <hostname>      Gopher server hostname (default: localhost)
  -p, --port <string>        Gopher server port (default: 70)
  -s, --selector <path>      Base selector path (default: /)
  -l, --max-length <number>  Maximum line length for text wrapping (default: 70)
  --help                     Show this help message
  --version                  Show version information

Examples:
  # Convert to stdout
  remark-gophermap README.md

  # Convert to file
  remark-gophermap README.md -o README.gophermap

  # With custom server settings
  remark-gophermap blog-post.md -h blog.example.com -p 70 -s /posts/

  # Pipe output
  remark-gophermap article.md | less
`);
}

function showVersion() {
  // Read version from package.json
  try {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    );
    console.log(`remark-gophermap v${packageJson.version}`);
  } catch {
    console.log('remark-gophermap (version unknown)');
  }
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    input: '',
    host: 'localhost',
    port: '70',
    baseSelector: '/',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg) continue;

    switch (arg) {
      case '--help':
        options.help = true;
        break;
      case '--version':
        options.version = true;
        break;
      case '-o':
      case '--output':
        const outputValue = args[++i];
        if (!outputValue) {
          console.error('Error: --output requires a value');
          process.exit(1);
        }
        options.output = outputValue;
        break;
      case '-h':
      case '--host':
        const hostValue = args[++i];
        if (!hostValue) {
          console.error('Error: --host requires a value');
          process.exit(1);
        }
        options.host = hostValue;
        break;
      case '-p':
      case '--port':
        const portValue = args[++i];
        if (!portValue) {
          console.error('Error: --port requires a value');
          process.exit(1);
        }
        options.port = portValue;
        break;
      case '-s':
      case '--selector':
        const selectorValue = args[++i];
        if (!selectorValue) {
          console.error('Error: --selector requires a value');
          process.exit(1);
        }
        options.baseSelector = selectorValue;
        break;
      case '-l':
      case '--max-length':
        const maxLengthValue = args[++i];
        if (!maxLengthValue) {
          console.error('Error: --max-length requires a value');
          process.exit(1);
        }
        const maxLengthNum = parseInt(maxLengthValue, 10);
        if (isNaN(maxLengthNum) || maxLengthNum <= 0) {
          console.error('Error: --max-length must be a positive number');
          process.exit(1);
        }
        options.maxLength = maxLengthNum;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Error: Unknown option '${arg}'`);
          console.error('Use --help for usage information');
          process.exit(1);
        } else if (!options.input) {
          options.input = arg;
        } else {
          console.error('Error: Multiple input files specified');
          console.error('Use --help for usage information');
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

async function convertMarkdownToGophermap(
  markdownContent: string,
  options: RemarkGophermapOptions,
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ['yaml', 'toml'])
    .use(remarkGophermap, options)
    .use(remarkStringify);

  const result = await processor.process(markdownContent);
  const processedMarkdown = String(result);

  // Extract gophermap from frontmatter
  const frontmatterMatch = processedMarkdown.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    try {
      const frontmatterData = yaml.load(frontmatterMatch[1]!) as Record<
        string,
        unknown
      >;
      const gophermap = frontmatterData.gophermap;
      return typeof gophermap === 'string' ? gophermap : '';
    } catch (error) {
      // If frontmatter parsing fails, return empty string
      return '';
    }
  }

  return '';
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(1);
  }

  const options = parseArgs(args);

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.version) {
    showVersion();
    process.exit(0);
  }

  if (!options.input) {
    console.error('Error: No input file specified');
    console.error('Use --help for usage information');
    process.exit(1);
  }

  try {
    // Read input file
    const markdownContent = readFileSync(options.input, 'utf8');

    // Convert to gophermap
    const gophermapOptions: RemarkGophermapOptions = {
      host: options.host,
      port: options.port,
      baseSelector: options.baseSelector,
      maxLength: options.maxLength,
    };

    const gophermap = await convertMarkdownToGophermap(
      markdownContent,
      gophermapOptions,
    );

    // Output result
    if (options.output) {
      writeFileSync(options.output, gophermap);
      console.error(`✓ Converted ${options.input} → ${options.output}`);
    } else {
      process.stdout.write(gophermap);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        console.error(`Error: Input file '${options.input}' not found`);
      } else if (error.message.includes('EACCES')) {
        console.error(`Error: Permission denied accessing '${options.input}'`);
      } else {
        console.error(`Error: ${error.message}`);
      }
    } else {
      console.error('Error: An unknown error occurred');
    }
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
