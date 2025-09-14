import type { AstroConfig, AstroIntegration } from 'astro'
import favicons, { type Options } from 'astro-favicons'

export default function wrappedFavicons(config: Options): AstroIntegration {
  const _favicon = favicons(config)

  return {
    name: _favicon.name,
    hooks: {
      'astro:config:setup': async args => {
        const updatedConfig: AstroConfig = {
          ...args.config,
          publicDir: args.config.outDir,
        }
        const setupHook = _favicon.hooks['astro:config:setup']
        if (setupHook) {
          await setupHook({
            ...args,
            config: updatedConfig,
          })
        }
      },
      'astro:server:start': async () => {},
      'astro:build:done': _favicon.hooks['astro:build:start'],
    },
  }
}
