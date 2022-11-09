'use strict'

const { markdownEngine } = require('../lib/markdown')

const rSwigPlaceHolder =
  /(?:<|&lt;|&#x3c;)!--swig\uFFFC(\d+)--(?:>|&gt;|&#x3e;)/gi
const rCodeBlockPlaceHolder =
  /(?:<|&lt;|&#x3c;)!--code\uFFFC(\d+)--(?:>|&gt;|&#x3e;)/gi

async function renderer(data) {
  return markdownEngine.process(data.text).then(result => {
    return (
      result
        .toString()
        // Fix swig match failure
        .replace(rSwigPlaceHolder, '<!--swig\uFFFC$1-->')
        .replace(rCodeBlockPlaceHolder, '<!--code\uFFFC$1-->')
    )
  })
}

hexo.extend.renderer.register('md', 'html', renderer, false)
hexo.extend.renderer.register('markdown', 'html', renderer, false)
hexo.extend.renderer.register('mkd', 'html', renderer, false)
hexo.extend.renderer.register('mkdn', 'html', renderer, false)
hexo.extend.renderer.register('mdwn', 'html', renderer, false)
hexo.extend.renderer.register('mdtxt', 'html', renderer, false)
hexo.extend.renderer.register('mdtext', 'html', renderer, false)
