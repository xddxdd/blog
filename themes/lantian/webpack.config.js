const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
  entry: {
    main: '_assets/script.main.js',
    search: '_assets/script.search.js',
    style: '_assets/script.style.js',
  },
  output: {
    filename: 'script.[name].bundle.js',
    path: 'assets',
  },

  // mode: 'development',
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserJSPlugin({
        terserOptions: {
          parse: {},
          compress: {
            arguments: true,
            booleans_as_integers: true,
            // drop_console: true,
            passes: 2,
          },
          output: {
            comments: false,
          },
          ie8: true,
          safari10: true,
        },
        extractComments: false,
      }), 
      new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
          preset: [
            'advanced', 
            {
              autoprefixer: { add: true, remove: true, grid: "autoplace" },
              cssDeclarationSorter: { order: 'smacss' },
              discardComments: { removeAll: true }
            }
          ],
        },
      })
    ],
  },
  plugins: [
    new MiniCssExtractPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        // exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                bugfixes: true,
                useBuiltIns: 'entry',
                corejs: 3,
                forceAllTransforms: true,
                shippedProposals: true,
              }
            ]
          ],
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Extract CSS to file
          MiniCssExtractPlugin.loader,

          // Translates CSS into CommonJS
          'css-loader',

          // Translate resource path
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true,
            }
          },

          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
            }
          },
        ],
      },
      {
        test: /\.(woff(2)?|ttf|eot|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'res',
            }
          }
        ]
      }
    ]
  },
  stats: {
    colors: true
  }
};