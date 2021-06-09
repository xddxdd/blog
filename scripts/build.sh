#!/bin/bash

cd "$(dirname "$0")/.." || exit 1

# Cache folder
CACHEDIR=/tmp/hexo-blog
mkdir -p $CACHEDIR

RECENT_COMMENTS=$(wget -O- "https://lantian.disqus.com/recent_comments_widget.js?num_items=10&hide_mods=0&hide_avatars=1&excerpt_length=100")
# NodeJS preprocessing
RECENT_COMMENTS=${RECENT_COMMENTS//document.write/process.stdout.write}
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | node)
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | python3 scripts/disqus_comments.py)
echo "$RECENT_COMMENTS" > themes/lantian/layout/_partial/disqus-recent.ejs

# Regenerate everything
rm -rf public .deploy_git
node_modules/hexo/bin/hexo clean
node_modules/hexo/bin/hexo generate

# Verify generated javascript
node_modules/acorn/bin/acorn --ecma2020 --silent public/assets/script.main.bundle.js || exit 1

# Do not deploy if not on master branch
if [ "${GIT_BRANCH}" != "origin/master" ]; then
    exit 0
fi

# Hexo deploy takes care of git, and baidu_url_submit
node_modules/hexo/bin/hexo deploy

# Compress to gzip, brotli, zstd and webp only for my own site system
# Useless on other hosts, e.g. GitHub Pages
echo Preparing parallel jobs...
echo > parallel_jobs.lst

find public -type f \( -name "*.html" -or -name "*.css" -or -name "*.js" -or -name "*.ttf" -or -name "*.atom" -or -name "*.stl" -or -name "*.xml" -or -name "*.svg" -or -name "*.eot" -or -name "*.json" -or -name "*.txt" \) |
while IFS= read -r FILE; do
    if [ ! -f "$FILE.gz" ]; then
        echo "gzip -9 -k -f \"$FILE\"" >> parallel_jobs.lst
    fi
    if [ ! -f "$FILE.br" ]; then
        echo "brotli -9 -k -f \"$FILE\"" >> parallel_jobs.lst
    fi
    if [ ! -f "$FILE.zst" ]; then
        echo "sh -c \"zstd --no-progress -19 -k -f \"$FILE\" 2>/dev/null\"" >> parallel_jobs.lst
    fi
done

find public -type f \( -name "*.gif" -or -name "*.jpg" -or -name "*.png" \) |
while IFS= read -r FILE; do
    if [ ! -f "$FILE.webp" ]; then
        SHA256=$(sha256sum "$FILE" | cut -d' ' -f1)
        if [ -f "$CACHEDIR/$SHA256.webp" ]; then
            cp "$CACHEDIR/$SHA256.webp" "$FILE.webp"
        else
            echo "sh -c \"convert -quality 100 $FILE $FILE.webp && cp $FILE.webp $CACHEDIR/$SHA256.webp\"" >> parallel_jobs.lst
        fi
    fi
done

echo Executing parallel jobs...
parallel "-j$(nproc)" < parallel_jobs.lst

# Deploy to my site system
ansible-playbook scripts/ansible_deploy.yml
