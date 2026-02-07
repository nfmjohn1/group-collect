#!/bin/bash
# Create simple SVG icons and convert to PNG

# Create icons directory if it doesn't exist
mkdir -p extension/public/icons

# Create a simple SVG icon (blue circle with "GC" text)
cat > /tmp/icon.svg << 'SVGEOF'
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#667eea"/>
  <text x="64" y="80" font-family="Arial" font-size="48" font-weight="bold" fill="white" text-anchor="middle">GC</text>
</svg>
SVGEOF

echo "Simple icon SVG created. To convert to PNG, you need:"
echo "1. Install ImageMagick: brew install imagemagick"
echo "2. Or use online converter at: https://cloudconvert.com/svg-to-png"
echo ""
echo "For now, creating placeholder PNG files..."

# Create simple placeholder PNGs (just copy a tiny valid PNG)
# This is a 1x1 pixel blue PNG in base64
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > extension/public/icons/icon16.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > extension/public/icons/icon48.png
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > extension/public/icons/icon128.png

echo "✅ Placeholder icons created!"
echo "The extension icon will show as a small blue square."
echo ""
echo "To use better icons later, replace the files in extension/public/icons/"
