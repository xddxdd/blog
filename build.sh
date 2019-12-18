#!/bin/sh

RECENT_COMMENTS=$(wget -O- https://lantian.disqus.com/recent_comments_widget.js\?num_items\=10\&hide_mods\=0\&hide_avatars\=1\&excerpt_length\=100)

# Remove delimiters and fixed strings
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | sed "s/Lan Tian @ Blog//g;s/https:\/\/lantian.pub//g")
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | sed "s/ | //g;s/ - //g;s/&nbsp\;&middot\;&nbsp\;//g")

# NodeJS preprocessing
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | sed "s/document.write/process.stdout.write/g")
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | node)
echo ${RECENT_COMMENTS#*<\/style>} > themes/lantian/layout/_partial/disqus-recent.ejs

# Font Awesome update
cp node_modules/@fortawesome/fontawesome-free/webfonts/* themes/lantian/source/assets/fonts/

rm -rf public
hexo generate
hexo algolia

echo Convert image to WebP...
for FILE in $(find public -name "*.gif" -or -name "*.jpg" -or -name "*.png" -type f); do
    if [ ! -f $FILE.webp ]; then
        echo convert -quality 100 $FILE $FILE.webp >> webp_convert.lst
    fi
done
parallel -v -j$(nproc) < webp_convert.lst
rm webp_convert.lst

hexo deploy
