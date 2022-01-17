const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const miniSVGDataURI = require('mini-svg-data-uri');

module.exports = {
    entry: {
        main: '_assets/script.main.js',
        style: '_assets/script.style.js',
        style_twine: '_assets/script.style.twine.js',
        style_bigscreen_indihome: '_assets/bigscreen/indihome/script.style.js',
    },
    output: {
        filename: 'script.[name].bundle.js',
        path: 'assets',
        publicPath: '',
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
            new CssMinimizerPlugin({
                minify: CssMinimizerPlugin.cssnanoMinify,
                minimizerOptions: {
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
                },
            }),
        ],
    },
    plugins: [new MiniCssExtractPlugin()],
    module: {
        rules: [
            {
                test: /\.js$/,
                // exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                options: {
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                bugfixes: true,
                                useBuiltIns: 'entry',
                                corejs: 3,
                                forceAllTransforms: true,
                                shippedProposals: true,
                            },
                        ],
                    ],
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Extract CSS to file
                    MiniCssExtractPlugin.loader,

                    // Translates CSS into CommonJS
                    'css-loader',

                    // Translate resource path
                    'resolve-url-loader',

                    // Compiles Sass to CSS
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                            implementation: require('sass'),
                        },
                    },
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.svg$/i,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 16 * 1024,
                    },
                },
                generator: {
                    dataUrl(content) {
                        content = content.toString();
                        return miniSVGDataURI(content);
                    },
                },
                use: 'svgo-loader',
            },
            {
                test: /\.(jp(e)?g|png|gif|webp)$/i,
                type: 'asset',
                parser: {
                    dataUrlCondition: {
                        maxSize: 16 * 1024,
                    },
                },
            },
        ],
    },
    stats: {
        colors: true,
    },
};
