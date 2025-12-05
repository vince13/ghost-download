# Electron Deployment Workflow

This guide ensures that the Electron app available for download on the website is always the latest working version with all fixes.

## Overview

The deployment process involves:
1. **Building** the Electron app with latest code
2. **Versioning** the release
3. **Uploading** to GitHub Releases
4. **Updating** download links on the website

## Step-by-Step Deployment Process

### 1. Update Version Number

Before building, update the version in `app/package.json`:

```json
{
  "version": "0.1.1",  // Increment: 0.1.0 → 0.1.1 → 0.1.2, etc.
  ...
}
```

**Versioning Strategy:**
- **Patch** (0.1.0 → 0.1.1): Bug fixes, small improvements
- **Minor** (0.1.0 → 0.2.0): New features, significant improvements
- **Major** (0.1.0 → 1.0.0): Breaking changes, major rewrites

### 2. Build the Electron App

Build for all platforms (or specific platform):

```bash
cd app

# Build for macOS
npm run electron:build:mac

# Build for Windows
npm run electron:build:win

# Build for Linux
npm run electron:build:linux

# Build for all platforms
npm run electron:build:all
```

**Build Output Location:**
- macOS: `app/dist-electron/ghost-{version}-arm64.dmg` and `ghost-{version}-arm64-mac.zip`
- Windows: `app/dist-electron/ghost Setup {version}.exe` and `ghost-{version}-win-portable.exe`
- Linux: `app/dist-electron/ghost-{version}.AppImage` and `ghost-protocol_{version}_amd64.deb`

### 3. Test the Build Locally

**macOS:**
```bash
# Open the DMG
open app/dist-electron/ghost-{version}-arm64.dmg

# Or test the ZIP
unzip app/dist-electron/ghost-{version}-arm64-mac.zip
open ghost.app
```

**Windows:**
- Run the installer: `ghost Setup {version}.exe`
- Or run portable: `ghost-{version}-win-portable.exe`

**Linux:**
```bash
# Make AppImage executable
chmod +x app/dist-electron/ghost-{version}.AppImage
./app/dist-electron/ghost-{version}.AppImage
```

**Test Checklist:**
- [ ] App opens without errors
- [ ] Main window loads correctly
- [ ] HUD overlay window appears
- [ ] HUD is draggable and shows opacity slider
- [ ] All features work (audio, calls, etc.)
- [ ] No console errors in DevTools

### 4. Create GitHub Release

1. **Go to GitHub Releases:**
   - Navigate to: `https://github.com/vince13/ghost-download/releases`
   - Click "Draft a new release"

2. **Fill Release Details:**
   - **Tag:** `v{version}` (e.g., `v0.1.1`)
   - **Title:** `Ghost Protocol v{version}`
   - **Description:** Use the template below

3. **Upload Build Files:**
   - Drag and drop all build files from `app/dist-electron/`
   - Include:
     - macOS: `.dmg` and `.zip`
     - Windows: `.exe` (installer and portable)
     - Linux: `.AppImage` and `.deb`

4. **Publish Release:**
   - Click "Publish release"

### 5. Update Download Links on Website

Update `landing/app/page.tsx` with the new version number:

```tsx
// Find all download links and update version
href="https://github.com/vince13/ghost-download/releases/download/v{version}/ghost-{version}-arm64.dmg"
```

**Search and Replace:**
- Find: `v0.1.0` (old version)
- Replace: `v0.1.1` (new version)

**Files to Update:**
- `landing/app/page.tsx` - All download links in the download section

### 6. Deploy Website

Deploy the updated landing page to Vercel:

```bash
# From project root
vercel --prod
```

Or push to main branch (if auto-deploy is enabled):
```bash
git add .
git commit -m "Update Electron download links to v{version}"
git push origin main
```

## Quick Deployment Script

Create a script to automate the process:

```bash
#!/bin/bash
# scripts/deploy-electron.sh

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/deploy-electron.sh <version>"
  echo "Example: ./scripts/deploy-electron.sh 0.1.1"
  exit 1
fi

echo "🚀 Deploying Electron app v${VERSION}..."

# 1. Update version in package.json
cd app
npm version ${VERSION} --no-git-tag-version
cd ..

# 2. Build for all platforms
echo "📦 Building Electron app..."
cd app
npm run electron:build:all
cd ..

# 3. List build files
echo "✅ Build complete! Files in app/dist-electron/:"
ls -lh app/dist-electron/*.{dmg,zip,exe,AppImage,deb} 2>/dev/null

echo ""
echo "📋 Next steps:"
echo "1. Test the builds locally"
echo "2. Create GitHub Release: https://github.com/vince13/ghost-download/releases/new"
echo "3. Upload files from app/dist-electron/"
echo "4. Update download links in landing/app/page.tsx (replace v0.1.0 with v${VERSION})"
echo "5. Deploy website: vercel --prod"
```

## Release Notes Template

Use this template for GitHub release descriptions:

```markdown
## Ghost Protocol v{version}

### 🎉 What's New
- [Feature 1]
- [Feature 2]

### 🐛 Bug Fixes
- Fixed issue where users were auto-upgraded to Starter without payment
- Fixed HUD overlay not showing opacity slider
- Fixed window resizing issues

### 🔧 Improvements
- Improved HUD window auto-resize
- Better error handling in payment flow

### 📦 Downloads
- **macOS:** DMG and ZIP (Apple Silicon & Intel)
- **Windows:** Installer and Portable
- **Linux:** AppImage and DEB

### ⚠️ macOS Users
If you see "Ghost is damaged" warning:
1. Right-click the app
2. Select "Open"
3. Click "Open" in the dialog

Or run in Terminal:
```bash
xattr -cr /path/to/ghost.app
```

### 📝 Full Changelog
See [commit history](https://github.com/vince13/ghost-download/commits/main)
```

## Verification Checklist

After deployment, verify:

- [ ] GitHub Release is published with correct version
- [ ] All build files are uploaded to GitHub Releases
- [ ] Download links on website point to new version
- [ ] Website is deployed to production
- [ ] Download links work (test at least one per platform)
- [ ] App opens and works correctly after download

## Troubleshooting

### Build Fails
- Check `app/package.json` version is correct
- Ensure all dependencies are installed: `npm install`
- Check `electron-builder.config.js` for errors

### macOS "Damaged" Warning
- Run `npm run remove-quarantine` after build
- Or manually: `xattr -cr app/dist-electron/ghost-{version}-arm64.dmg`

### GitHub Release Upload Fails
- Check file sizes (GitHub has limits)
- Ensure files are not corrupted
- Try uploading one at a time

### Download Links Don't Work
- Verify GitHub Release tag matches URL (e.g., `v0.1.1`)
- Check file names match exactly (case-sensitive)
- Ensure release is published (not draft)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2024-12-02 | Initial release |
| 0.1.1 | TBD | Fixed auto-upgrade bug, HUD improvements |

## Automated CI/CD (Future)

Consider setting up GitHub Actions to automate:
1. Build on tag push
2. Create GitHub Release
3. Upload build files
4. Update website download links

See `.github/workflows/release.yml` (to be created) for automation.



