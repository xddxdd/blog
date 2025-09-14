import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { AstroIntegration } from 'astro'
import { glob } from 'glob'
import path from 'path'

import capo from './capo'

export type CopyFilePairOption = {
  source: string
  dest?: string
}

const createPlugin = (): AstroIntegration => {
  return {
    name: '@lantian1998/astro-capo',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDir = fileURLToPath(dir)

        const htmlFiles = await glob(path.join(outputDir, '**/*.html'))
        await Promise.all(
          htmlFiles.map(filePath => {
            logger.info(`Processing ${filePath} with Capo.js`)
            let content = fs.readFileSync(filePath).toString()
            content = capo(content)
            fs.writeFileSync(filePath, content)
          })
        )
      },
    },
  }
}

export default createPlugin
