const execSync = require('child_process').execSync;
const gitRevision = execSync('git log -1 --format=%h').toString().trim();

hexo.extend.helper.register('remove_trailing_slash', function (s) {
    if (s[s.length - 1] == '/') {
        return s.substring(0, s.length - 1);
    } else if (s.substring(s.length - 11) == '/index.html') {
        return s.substring(0, s.length - 11);
    } else {
        return s;
    }
});

hexo.extend.helper.register('lantian_excerpt', function (input) {
    var excerpt_length = 400;
    var stripped = input.replace(/<\/?("[^"]*"|'[^']*'|[^>])*(>|$)/g, '');
    var separators = ['。', '，', '.', ',', '：', ':', ')', '）'];
    var output_until = excerpt_length;
    for (var i = excerpt_length; i > 0; i--) {
        if (separators.includes(stripped[i])) {
            output_until = i + 1;
            break;
        }
    }
    return stripped.substr(0, output_until) + '...';
});

hexo.extend.helper.register('lantian_git_rev', function () {
    return gitRevision;
});

function markdown_render(content) {
    const MdIt = require('markdown-it');
    const {
        preset,
        render,
        enable_rules,
        disable_rules,
        plugins,
    } = hexo.config.markdown;
    let parser = new MdIt(preset, render);

    if (enable_rules) {
        parser.enable(enable_rules);
    }

    if (disable_rules) {
        parser.disable(disable_rules);
    }

    if (plugins) {
        parser = plugins.reduce((parser, pugs) => {
            if (pugs instanceof Object && pugs.name) {
                return parser.use(require(pugs.name), pugs.options);
            }
            return parser.use(require(pugs));
        }, parser);
    }

    hexo.execFilterSync('markdown-it:renderer', parser, { context: hexo });

    return parser.render(content);
}

hexo.extend.tag.register(
    'interactive',
    function (args, content) {
        var rendered = markdown_render(content);
        return `<div id="lt-interactive-content-${args[0]}" class="lt-interactive-content">${rendered}</div>`;
    },
    { ends: true },
);

hexo.extend.tag.register(
    'interactive_buttons',
    function (args, content) {
        var i = Math.floor(Math.random() * 10000000);

        var class_name = 'btn-group';
        if (args.indexOf('vertical') != -1) {
            class_name = 'btn-group-vertical';
        }

        if (args.indexOf('lg') != -1) {
            class_name += ' btn-group-lg';
        } else if (args.indexOf('sm') != -1) {
            class_name += ' btn-group-sm';
        }

        var s = `<div class="${class_name} btn-group-toggle" data-toggle="buttons" id="lt-interactive-group-${i}" class="lt-interactive">`;

        content.split('\n').forEach((v) => {
            var splitted = v.split(' ');
            var tag = splitted[0];
            var label = splitted.slice(1).join(' ');

            s += `
<label class="btn btn-outline-primary">
    <input type="radio" name="lt-interactive-group-${i}" id="lt-interactive-${tag}" class="lt-interactive-option" data-group="${i}" data-tag="${tag}">${label}</input>
</label>`;
        });

        s += `</div>`;

        return s;
    },
    { ends: true },
);
