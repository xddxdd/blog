const LANTIAN = require('../lib/lantian');

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

hexo.extend.helper.register('lantian_excerpt', function (input, length) {
    var excerpt_length = length ? length : 800;
    var stripped = input.replace(LANTIAN.EXCERPT_REGEX, '');
    var separators = ['。', '，', '.', ',', '：', ':', ')', '）'];

    var output = "";
    var len = 0, i = 0;
    while (len < excerpt_length && i < stripped.length) {
        output += stripped[i];
        len += (stripped[i].codePointAt() > 255) ? 2 : 1;
        i++;
    }

    var output_until = output.length;
    for (i = output.length; i > 0; i--) {
        if (separators.includes(output[i])) {
            output_until = i + 1;
            break;
        }
    }
    return output.substr(0, output_until) + '...';
});

hexo.extend.helper.register('lantian_git_rev', function () {
    return gitRevision;
});

hexo.extend.tag.register(
    'interactive',
    function (args, content) {
        var rendered = hexo.render.renderSync({text: content, engine: 'markdown'})
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

hexo.extend.tag.register(
    'twine',
    function (args, content) {
        return `<div class="twine-container"><iframe id="twine" src="${args[0]}" scrolling="no"></iframe></div>`;
    },
);
