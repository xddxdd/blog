#!/usr/bin/env bash

cd "$(dirname "$0")/.." || exit 1

# Compress to gzip, brotli, zstd and webp only for my own site system
echo Preparing parallel jobs...
echo >.parallel_jobs.lst

find public/usr -type f \( -name "*.gif" -or -name "*.jpg" -or -name "*.png" \) |
    while IFS= read -r FILE; do
        (echo "$FILE" | grep -q ".thumb.png") && continue
        if [ ! -f "$FILE.thumb.png" ]; then
            echo "magick convert -quality 100 -resize x150 +repage $FILE\[0\] $FILE.thumb.png && optipng -o7 $FILE.thumb.png" >>.parallel_jobs.lst
        fi
    done

echo Executing parallel jobs...
parallel "-j$(nproc)" <.parallel_jobs.lst
# rm -f .parallel_jobs.lst

exit 0
