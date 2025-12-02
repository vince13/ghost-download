# Download Setup Guide

This guide explains how to set up downloads for the Ghost Protocol desktop app.

## Overview

The landing page includes a download section that links to Electron app builds for macOS, Windows, and Linux. The download links point to `/downloads/` which should be served from your hosting provider.

## Download File Structure

After building the Electron app, you'll have files in `app/dist-electron/`:

### macOS
- `ghost-0.1.0-arm64.dmg` (or `ghost-0.1.0-x64.dmg` for Intel)
- `ghost-0.1.0-arm64-mac.zip` (or `ghost-0.1.0-x64-mac.zip`)

### Windows
- `Ghost Protocol Setup 0.1.0.exe` (NSIS installer)
- `Ghost Protocol-0.1.0-win-portable.exe` (Portable version)

### Linux
- `Ghost Protocol-0.1.0.AppImage`
- `ghost-protocol_0.1.0_amd64.deb` (Debian package)

## Hosting Options

### Option 1: Vercel (Recommended)

1. Create a `public/downloads/` directory in your `landing/` folder:
   ```bash
   mkdir -p landing/public/downloads
   ```

2. Copy your built Electron files to this directory:
   ```bash
   # After building Electron app
   cp app/dist-electron/*.dmg landing/public/downloads/
   cp app/dist-electron/*.zip landing/public/downloads/
   cp app/dist-electron/*.exe landing/public/downloads/
   cp app/dist-electron/*.AppImage landing/public/downloads/
   cp app/dist-electron/*.deb landing/public/downloads/
   ```

3. Vercel will automatically serve files from `landing/public/` at the root URL.

4. Update the download links in `landing/app/page.tsx` if your file names differ.

### Option 2: GitHub Releases

1. Create a GitHub release for each version (e.g., `v0.1.0`).

2. Upload all build artifacts to the release.

3. Update download links in `landing/app/page.tsx` to point to GitHub release URLs:
   ```tsx
   href="https://github.com/your-org/ghost/releases/download/v0.1.0/ghost-0.1.0-arm64.dmg"
   ```

### Option 3: Cloud Storage (S3, Cloudflare R2, etc.)

1. Upload build files to your cloud storage bucket.

2. Make files publicly accessible.

3. Update download links to point to your CDN/storage URLs.

## Building for Production

To build all platforms:

```bash
cd app

# Build for macOS
npm run electron:build:mac

# Build for Windows (requires Windows or CI/CD)
npm run electron:build:win

# Build for Linux (requires Linux or CI/CD)
npm run electron:build:linux

# Build for all platforms (if on macOS with cross-compilation)
npm run electron:build:all
```

## File Naming Convention

The download links in `landing/app/page.tsx` use these file names based on electron-builder's default naming:

- macOS: `Ghost Protocol-0.1.0-arm64.dmg`, `Ghost Protocol-0.1.0-arm64-mac.zip`
- Windows: `Ghost Protocol Setup 0.1.0.exe`, `Ghost Protocol-0.1.0-win-portable.exe`
- Linux: `Ghost Protocol-0.1.0.AppImage`, `ghost-protocol_0.1.0_amd64.deb`

**To verify actual file names after building:**
```bash
cd app
npm run build
npm run electron:build:mac  # or :win, :linux
ls -lh dist-electron/
```

The file names will match the `productName` in `electron-builder.config.js` and version in `package.json`.

## Version Management

When releasing a new version:

1. Update version in `app/package.json`
2. Rebuild Electron app
3. Copy new files to `landing/public/downloads/` (or upload to your hosting)
4. Update version numbers in `landing/app/page.tsx` download links
5. Deploy

## Testing Downloads

1. Build the Electron app for your platform
2. Copy files to `landing/public/downloads/`
3. Start the Next.js dev server: `cd landing && npm run dev`
4. Visit `http://localhost:3000#download` and test download links
5. Verify files download correctly

## Notes

- File sizes can be large (50-200MB), ensure your hosting/CDN can handle this
- Consider using a CDN for faster downloads globally
- GitHub Releases is free and works well for open-source projects
- For private repos, use Vercel's public folder or cloud storage

