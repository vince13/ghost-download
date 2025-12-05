#!/bin/bash

# Script to remove quarantine attribute from Electron build files
# Usage: ./scripts/remove-quarantine.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="$PROJECT_ROOT/app"
DIST_ELECTRON="$APP_DIR/dist-electron"
DIST="$APP_DIR/dist"

echo "🔓 Removing quarantine attributes from Electron build files..."

# Check which directory exists
if [ -d "$DIST_ELECTRON" ]; then
  BUILD_DIR="$DIST_ELECTRON"
elif [ -d "$DIST" ]; then
  BUILD_DIR="$DIST"
else
  echo "❌ Error: No build directory found"
  echo "   Please build the Electron app first:"
  echo "   cd app && npm run electron:build:mac"
  exit 1
fi

# Remove quarantine from DMG files
if ls "$BUILD_DIR"/*.dmg 1> /dev/null 2>&1; then
  for dmg in "$BUILD_DIR"/*.dmg; do
    echo "  Removing quarantine from: $(basename "$dmg")"
    xattr -cr "$dmg" 2>/dev/null || xattr -d com.apple.quarantine "$dmg" 2>/dev/null || true
  done
  echo "✅ Removed quarantine from DMG files"
fi

# Remove quarantine from ZIP files
if ls "$BUILD_DIR"/*mac.zip 1> /dev/null 2>&1; then
  for zip in "$BUILD_DIR"/*mac.zip; do
    echo "  Removing quarantine from: $(basename "$zip")"
    xattr -cr "$zip" 2>/dev/null || xattr -d com.apple.quarantine "$zip" 2>/dev/null || true
  done
  echo "✅ Removed quarantine from ZIP files"
fi

# Remove quarantine from .app bundles if they exist
if [ -d "$BUILD_DIR/mac-arm64" ]; then
  find "$BUILD_DIR/mac-arm64" -name "*.app" -exec xattr -cr {} \; 2>/dev/null || true
  echo "✅ Removed quarantine from .app bundles"
fi

echo ""
echo "✅ Done! Build files are now free of quarantine attributes."
echo "   Users can now open the DMG without the 'damaged' warning."

