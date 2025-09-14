import type { AstroIntegration } from 'astro'
import { fileURLToPath } from 'node:url'
import path from 'path'
import fs from 'node:fs'

const createPlugin = (): AstroIntegration => {
  return {
    name: '@lantian1998/astro-rename-sitemap',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDir = fileURLToPath(dir)
        const sitemapFrom = path.join(outputDir, 'sitemap-index.xml')
        const sitemapTo = path.join(outputDir, 'sitemap.xml')
        logger.info(`Renaming ${sitemapFrom} to ${sitemapTo}`)
        fs.renameSync(sitemapFrom, sitemapTo)
      },
    },
  }
}

export default createPlugin
