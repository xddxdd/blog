---
title: '与 Hexo 配合使用 Sass 和 Webpack'
categories: 网站与服务端
tags: [Hexo, 静态网站, Webpack, Sass]
date: 2019-10-26 00:48:17
---

## 为何使用 Sass 和 Webpack

Sass 是 CSS 的超集，在 CSS 的基础上扩展了大量的语法，支持规则嵌套、变量定
义、include 等功能，也可以进行数学运算。主要功能可以
在[官方入门教程](https://sass-lang.com/guide)中查看。Sass 原先的文件格式扩展名是
sass，其结构类似 yaml，似乎不与传统 CSS 兼容；而目前 Sass 的文件格式是 scss，兼
容 CSS 文件。

我使用 Sass 的目的，一是更加清晰的 CSS 规则管理。例如，我有一些 CSS 规则希望只对
网站顶栏生效，我就可以将它们全部放到一个代码块中方便管理：

```scss
header {
    h1 { ... }
}
```

二是减少网页加载时的 CSS 代码量。虽然我的网站使用了 Bootstrap，但是我只使用了一
小部分功能，即 Bootstrap 的栅格系统，导航栏和下拉菜单，其它大部分功能都没有使
用，这部分 CSS 就不必加载。同时，我还通过 CSS `!important` 覆盖的方式对一些
Bootstrap 的颜色、形状进行了自定义，这也引入了额外的代码量。

我在我的 scss 文件中定义了全局的控件颜色、字体大小等，同时自己 include Bootstrap
的 scss 文件，注释掉我不需要的功能，最后产生的 CSS 文件大小也会大幅下降。

另外 Sass 产生的 CSS 是合并成一个缩减过大小（Minify）的，最后将这一个文件传上服
务器就好。

我使用 Webpack 也是类似的原因：去除我不需要的 Bootstrap JS 功能，并将 JS 代码压
缩并合并成一个文件。

还有一点：Sass 和 Webpack 可以与 npm 共同使用，用 npm 更新 Bootstrap 等框架的最
新代码，并在 Sass 和 Webpack 的 JS 文件中共同使用。

## 在 Hexo 中使用 Sass 和 Webpack

Hexo 作为一款流行的静态网站生成工具，有大量的插件。我使用的插件是
[hexo-renderer-sass](https://github.com/knksmith57/hexo-renderer-sass) 和
[hexo-webpack](https://github.com/cowsay-blog/hexo-webpack)：

```bash
npm install --save hexo-renderer-sass
npm install --save hexo-webpack
```

对于 Sass，由于我要 include npm 安装的框架代码，需要在主题的 `_config.yml` 中加
入如下代码，让 Sass 去 node_modules 文件夹下找 npm 安装的模块：

```yaml
node_sass:
    includePaths:
        - 'node_modules'
    outputStyle: compressed
```

以 Bootstrap 为例，先用 npm 安装：

```bash
npm install --save bootstrap
```

再在自己的 styles.scss 文件中 include：

```scss
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/mixins';
@import 'bootstrap/scss/root';
@import 'bootstrap/scss/reboot';
@import 'bootstrap/scss/type';
// @import "bootstrap/scss/images";
// @import "bootstrap/scss/code";
@import 'bootstrap/scss/grid';
// @import "bootstrap/scss/tables";
// @import "bootstrap/scss/forms";
// @import "bootstrap/scss/buttons";
// @import "bootstrap/scss/transitions";
@import 'bootstrap/scss/dropdown';
// @import "bootstrap/scss/button-group";
// @import "bootstrap/scss/input-group";
// @import "bootstrap/scss/custom-forms";
@import 'bootstrap/scss/nav';
@import 'bootstrap/scss/navbar';
// @import "bootstrap/scss/card";
// @import "bootstrap/scss/breadcrumb";
// @import "bootstrap/scss/pagination";
// @import "bootstrap/scss/badge";
// @import "bootstrap/scss/jumbotron";
// @import "bootstrap/scss/alert";
// @import "bootstrap/scss/progress";
// @import "bootstrap/scss/media";
// @import "bootstrap/scss/list-group";
// @import "bootstrap/scss/close";
// @import "bootstrap/scss/toasts";
// @import "bootstrap/scss/modal";
// @import "bootstrap/scss/tooltip";
// @import "bootstrap/scss/popover";
// @import "bootstrap/scss/carousel";
// @import "bootstrap/scss/spinners";
@import 'bootstrap/scss/utilities';
// @import "bootstrap/scss/print";
```

对于 Webpack，由于我使用的一些 JS 模块依赖 jQuery，但它们是原生 JS 模块，缺少相
应在 Webpack 中加载 jQuery 模块的指令，因此需要修改 Webpack 配置在主题目录（与
`_config.yml` 同一文件夹）下创建 `webpack.config.js` 文件，使用 Webpack 的
ProvidePlugin 为它们直接提供 jQuery 环境：

```js
const webpack = require('webpack')

module.exports = {
    entry: 'assets/script.js',
    output: {
        filename: 'script.bundle.js',
        path: 'assets',
    },
    mode: 'production',
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
        }),
    ],
}
```

上述配置的入口 JS 文件在 `assets/script.js`，最后生成文件在
`assets/script.bundle.js`。

再以 Bootstrap 为例，在 `script.js` 中用这一行代码，就可以导入 Bootstrap 的下拉
菜单模块，以及它依赖的 jQuery 和 Popper.js：

```js
import 'bootstrap/js/src/dropdown'
```

其它模块同理。

最后修改主题的 head 区域加载最后生成的 CSS 和 JS 文件：

```html
<link rel="stylesheet" href="<%- url_for('assets/style.css') %>" />
<script src="<%- url_for('assets/script.bundle.js') %>"></script>
```

`hexo generate` 即可。
