---
title: 'Using Sass and Webpack with Hexo'
categories: Website and Servers
tags: [Hexo, Static Website, Webpack, Sass]
date: 2019-10-26 00:48:17
autoTranslated: true
---


## Why Use Sass and Webpack

Sass is a superset of CSS that extends CSS syntax with numerous features, including rule nesting, variable definition, includes, and mathematical operations. Key functionalities can be explored in the [Official Getting Started Guide](https://sass-lang.com/guide). Sass originally used the .sass file extension with a YAML-like structure that wasn't fully compatible with traditional CSS. The current Sass format (.scss) maintains full CSS compatibility.

I use Sass for two primary reasons: First, for clearer CSS rule management. For example, when I have CSS rules that only apply to the website header, I can group them within a single block:

```scss
header {
    h1 { ... }
}
```

Second, to reduce CSS file size during page loading. Although my site uses Bootstrap, I only utilize a small portion of its features (grid system, navigation bar, and dropdowns). By selectively including components, unnecessary CSS isn't loaded. Additionally, I've customized Bootstrap's colors and shapes using `!important` overrides, which adds extra code.

In my .scss files, I define global control colors and font sizes while selectively including Bootstrap's .scss files. By commenting out unused features, the final CSS file size is significantly reduced. Sass also compiles CSS into a single minified file for server deployment.

Similarly, I use Webpack to eliminate unused Bootstrap JavaScript features and compress/merge JS code into a single file. Another advantage is that Sass and Webpack integrate with npm, allowing me to update frameworks like Bootstrap and use them consistently across Sass and Webpack JS files.

## Using Sass and Webpack in Hexo

Hexo, as a popular static site generator, has numerous plugins. I use [hexo-renderer-sass](https://github.com/knksmith57/hexo-renderer-sass) and [hexo-webpack](https://github.com/cowsay-blog/hexo-webpack):

```bash
npm install --save hexo-renderer-sass
npm install --save hexo-webpack
```

For Sass, since I need to include framework code installed via npm, I add the following to my theme's `_config.yml` to direct Sass to the node_modules folder:

```yaml
node_sass:
  includePaths:
    - 'node_modules'
  outputStyle: compressed
```

For Bootstrap, first install via npm:

```bash
npm install --save bootstrap
```

Then include in your styles.scss file:

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

For Webpack, since some JS modules depend on jQuery but lack proper Webpack loading instructions, create a `webpack.config.js` file in your theme directory (same level as `_config.yml`). Use Webpack's ProvidePlugin to inject jQuery:

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

This configuration uses `assets/script.js` as the entry point and outputs to `assets/script.bundle.js`.

To import Bootstrap's dropdown module (with jQuery and Popper.js dependencies) in `script.js`:

```js
import 'bootstrap/js/src/dropdown'
```

Other modules follow the same pattern.

Finally, update your theme's head section to load the generated files:

```html
<link rel="stylesheet" href="<%- url_for('assets/style.css') %>" />
<script src="<%- url_for('assets/script.bundle.js') %>"></script>
```

Run `hexo generate` to build.
```
