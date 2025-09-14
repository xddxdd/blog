import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import path from 'path'
import fs from 'node:fs'
import capo from './capo'
import { glob } from 'glob'

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
