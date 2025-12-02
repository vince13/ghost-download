#!/bin/bash

# Script to copy Electron build files to landing/public/downloads/
# Usage: ./scripts/copy-downloads.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$PROJECT_ROOT/app"
LANDING_DOWNLOADS="$PROJECT_ROOT/landing/public/downloads"
DIST_ELECTRON="$APP_DIR/dist-electron"

echo "📦 Copying Electron build files to landing/public/downloads/..."

# Check if dist-electron exists
if [ ! -d "$DIST_ELECTRON" ]; then
  echo "❌ Error: $DIST_ELECTRON does not exist"
  echo "   Please build the Electron app first:"
  echo "   cd app && npm run electron:build"
  exit 1
fi

# Create downloads directory if it doesn't exist
mkdir -p "$LANDING_DOWNLOADS"

# Copy all build files
echo "📋 Copying files from $DIST_ELECTRON to $LANDING_DOWNLOADS..."

# Copy macOS files
if ls "$DIST_ELECTRON"/*.dmg 1> /dev/null 2>&1; then
  cp "$DIST_ELECTRON"/*.dmg "$LANDING_DOWNLOADS/" 2>/dev/null || true
  echo "✅ Copied macOS DMG files"
fi

if ls "$DIST_ELECTRON"/*mac.zip 1> /dev/null 2>&1; then
  cp "$DIST_ELECTRON"/*mac.zip "$LANDING_DOWNLOADS/" 2>/dev/null || true
  echo "✅ Copied macOS ZIP files"
fi

# Copy Windows files
if ls "$DIST_ELECTRON"/*.exe 1> /dev/null 2>&1; then
  cp "$DIST_ELECTRON"/*.exe "$LANDING_DOWNLOADS/" 2>/dev/null || true
  echo "✅ Copied Windows EXE files"
fi

# Copy Linux files
if ls "$DIST_ELECTRON"/*.AppImage 1> /dev/null 2>&1; then
  cp "$DIST_ELECTRON"/*.AppImage "$LANDING_DOWNLOADS/" 2>/dev/null || true
  echo "✅ Copied Linux AppImage files"
fi

if ls "$DIST_ELECTRON"/*.deb 1> /dev/null 2>&1; then
  cp "$DIST_ELECTRON"/*.deb "$LANDING_DOWNLOADS/" 2>/dev/null || true
  echo "✅ Copied Linux DEB files"
fi

# List copied files
echo ""
echo "📁 Files in $LANDING_DOWNLOADS:"
ls -lh "$LANDING_DOWNLOADS" | tail -n +2 || echo "   (no files found)"

echo ""
echo "✅ Done! Files are ready for Vercel deployment."
echo ""
echo "💡 Next steps:"
echo "   1. Commit the files: git add landing/public/downloads/"
echo "   2. Deploy to Vercel: vercel --prod"
echo "   3. Files will be available at: https://your-domain.com/downloads/[filename]"

