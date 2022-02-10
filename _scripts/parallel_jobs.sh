#!/bin/sh

cd "$(dirname "$0")/.." || exit 1

CACHEDIR=$(pwd)/img_cache
mkdir -p $CACHEDIR

# Compress to gzip, brotli, zstd and webp only for my own site system
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
    if [ ! -f "$FILE.avif" ]; then
        SHA256=$(sha256sum "$FILE" | cut -d' ' -f1)
        if [ -f "$CACHEDIR/$SHA256.avif" ]; then
            cp "$CACHEDIR/$SHA256.avif" "$FILE.avif"
        else
            echo "sh -c \"convert -quality 100 $FILE $FILE.avif && cp $FILE.avif $CACHEDIR/$SHA256.avif\"" >> parallel_jobs.lst
        fi
    fi
done

echo Executing parallel jobs...
parallel "-j$(nproc)" < parallel_jobs.lst

exit 0
