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
    var excerpt_length = length ? length : 400;
    var stripped = input.replace(LANTIAN.EXCERPT_REGEX, '');
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

hexo.extend.tag.register(
    'twine',
    function (args, content) {
        return `<div class="twine-container"><iframe id="twine" src="${args[0]}" scrolling="no"></iframe></div>`;
    },
);
