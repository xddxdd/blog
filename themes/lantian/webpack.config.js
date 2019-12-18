const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    main: 'assets/script.js',
    search: 'assets/script.search.js',
  },
  output: {
    filename: 'script.[name].bundle.js',
    path: 'assets',
  },

  // mode: 'development',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [[
            '@babel/preset-env',
            {
              "targets": {
                "firefox": "52",
              }
            }
          ]]
        }
      }
    ]
  },
  stats: {
    colors: true
  }
};