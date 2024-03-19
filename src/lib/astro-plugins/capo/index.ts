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

const createPlugin = (_?: any): AstroIntegration => {
  return {
    name: '@lantian1998/astro-capo',
    hooks: {
      // @ts-ignore
      'astro:build:done': async ({ dir, routes, pages, logger }) => {
        const outputDir = fileURLToPath(dir)

        const htmlFiles = await glob(path.join(outputDir, '**/*.html'))
        htmlFiles.forEach(filePath => {
          logger.info(`Processing ${filePath} with Capo.js`)
          let content = fs.readFileSync(filePath).toString()
          content = capo(content)
          fs.writeFileSync(filePath, content)
        })
      },
    },
  }
}

export default createPlugin
