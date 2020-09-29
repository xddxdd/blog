'use strict';


const critical = require('critical');
const path = require('path');
const fs = require('hexo-fs');
const minimatch = require('minimatch');

function getCriticalOptions(html_file) {
    var perPageCss = true;

    if (perPageCss) {
        var fullyQualifiedFilename = path.join(hexo.public_dir, html_file);
        var base = path.dirname(fullyQualifiedFilename) + '/';

        return {
            base: base,
            src: fullyQualifiedFilename,
            inline: true,
            minify: true,
            ignore: ['@font-face']
        };
    } else {
        return {
            base: hexo.public_dir,
            src: html_file,
            inline: true,
            minify: true,
            ignore: ['@font-face']
        };
    }
}

function applyCriticalToFile(html_file) {
    var dest_file = hexo.public_dir + '/' + html_file;
    var options = getCriticalOptions(html_file);

    if (!options.inline) {
        hexo.log.error('Critical CSS must be inlined');
        return;
    }

    var criticalPromise = critical.generate(options);

    return criticalPromise.then(({css, html, unneeded}) => {
        fs.writeFileSync(dest_file, html);

        hexo.log.log('Generated critical CSS for', html_file);

        return;
    })
    .catch(function(error) {
        hexo.log.error('Unable to inline critical CSS for', html_file);
        hexo.log.error(error);
    });
}

function CriticalCssWorker() {
    return fs.exists(hexo.public_dir).then(function (exist) {
        if (!exist) {
            hexo.log.error('public directory does not exist');
            return;
        }

        var files = fs.listDirSync(hexo.public_dir);
        files = files.filter(function(file) {
            return hexo.config.skip_render.reduce(function(kept, filter) {
                return kept && !minimatch(file, filter);
            }, true);
        });
        files = files.filter(function(name) {
            const extname = path.extname(name) || path.basename(name) || name;
            const extension =  extname[0] === '.' ? extname.slice(1) : extname;
            return extension === 'html' || extension === 'htm';
        });

        return new Promise(function(resolve, reject) {
            var initialPromiseQueue = Promise.resolve();

            htmlFiles.reduce(function(promiseQueue, html_file) {
                return promiseQueue.then(function() {
                    return applyCriticalToFile(html_file);
                });
            }, initialPromiseQueue).then(function() {
                resolve();
            });
        }).then(function(resolvedPromises) {
            hexo.log.log('Finished including all critical css into the html files');
            return resolvedPromises;
        });
    });
}

hexo.extend.filter.register(
    'before_exit',
    CriticalCssWorker,
    10000
);
