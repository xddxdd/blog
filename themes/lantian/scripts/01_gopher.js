var unified = require('unified');
var remark_parse = require('remark-parse');
var remark_stringify = require('remark-stringify');
var remark_gfm = require('remark-gfm');
var remark_frontmatter = require('remark-frontmatter');
var remark_reference_links = require('remark-reference-links');
var prettier = require('prettier');
var fs = require('hexo-fs');
var path = require('path');
const LANTIAN = require('../lib/lantian');

const {
    pathJoin,
    isDefaultLanguage,
    url_for,
    postFilter,
    injectLanguages,
    getUsedLanguages,
    getDisplayLanguages,
    getPageLanguage,
} = require('../lib/i18n')(hexo);
const LANGUAGE_TAGS = require('../lib/language');

const crlf = '\r\n';
const gopherBefore = 'i';
const gopherBeforeLink = '1';
const gopherAfter = '\tinvalid.host\t0' + crlf;
const gopherEOF = '.' + crlf;

var markdown_to_gopher = (result, data) => {
    if (data.page.raw) {
        unified()
            .use(remark_parse)
            .use(remark_frontmatter)
            .use(remark_gfm)
            .use(remark_reference_links)
            .use(remark_stringify, {
                bullet: '-',
                fences: true,
                listItemIndent: 'one',
            })
            .process(data.page.raw)
            .then((file) => {
                var md = String(file);
                if (!md) return;

                md = prettier.format(md, {
                    parser: 'markdown',
                    printWidth: 70,
                    tabWidth: 2,
                    proseWrap: 'always',
                    endOfLine: 'lf',
                });
                if (!md) return;

                md =
                    gopherBefore +
                    md.split('\n').join(gopherAfter + gopherBefore) +
                    gopherAfter + gopherEOF;

                var target_path = data.path;
                target_path = target_path.replace(/index\.html$/, 'gophermap');
                target_path = target_path.replace(/.html$/, '.gopher');

                var promise = fs.writeFile(
                    path.join(hexo.public_dir, target_path),
                    md,
                );

                hexo.log.info('[LT Gopher] Generated: ' + target_path);
                return promise;
            });
    }
    return result;
};

var gophermap_index_generator = injectLanguages((languages, locals) => {
    return languages.map((language) => {
        var data = '';
        data += gopherBefore + '#' + gopherAfter;
        data += gopherBefore + '# ' + hexo.config.title + gopherAfter;
        data += gopherBefore + '#' + gopherAfter;
        data += gopherBefore + gopherAfter;

        data += gopherBefore + 'Languages:' + gopherAfter;
        languages.map((lang) => {
            data +=
                gopherBeforeLink +
                '- ' +
                (LANGUAGE_TAGS[lang] ? LANGUAGE_TAGS[lang][1] : lang) +
                (lang == language ? ' (*)' : '') +
                '\t' +
                (isDefaultLanguage(lang) ? '/' : '/' + lang + '/') +
                '\t70' +
                crlf;
        });
        data += gopherBefore + gopherAfter;

        data += gopherBefore + 'Posts:' + gopherAfter;
        locals.posts
            .filter(postFilter(language))
            .sort('date', 'desc')
            .each((post) => {
                data +=
                    gopherBeforeLink +
                    '- ' +
                    post.title.substr(0, 56) +
                    ' (' +
                    new Date(post.date)
                        .toISOString()
                        .replace('T', ' ')
                        .substr(0, 19) +
                    ')' +
                    '\t/' +
                    post.path.replace(/index\.html$/g, '') +
                    '\t70' +
                    crlf;

                var summary = post.content
                    .trim()
                    .replace(LANTIAN.EXCERPT_REGEX, '');
                data +=
                    gopherBefore +
                    '  ' +
                    LANTIAN.slice_width(summary, 0, 68) +
                    gopherAfter;
                data +=
                    gopherBefore +
                    '  ' +
                    LANTIAN.slice_width(summary, 68, 68) +
                    gopherAfter;
                data += gopherBefore + gopherAfter;
            });
        data += gopherEOF;

        var path =
            (isDefaultLanguage(language) ? '/' : '/' + language + '/') +
            'gophermap';
        hexo.log.info('[LT Gopher] Generated: ' + path);
        return {
            path: path,

            data: data,
        };
    });
});

hexo.extend.filter.register('after_render:html', markdown_to_gopher, 1);
hexo.extend.generator.register(
    'gophermap_index_generator',
    gophermap_index_generator,
);
