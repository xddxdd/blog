#!/usr/bin/env bash
[ -s "public/index.html" ] || exit 1
[ -s "public/assets/script.main.bundle.js" ] || exit 1
node_modules/acorn/bin/acorn --ecma2020 --silent public/assets/script.main.bundle.js || exit 1
exit 0
