const webpack = require('webpack');

module.exports = {
  entry: 'assets/script.js',
  output: {
    filename: 'script.bundle.js',
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