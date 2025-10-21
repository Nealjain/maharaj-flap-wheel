#!/bin/bash
# Create PNG icons from SVGs
# Requires: ImageMagick (brew install imagemagick)

cd public/icons

for svg in *.svg; do
  png="${svg%.svg}.png"
  echo "Converting $svg to $png..."
  
  # Check if ImageMagick is installed
  if command -v convert &> /dev/null; then
    convert -background none "$svg" "$png"
  else
    echo "⚠️  ImageMagick not installed. Install with: brew install imagemagick"
    echo "Or convert SVGs to PNGs manually at: https://cloudconvert.com/svg-to-png"
    exit 1
  fi
done

echo "✅ All icons converted to PNG!"
