const { gopherEngine } = require('../lib/markdown')

const os = require('os')
var prettier = require('prettier')
var fs = require('hexo-fs')
var path = require('path')
const LANTIAN = require('../lib/lantian')

const { isDefaultLanguage, postFilter, injectLanguages } =
  require('../lib/i18n')(hexo)
const LANGUAGE_TAGS = require('../lib/language')

const crlf = '\r\n'
const gopherBefore = 'i'
const gopherBeforeLink = '1'
const gopherBeforeImage = 'I'
const gopherAfter = '\t\t{{server_addr}}\t{{server_port}}' + crlf
const gopherEOF = '.' + crlf

// https://github.com/benjojo/gophervista/blob/master/blog-gopher-bridge/main.go

function markdown_formatter(rel_path, md) {
  const markdownRegex = /([^!]?)(!?)\[([^\]]+)\]\(([^)]+)\)(.?)/g

  var rows = md.split('\n')
  for (var i = 0; i < rows.length; i++) {
    // Link regex can also match images
    if (rows[i].match(markdownRegex)) {
      var replace_at_beginning = false,
        replace_at_end = false

      var replace_fn = (match, prefix, img_marker, label, href, suffix) => {
        // Don't touch external links
        if (href.match('://')) {
          return match
        }

        if (prefix !== null) {
          replace_at_beginning = true
        }
        if (suffix !== null) {
          replace_at_end = true
        }

        if (!href.startsWith('/')) {
          href = path.join('/', rel_path, href)
        }

        return (
          (prefix ? prefix + gopherAfter : '') +
          (img_marker === '!' ? gopherBeforeImage : gopherBeforeLink) +
          label +
          '\t' +
          href +
          '\t{{server_addr}}\t{{server_port}}' +
          crlf +
          (suffix ? gopherBefore + suffix : '')
        )
      }

      rows[i] = rows[i].replaceAll(markdownRegex, replace_fn)
      rows[i] =
        (replace_at_beginning ? '' : gopherBefore) +
        rows[i] +
        (replace_at_end ? '' : gopherAfter)
    } else {
      rows[i] = gopherBefore + rows[i] + gopherAfter
    }
  }

  return rows.join('') + gopherEOF
}

var markdown_to_gopher = async (result, data) => {
  if (data.page.raw) {
    const file = gopherEngine.processSync(data.page.raw)
    var md = String(file)
    if (!md) return

    md = await prettier.format(md, {
      parser: 'markdown',
      printWidth: 70,
      tabWidth: 2,
      proseWrap: 'always',
      endOfLine: 'lf',
    })
    if (!md) return

    md = markdown_formatter(path.dirname(data.path), md)

    var target_path = data.path
    target_path = target_path.replace(/index\.html$/, 'gophermap')
    target_path = target_path.replace(/.html$/, '.gopher')

    await fs.writeFile(path.join(hexo.public_dir, target_path), md)
    hexo.log.info('[LT Gopher] Generated: ' + target_path)
  }
}

var gophermap_index_generator = injectLanguages((languages, locals) => {
  return languages.map(language => {
    var data = ''
    data += gopherBefore + '#' + gopherAfter
    data += gopherBefore + '# ' + hexo.config.title + gopherAfter
    data += gopherBefore + '#' + gopherAfter
    data += gopherBefore + gopherAfter

    data += gopherBefore + 'Languages:' + gopherAfter
    languages.map(lang => {
      data +=
        gopherBeforeLink +
        '- ' +
        (LANGUAGE_TAGS[lang] ? LANGUAGE_TAGS[lang][1] : lang) +
        (lang == language ? ' (*)' : '') +
        '\t' +
        (isDefaultLanguage(lang) ? '/' : '/' + lang + '/') +
        '\t{{server_addr}}\t{{server_port}}' +
        crlf
    })
    data += gopherBefore + gopherAfter

    data += gopherBefore + 'Posts:' + gopherAfter
    locals.posts
      .filter(postFilter(language))
      .sort('date', 'desc')
      .each(post => {
        data +=
          gopherBeforeLink +
          '- ' +
          LANTIAN.slice_width(post.title, 0, 56) +
          ' (' +
          new Date(post.date).toISOString().replace('T', ' ').substr(0, 19) +
          ')' +
          '\t/' +
          post.path.replace(/index\.html$/g, '') +
          '\t{{server_addr}}\t{{server_port}}' +
          crlf

        var summary = post.content.trim().replace(LANTIAN.EXCERPT_REGEX, '')
        data +=
          gopherBefore +
          '  ' +
          LANTIAN.slice_width(summary, 0, 68) +
          gopherAfter
        data +=
          gopherBefore +
          '  ' +
          LANTIAN.slice_width(summary, 68, 68) +
          gopherAfter
        data +=
          gopherBefore +
          '  ' +
          LANTIAN.slice_width(summary, 136, 68) +
          gopherAfter
        data += gopherBefore + gopherAfter
      })
    data += gopherEOF

    var path =
      (isDefaultLanguage(language) ? '/' : '/' + language + '/') + 'gophermap'
    hexo.log.info('[LT Gopher] Generated: ' + path)
    return {
      path: path,

      data: data,
    }
  })
})

// HACK: Don't generate gophermaps on client
if (!os.hostname().startsWith('lt-')) {
  hexo.extend.filter.register('after_render:html', markdown_to_gopher, 1)
  hexo.extend.generator.register(
    'gophermap_index_generator',
    gophermap_index_generator
  )
} else {
  hexo.log.info('[LT Gopher] Generation disabled on lt-* hosts')
}
