#!/bin/sh

cd "$(dirname "$0")/.." || exit 1

CACHEDIR=$(pwd)/img_cache
mkdir -p $CACHEDIR

# Compress to webp and avif only for my own site system
echo Preparing parallel jobs...
echo >.parallel_jobs.lst

find public -type f \( -name "*.gif" -or -name "*.jpg" -or -name "*.png" \) |
    while IFS= read -r FILE; do
        if [ ! -f "$FILE.webp" ]; then
            SHA256=$(sha256sum "$FILE" | cut -d' ' -f1)
            if [ -f "$CACHEDIR/$SHA256.webp" ]; then
                cp "$CACHEDIR/$SHA256.webp" "$FILE.webp"
            else
                echo "convert -quality 100 $FILE $FILE.webp && cp $FILE.webp $CACHEDIR/$SHA256.webp" >>.parallel_jobs.lst
            fi
        fi
        if [ ! -f "$FILE.avif" ]; then
            SHA256=$(sha256sum "$FILE" | cut -d' ' -f1)
            if [ -f "$CACHEDIR/$SHA256.avif" ]; then
                cp "$CACHEDIR/$SHA256.avif" "$FILE.avif"
            else
                echo "convert -quality 100 $FILE $FILE.avif && cp $FILE.avif $CACHEDIR/$SHA256.avif" >>.parallel_jobs.lst
            fi
        fi
    done

echo Executing parallel jobs...
parallel "-j$(nproc)" <.parallel_jobs.lst
rm -f .parallel_jobs.lst

exit 0
