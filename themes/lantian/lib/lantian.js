const isFullwidthCodePoint = require('is-fullwidth-code-point');

function slice_width(str, start, length) {
    var idx_first = 0;
    while (true) {
        var w = isFullwidthCodePoint(str.codePointAt(idx_first)) ? 2 : 1;
        if (start < w) break;
        idx_first++;
        start -= w;
    }

    var idx_last = idx_first;
    while (true) {
        var w = isFullwidthCodePoint(str.codePointAt(idx_last)) ? 2 : 1;
        if (length < w) break;
        idx_last++;
        length -= w;
    }
    return str.slice(idx_first, idx_last);
}

module.exports = {
    EXCERPT_REGEX: /([\n\r]|<\/?("[^"]*"|'[^']*'|[^>])*(>|$))/g,
    slice_width: slice_width,
};
