#!/usr/bin/env bash
# Copy only the public website files into _site/ (an allow-list).
# Tests, docs and tooling are never published. Only the processed
# website images in assets/img/ are copied; original photos stay out of the repo.
set -euo pipefail

OUT="${1:-_site}"
rm -rf "$OUT"
mkdir -p "$OUT/assets/img"

cp index.html 404.html favicon.ico robots.txt sitemap.xml google6d4f5882eb4c2603.html "$OUT/" # last file: Google Search Console ownership proof
cp -R assets/css assets/js assets/fonts "$OUT/assets/"
cp assets/img/*.svg assets/img/*.png assets/img/*.webp assets/img/*.jpg assets/img/*.txt "$OUT/assets/img/"
touch "$OUT/.nojekyll" # serve files as-is, skip GitHub's Jekyll processing

echo "Built $OUT:"
find "$OUT" -type f | sort | sed 's/^/  /'
du -sh "$OUT"
