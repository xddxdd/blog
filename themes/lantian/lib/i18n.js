const util = require('hexo-util')
const Pattern = util.Pattern

module.exports = function (hexo) {
  function pathJoin(...paths) {
    return paths.join('/')
  }

  function getUsedLanguages() {
    return hexo.theme.i18n.list()
  }

  function getDisplayLanguages() {
    let languages = hexo.config.language
    if (!languages) {
      return ['default']
    }
    languages = [].concat(hexo.config.language)
    if (!Array.isArray(languages)) {
      languages = [languages]
    }
    if (languages.indexOf('default') > -1) {
      languages.splice(languages.indexOf('default'), 1)
    }
    return languages
  }

  function injectLanguages(func) {
    return function (locals) {
      return func.call(this, getDisplayLanguages(), locals)
    }
  }

  function getPageLanguage(post) {
    const languages = getUsedLanguages()
    let lang = post.lang || post.language
    if (!lang && post.source) {
      const path = post.source.startsWith('_posts/')
        ? post.source.slice('_posts/'.length)
        : post.source
      const pattern = new Pattern(`${hexo.config.i18n_dir}/*path`)
      const data = pattern.match(path)

      if (data && data.lang && ~languages.indexOf(data.lang)) {
        lang = data.lang
      }
    }
    return lang
  }

  function isDefaultLanguage(language) {
    return !language || getDisplayLanguages().indexOf(language) === 0
  }

  function postFilter(language) {
    return function (post) {
      let lang = getPageLanguage(post)
      return (
        (lang === language || (isDefaultLanguage(language) && !lang)) &&
        post.indexing !== false
      )
    }
  }

  function url_for(path) {
    return hexo.extend.helper.get('url_for').call(hexo, path)
  }

  return {
    pathJoin,
    isDefaultLanguage,
    url_for,
    postFilter,
    injectLanguages,
    getUsedLanguages,
    getDisplayLanguages,
    getPageLanguage,
  }
}
