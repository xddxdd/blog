'use strict';

const renderer = require('../lib/markdown');

hexo.extend.renderer.register('md', 'html', renderer, false);
hexo.extend.renderer.register('markdown', 'html', renderer, false);
hexo.extend.renderer.register('mkd', 'html', renderer, false);
hexo.extend.renderer.register('mkdn', 'html', renderer, false);
hexo.extend.renderer.register('mdwn', 'html', renderer, false);
hexo.extend.renderer.register('mdtxt', 'html', renderer, false);
hexo.extend.renderer.register('mdtext', 'html', renderer, false);
