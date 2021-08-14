#!/bin/bash

cd "$(dirname "$0")/.." || exit 1

RECENT_COMMENTS=$(wget -O- "https://lantian.disqus.com/recent_comments_widget.js?num_items=10&hide_mods=0&hide_avatars=1&excerpt_length=100")
# NodeJS preprocessing
RECENT_COMMENTS=${RECENT_COMMENTS//document.write/process.stdout.write}
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | node)
RECENT_COMMENTS=$(echo "$RECENT_COMMENTS" | python3 _scripts/disqus_comments.py)
echo "$RECENT_COMMENTS" > themes/lantian/layout/_partial/disqus-recent.ejs
