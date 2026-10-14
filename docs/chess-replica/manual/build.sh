#!/bin/sh
# Regenerates user-guide.html from user-guide.md. Needs pandoc.
set -e
cd "$(dirname "$0")"
pandoc user-guide.md \
  --from markdown+gfm_auto_identifiers \
  --to html5 \
  --template template.html \
  --toc --toc-depth=1 \
  --metadata description="How to use every part of the chess app. Each chapter opens with one feature written out in full; the rest are listed as to come." \
  --output user-guide.html
echo "wrote $(pwd)/user-guide.html"
