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

echo Preparing parallel jobs...
for FILE in $(find public -type f \( -name "*.html" -or -name "*.css" -or -name "*.js" -or -name "*.ttf" -or -name "*.atom" -or -name "*.stl" -or -name "*.xml" -or -name "*.svg" -or -name "*.eot" -or -name "*.json" -or -name "*.txt" \)); do
    if [ ! -f $FILE.gz ]; then
        echo gzip -9 -k -f $FILE >> parallel_jobs.lst
    fi
    if [ ! -f $FILE.br ]; then
        echo brotli -9 -k -f $FILE >> parallel_jobs.lst
    fi
    if [ ! -f $FILE.zst ]; then
        echo "sh -c \"zstd --no-progress -19 -k -f $FILE 2>/dev/null\"" >> parallel_jobs.lst
    fi
done
for FILE in $(find public -type f \( -name "*.gif" -or -name "*.jpg" -or -name "*.png" \)); do
    if [ ! -f $FILE.webp ]; then
        echo convert -quality 100 $FILE $FILE.webp >> parallel_jobs.lst
    fi
done
parallel -j$(nproc) < parallel_jobs.lst
rm parallel_jobs.lst

hexo deploy
ansible website -m synchronize -a "src=public/ dest=/srv/www/lantian.pub/"

hexo algolia
