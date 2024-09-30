import type { AstroIntegration, AstroIntegrationLogger } from 'astro'
import { fileURLToPath } from 'node:url'
import path from 'path'
import fs from 'node:fs'
import { glob } from 'glob'
import zlib from 'node:zlib'
import { Zstd } from '@hpcc-js/wasm-zstd'

const EXTENSIONS = 'html,css,js,atom,stl,xml,svg,json,txt'
const GZIP_ENABLED = true
const BROTLI_ENABLED = true
const ZSTD_ENABLED = true

const shouldKeep = (
  logger: AstroIntegrationLogger,
  filePath: string,
  compressType: string,
  originalBytes: number,
  compressedBytes: number,
  acceptableBytes: number
): boolean => {
  if (compressedBytes < acceptableBytes) {
    logger.info(
      `Compressing ${filePath} with ${compressType}: ${originalBytes} -> ${compressedBytes}`
    )
    return true
  } else {
    logger.info(
      `Compressing ${filePath} with ${compressType}: ${originalBytes} -> ${compressedBytes} (max acceptable ${acceptableBytes}, discarding)`
    )
    return false
  }
}

const createPlugin = (_?: any): AstroIntegration => {
  return {
    name: '@lantian1998/astro-compress',
    hooks: {
      // @ts-ignore
      'astro:build:done': async ({ dir, routes, pages, logger }) => {
        const outputDir = fileURLToPath(dir)
        const zstd = await Zstd.load()

        const files = await glob(path.join(outputDir, `**/*.{${EXTENSIONS}}`))
        await Promise.all(
          files.map(async filePath => {
            const content = fs.readFileSync(filePath)
            const originalLength = content.byteLength
            let acceptableLength = originalLength

            if (GZIP_ENABLED) {
              const gzipContent = zlib.gzipSync(content, {
                level: zlib.constants.Z_BEST_COMPRESSION,
              })
              const gzipLength = gzipContent.byteLength

              if (
                shouldKeep(
                  logger,
                  filePath,
                  'gzip',
                  originalLength,
                  gzipLength,
                  acceptableLength
                )
              ) {
                fs.writeFileSync(`${filePath}.gz`, gzipContent)
                acceptableLength = Math.min(acceptableLength, gzipLength)
              }
            }

            if (BROTLI_ENABLED) {
              const brotliParams: Record<number, number> = {}
              brotliParams[zlib.constants.BROTLI_PARAM_QUALITY] =
                zlib.constants.BROTLI_MAX_QUALITY
              const brotliContent = zlib.brotliCompressSync(
                content,
                brotliParams
              )
              const brotliLength = brotliContent.byteLength

              if (
                shouldKeep(
                  logger,
                  filePath,
                  'brotli',
                  originalLength,
                  brotliLength,
                  acceptableLength
                )
              ) {
                fs.writeFileSync(`${filePath}.br`, brotliContent)
                acceptableLength = Math.min(acceptableLength, brotliLength)
              }
            }

            if (ZSTD_ENABLED) {
              const zstdContent = zstd.compress(content, 19)
              const zstdLength = zstdContent.byteLength

              if (
                shouldKeep(
                  logger,
                  filePath,
                  'zstd',
                  originalLength,
                  zstdLength,
                  acceptableLength
                )
              ) {
                fs.writeFileSync(`${filePath}.zst`, zstdContent)
                acceptableLength = Math.min(acceptableLength, zstdLength)
              }
            }
          })
        )
      },
    },
  }
}

export default createPlugin
