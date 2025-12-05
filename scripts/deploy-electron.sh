#!/bin/bash

# Electron Deployment Script
# Usage: ./scripts/deploy-electron.sh <version>
# Example: ./scripts/deploy-electron.sh 0.1.1

set -e  # Exit on error

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "❌ Error: Version is required"
  echo ""
  echo "Usage: ./scripts/deploy-electron.sh <version>"
  echo "Example: ./scripts/deploy-electron.sh 0.1.1"
  exit 1
fi

# Validate version format (basic check)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Error: Invalid version format. Use semantic versioning (e.g., 0.1.1)"
  exit 1
fi

echo "🚀 Deploying Electron app v${VERSION}..."
echo ""

# 1. Update version in package.json
echo "📝 Step 1: Updating version in app/package.json..."
cd app
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "   Current version: ${CURRENT_VERSION}"
echo "   New version: ${VERSION}"

# Update version using npm version (but don't create git tag)
npm version ${VERSION} --no-git-tag-version --allow-same-version 2>/dev/null || {
  # If npm version fails, manually update package.json
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.version = '${VERSION}';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
}
echo "   ✅ Version updated"
cd ..

# 2. Build for all platforms
echo ""
echo "📦 Step 2: Building Electron app for all platforms..."
echo "   This may take several minutes..."
cd app

# Clean previous builds
if [ -d "dist-electron" ]; then
  echo "   Cleaning previous builds..."
  rm -rf dist-electron
fi

# Build
npm run electron:build:all

cd ..

# 3. List build files
echo ""
echo "✅ Step 3: Build complete!"
echo ""
echo "📦 Build files in app/dist-electron/:"
ls -lh app/dist-electron/*.{dmg,zip,exe,AppImage,deb} 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

# Count files
FILE_COUNT=$(ls -1 app/dist-electron/*.{dmg,zip,exe,AppImage,deb} 2>/dev/null | wc -l | tr -d ' ')
echo ""
echo "   Total files: ${FILE_COUNT}"

# 4. Instructions
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. ✅ Test the builds locally:"
echo "   - macOS: open app/dist-electron/ghost-${VERSION}-arm64.dmg"
echo "   - Windows: Run app/dist-electron/ghost Setup ${VERSION}.exe"
echo "   - Linux: chmod +x app/dist-electron/ghost-${VERSION}.AppImage && ./app/dist-electron/ghost-${VERSION}.AppImage"
echo ""
echo "2. 📤 Create GitHub Release:"
echo "   - Go to: https://github.com/vince13/ghost-download/releases/new"
echo "   - Tag: v${VERSION}"
echo "   - Title: Ghost Protocol v${VERSION}"
echo "   - Upload all files from app/dist-electron/"
echo ""
echo "3. 🔗 Update download links:"
echo "   - Edit: landing/app/page.tsx"
echo "   - Replace: v0.1.0 → v${VERSION}"
echo "   - Search for: 'releases/download/v0.1.0'"
echo "   - Replace with: 'releases/download/v${VERSION}'"
echo ""
echo "4. 🚀 Deploy website:"
echo "   - Run: vercel --prod"
echo "   - Or push to main branch (if auto-deploy enabled)"
echo ""
echo "✨ Done! Your Electron app v${VERSION} is ready for release."

