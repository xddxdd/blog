'use strict';

const { markdownEngine } = require('../lib/markdown');

async function renderer(data) {
  return markdownEngine.process(data.text).then((result) => {
    return result.toString();
  });
}

hexo.extend.renderer.register('md', 'html', renderer, false);
hexo.extend.renderer.register('markdown', 'html', renderer, false);
hexo.extend.renderer.register('mkd', 'html', renderer, false);
hexo.extend.renderer.register('mkdn', 'html', renderer, false);
hexo.extend.renderer.register('mdwn', 'html', renderer, false);
hexo.extend.renderer.register('mdtxt', 'html', renderer, false);
hexo.extend.renderer.register('mdtext', 'html', renderer, false);
