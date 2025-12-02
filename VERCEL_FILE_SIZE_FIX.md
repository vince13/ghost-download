# Fixing Vercel File Size Limit (100 MB)

## Problem

Vercel has a **100 MB file size limit** for deployments. Electron build files (DMG, EXE, AppImage, etc.) are typically 50-200MB each, which exceeds this limit.

**Error message:**
```
Error: File size limit exceeded (100 MB)
```

## Solution: Use GitHub Releases (Recommended)

Instead of committing large files to git/Vercel, host them on GitHub Releases.

### Step 1: Create GitHub Release

1. Go to your GitHub repository
2. Click **"Releases"** → **"Create a new release"**
3. Tag version: `v0.1.0` (or your version)
4. Release title: `Ghost Protocol v0.1.0`
5. Upload all your build files:
   - `Ghost Protocol-0.1.0-arm64.dmg`
   - `Ghost Protocol-0.1.0-arm64-mac.zip`
   - `Ghost Protocol Setup 0.1.0.exe`
   - `Ghost Protocol-0.1.0-win-portable.exe`
   - `Ghost Protocol-0.1.0.AppImage`
   - `ghost-protocol_0.1.0_amd64.deb`
6. Click **"Publish release"**

### Step 2: Update Download Links

Update `landing/app/page.tsx` to point to GitHub Releases:

```tsx
// macOS DMG
href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.1.0/Ghost Protocol-0.1.0-arm64.dmg"

// macOS ZIP
href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.1.0/Ghost Protocol-0.1.0-arm64-mac.zip"

// Windows Installer
href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.1.0/Ghost Protocol Setup 0.1.0.exe"

// Windows Portable
href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.1.0/Ghost Protocol-0.1.0-win-portable.exe"

// Linux AppImage
href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.1.0/Ghost Protocol-0.1.0.AppImage"

// Linux DEB
href="https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.1.0/ghost-protocol_0.1.0_amd64.deb"
```

### Step 3: Exclude Downloads from Git

Add to `.gitignore`:

```
# Exclude large Electron build files from git
landing/public/downloads/*.dmg
landing/public/downloads/*.zip
landing/public/downloads/*.exe
landing/public/downloads/*.AppImage
landing/public/downloads/*.deb
```

### Step 4: Remove Existing Files (if already committed)

```bash
# Remove files from git (but keep local copies)
git rm --cached landing/public/downloads/*.dmg
git rm --cached landing/public/downloads/*.zip
git rm --cached landing/public/downloads/*.exe
git rm --cached landing/public/downloads/*.AppImage
git rm --cached landing/public/downloads/*.deb

# Commit the removal
git commit -m "Remove large build files, using GitHub Releases instead"
```

## Alternative: Cloud Storage (S3, Cloudflare R2, etc.)

1. Upload files to your cloud storage bucket
2. Make files publicly accessible
3. Update download links to point to your CDN URLs
4. Example: `https://cdn.yourdomain.com/downloads/Ghost Protocol-0.1.0-arm64.dmg`

## Benefits of GitHub Releases

✅ **No file size limits**  
✅ **Free hosting**  
✅ **Automatic versioning**  
✅ **Download statistics**  
✅ **CDN included**  
✅ **Works with private repos** (if you have GitHub Pro/Team)

## Workflow for New Versions

1. Build Electron app: `cd app && npm run electron:build:mac`
2. Create GitHub release with tag `v0.2.0`
3. Upload all build files to the release
4. Update download links in `landing/app/page.tsx` to new version
5. Deploy to Vercel (no large files = no size limit error)

