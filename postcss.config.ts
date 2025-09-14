import cssnano from 'cssnano'
import postcssInlineSvg from 'postcss-inline-svg'
import postcssPresetEnv from 'postcss-preset-env'
import postcssSorting from 'postcss-sorting'

const config = {
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
