'use strict';

const os = require('os');
const critical = require('critical');
const path = require('path');
const fs = require('hexo-fs');
const minimatch = require('minimatch');

function getCriticalOptions(html_file) {
    return {
        base: hexo.public_dir,
        src: path.join(hexo.public_dir, html_file),
        inline: true,
        minify: true,
        dimensions: [
            {
                height: 640,
                width: 360,
            },
            {
                height: 720,
                width: 1280,
            },
        ],
        ignore: [
            /flag-icon-([a-zA-Z\-]*)/
        ],
    };
}

function applyCriticalToFile(html_file, thread_id) {
    let dest_file = hexo.public_dir + '/' + html_file;
    let options = getCriticalOptions(html_file);

    if (!options.inline) {
        hexo.log.error('Critical CSS must be inlined');
        return;
    }

    return critical.generate(options)
        .then(({ css, html, unneeded }) => {
            fs.writeFileSync(dest_file, html);

            hexo.log.log(
                'Critical CSS: Thread',
                thread_id,
                'completed',
                html_file,
            );

            return;
        })
        .catch(function (error) {
            hexo.log.error(
                'Critical CSS: Thread',
                thread_id,
                'failed',
                html_file,
            );
            hexo.log.error(error);
        });
}

function multithread_split(array, parts) {
    let result = [];
    for (let i = parts; i > 0; i--) {
        result.push(array.splice(0, Math.ceil(array.length / i)));
    }
    return result;
}

function multithread_wait(queues, i, count, resolve) {
    if (i >= count) {
        resolve();
    } else {
        return queues[i].then(function () {
            multithread_wait(queues, i + 1, count, resolve);
        });
    }
}

function critical_css() {
    const threads = os.cpus().length * 2;

    if (!(/^(g|deploy)/.test(this.env.cmd))) {
        return;
    }

    let files = fs.listDirSync(hexo.public_dir);
    files = files.filter(function (file) {
        return hexo.config.skip_render.reduce(function (kept, filter) {
            return kept && !minimatch(file, filter);
        }, true);
    });
    files = files.filter(function (name) {
        const extname = path.extname(name) || path.basename(name) || name;
        const extension = extname[0] === '.' ? extname.slice(1) : extname;
        return extension === 'html' || extension === 'htm';
    });

    return new Promise(function (resolve, reject) {
        let queues = new Array(threads);
        let file_chunks = multithread_split(files, threads);
        for (let i = 0; i < threads; i++) {
            queues[i] = file_chunks[i].reduce(function (queue, html_file) {
                return queue.then(function () {
                    return applyCriticalToFile(html_file, i);
                });
            }, Promise.resolve());
        }

        return multithread_wait(queues, 0, threads, resolve);
    }).then(function (resolvedPromises) {
        hexo.log.log(
            'Finished including all critical css into the html files',
        );
        return resolvedPromises;
    });
}

// hexo.extend.filter.register('before_exit', critical_css, 10000);
