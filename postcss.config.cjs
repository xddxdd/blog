/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: [
    require('postcss-preset-env'),
    require('postcss-inline-svg'),
    require('postcss-sorting'),
    require('cssnano')({
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
