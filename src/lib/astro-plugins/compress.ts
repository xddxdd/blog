import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

import { Zstd } from '@hpcc-js/wasm-zstd'
import type { AstroIntegration, AstroIntegrationLogger } from 'astro'
import { glob } from 'glob'
import path from 'path'

const EXTENSIONS = 'html,css,js,atom,stl,xml,svg,json,txt'
const GZIP_ENABLED = true
const BROTLI_ENABLED = true
const ZSTD_ENABLED = true

const log = (
  logger: AstroIntegrationLogger,
  filePath: string,
  compressType: string,
  originalBytes: number,
  compressedBytes: number
) => {
  logger.info(
    `Compressing ${filePath} with ${compressType}: ${originalBytes} -> ${compressedBytes}`
  )
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length)
  const view = new Uint8Array(arrayBuffer)
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i] ?? 0
  }
  return arrayBuffer
}

const createPlugin = (): AstroIntegration => {
  return {
    name: '@lantian1998/astro-compress',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outputDir = fileURLToPath(dir)
        const zstd = await Zstd.load()

        const files = await glob(path.join(outputDir, `**/*.{${EXTENSIONS}}`))
        await Promise.all(
          files.map(async filePath => {
            const content = fs.readFileSync(filePath)
            const originalLength = content.byteLength

            if (GZIP_ENABLED) {
              const gzipContent = zlib.gzipSync(toArrayBuffer(content), {
                level: zlib.constants.Z_BEST_COMPRESSION,
              })
              const gzipLength = gzipContent.byteLength

              log(logger, filePath, 'gzip', originalLength, gzipLength)
              fs.writeFileSync(`${filePath}.gz`, new Uint8Array(gzipContent))
            }

            if (BROTLI_ENABLED) {
              const brotliParams: Record<number, number> = {}
              brotliParams[zlib.constants.BROTLI_PARAM_QUALITY] =
                zlib.constants.BROTLI_MAX_QUALITY
              const brotliContent = zlib.brotliCompressSync(
                toArrayBuffer(content),
                brotliParams
              )
              const brotliLength = brotliContent.byteLength

              log(logger, filePath, 'brotli', originalLength, brotliLength)
              fs.writeFileSync(`${filePath}.br`, new Uint8Array(brotliContent))
            }

            if (ZSTD_ENABLED) {
              const zstdContent = zstd.compress(new Uint8Array(content), 19)
              const zstdLength = zstdContent.byteLength

              log(logger, filePath, 'zstd', originalLength, zstdLength)
              fs.writeFileSync(`${filePath}.zst`, zstdContent)
            }
          })
        )
      },
    },
  }
}

export default createPlugin
