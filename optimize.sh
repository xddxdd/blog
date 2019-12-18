#!/bin/sh
for FILE in $(find source -name "*.gif" -or -name "*.jpg" -or -name "*.png" -type f); do
    if [ ! -f $FILE.webp ]; then
        echo Convert $FILE to $FILE.webp
        convert -quality 100 $FILE $FILE.webp
    fi
done
