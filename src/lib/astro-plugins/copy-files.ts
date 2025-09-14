import fs from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AstroIntegration } from 'astro'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.join(dirname(__filename), '../../..')

export type CopyFilePairOption = {
  source: string
  dest?: string
}

const createPlugin = (options: CopyFilePairOption[]): AstroIntegration => {
  return {
    name: '@lantian1998/astro-copy-files',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDir = fileURLToPath(dir)
        options.forEach(pair => {
          const source = pair.source.startsWith('/')
            ? pair.source
            : path.join(__dirname, pair.source)
          const dest = path.join(outputDir, pair.dest ?? '/')
          logger.info(`Copying ${source} to ${dest}`)
          fs.cpSync(source, dest, { recursive: true })
          logger.info(`Copy ${source} to ${dest} complete`)
        })
      },
    },
  }
}

export default createPlugin
