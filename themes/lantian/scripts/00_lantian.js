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
    async function (args, content) {
        return hexo.render.render({text: content, engine: 'markdown'}).then((rendered) => {
            return `<div id="lti-content-${args[0]}" class="lti-content">${rendered}</div>`;
        })
    },
    { ends: true, async: true },
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

        var s = `<div class="${class_name} btn-group" role="group" id="lti-g${i}" class="lt-interactive">`;

        content.split('\n').forEach((v) => {
            var splitted = v.split('|');
            var tag = splitted[0];
            var identifier = i + '-' + Math.floor(Math.random() * 10000000);
            var label = splitted.slice(1).join(' ');

            s += `
<input type="radio" name="lti-g${i}" id="lti-${identifier}" class="btn-check lti-option" autocomplete="off" data-lti-tag="${tag}"/>
<label class="btn btn-outline-primary" for="lti-${identifier}">${label}</label>
`;
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
