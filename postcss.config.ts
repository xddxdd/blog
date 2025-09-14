import cssnano from 'cssnano'
import postcssInlineSvg from 'postcss-inline-svg'
import type { Config } from 'postcss-load-config'
import postcssPresetEnv from 'postcss-preset-env'
import postcssSorting from 'postcss-sorting'

const config: Config = {
  plugins: [
    postcssPresetEnv,
    postcssInlineSvg,
    postcssSorting,
    cssnano({
      preset: [
        'advanced',
        {
          autoprefixer: {
            add: true,
            remove: true,
            grid: 'autoplace',
          },
          cssDeclarationSorter: { order: 'smacss' },
          discardComments: { removeAll: true },
        },
      ],
    }),
  ],
}

export default config
