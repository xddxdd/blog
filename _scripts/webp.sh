#!/usr/bin/env bash

cd "$(dirname "$0")/.." || exit 1

CACHEDIR=$(pwd)/img_cache
mkdir -p "$CACHEDIR"

# Compress to webp and avif only for my own site system
echo Preparing parallel jobs...
echo >.parallel_jobs.lst

find dist -type f \( -name "*.gif" -or -name "*.jpg" -or -name "*.png" \) |
    while IFS= read -r FILE; do
        for FORMAT in webp avif jxl; do
            if [ ! -f "$FILE.$FORMAT" ]; then
                SHA256=$(sha256sum "$FILE" | cut -d' ' -f1)
                if [ -f "$CACHEDIR/$SHA256.$FORMAT" ]; then
                    cp "$CACHEDIR/$SHA256.$FORMAT" "$FILE.$FORMAT"
                else
                    echo "magick convert -quality 100 $FILE $FILE.$FORMAT && cp $FILE.$FORMAT $CACHEDIR/$SHA256.$FORMAT" >>.parallel_jobs.lst
                fi
            fi
        done
    done

echo Executing parallel jobs...
parallel "-j$(nproc)" <.parallel_jobs.lst
rm -f .parallel_jobs.lst

exit 0
