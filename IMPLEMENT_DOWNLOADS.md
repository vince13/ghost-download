# Implementing Option A: Vercel Downloads

This guide walks you through setting up downloads using Vercel's public folder.

## Quick Start

### Step 1: Build the Electron App

Build for your target platform(s):

```bash
cd app

# For macOS
npm run electron:build:mac

# For Windows
npm run electron:build:win

# For Linux
npm run electron:build:linux

# Or build all at once
npm run electron:build:all
```

### Step 2: Copy Files to Downloads Folder

**Option A: Using the automated script (Recommended)**

```bash
# From the app directory
npm run copy-downloads

# Or from the root directory
node scripts/copy-downloads.js
```

**Option B: Manual copy**

```bash
# From the root directory
cp app/dist-electron/*.dmg landing/public/downloads/ 2>/dev/null || true
cp app/dist-electron/*mac.zip landing/public/downloads/ 2>/dev/null || true
cp app/dist-electron/*.exe landing/public/downloads/ 2>/dev/null || true
cp app/dist-electron/*.AppImage landing/public/downloads/ 2>/dev/null || true
cp app/dist-electron/*.deb landing/public/downloads/ 2>/dev/null || true
```

**Option C: Build and copy in one command**

```bash
cd app

# macOS
npm run build:mac:deploy

# Windows
npm run build:win:deploy

# Linux
npm run build:linux:deploy
```

### Step 3: Verify Files

Check that files are in the right place:

```bash
ls -lh landing/public/downloads/
```

You should see files like:
- `Ghost Protocol-0.1.0-arm64.dmg`
- `Ghost Protocol-0.1.0-arm64-mac.zip`
- `Ghost Protocol Setup 0.1.0.exe`
- `Ghost Protocol-0.1.0.AppImage`
- etc.

### Step 4: Commit and Deploy

```bash
# Add the download files
git add landing/public/downloads/

# Commit
git commit -m "Add Electron build files for download"

# Deploy to Vercel
vercel --prod
```

Or if you're using Git-based deployment, just push:

```bash
git push origin main
```

## How It Works

1. **Build Process**: When you run `npm run electron:build:mac` (or win/linux), electron-builder creates files in `app/dist-electron/`

2. **Copy Script**: The `copy-downloads.js` script:
   - Checks if `app/dist-electron/` exists
   - Creates `landing/public/downloads/` if needed
   - Copies all build files (`.dmg`, `.zip`, `.exe`, `.AppImage`, `.deb`) to the downloads folder

3. **Vercel Serving**: Next.js (used by the landing page) automatically serves files from `landing/public/` at the root URL. So:
   - `landing/public/downloads/file.dmg` → `https://your-domain.com/downloads/file.dmg`

4. **Download Links**: The landing page (`landing/app/page.tsx`) has links like:
   ```tsx
   href="/downloads/Ghost Protocol-0.1.0-arm64.dmg"
   ```

## File Structure

```
GHOST/
├── app/
│   ├── dist-electron/          # Build output (gitignored)
│   │   ├── Ghost Protocol-0.1.0-arm64.dmg
│   │   ├── Ghost Protocol-0.1.0-arm64-mac.zip
│   │   └── ...
│   └── package.json
├── landing/
│   └── public/
│       └── downloads/           # Files served by Vercel
│           ├── .gitkeep
│           ├── Ghost Protocol-0.1.0-arm64.dmg
│           ├── Ghost Protocol-0.1.0-arm64-mac.zip
│           └── ...
└── scripts/
    ├── copy-downloads.js       # Node.js copy script
    └── copy-downloads.sh       # Bash copy script
```

## Testing Locally

1. **Start the Next.js dev server**:
   ```bash
   cd landing
   npm run dev
   ```

2. **Visit the download page**:
   ```
   http://localhost:3000#download
   ```

3. **Test download links**: Click the download buttons and verify files download correctly

## Updating for New Versions

When you release a new version:

1. **Update version in `app/package.json`**:
   ```json
   "version": "0.2.0"
   ```

2. **Rebuild**:
   ```bash
   cd app
   npm run electron:build:mac  # or win/linux
   ```

3. **Copy new files**:
   ```bash
   npm run copy-downloads
   ```

4. **Update download links in `landing/app/page.tsx`** (if file names changed):
   ```tsx
   href="/downloads/Ghost Protocol-0.2.0-arm64.dmg"
   ```

5. **Commit and deploy**:
   ```bash
   git add landing/public/downloads/
   git commit -m "Update to v0.2.0"
   vercel --prod
   ```

## Troubleshooting

### Files not copying?

- Check that `app/dist-electron/` exists and has files
- Run the script with verbose output: `node scripts/copy-downloads.js`
- Check file permissions

### 404 errors on download links?

- Verify files exist in `landing/public/downloads/`
- Check file names match exactly (case-sensitive)
- Ensure files are committed to git
- Check Vercel deployment logs

### File names don't match?

- Check actual file names in `app/dist-electron/` after building
- Update links in `landing/app/page.tsx` to match
- File names are based on `productName` in `electron-builder.config.js` and `version` in `package.json`

## ⚠️ Important: Vercel File Size Limit

**Vercel has a 100 MB file size limit** for deployments. Electron builds are typically 50-200MB, which may exceed this limit.

### Solutions:

#### Option 1: Use GitHub Releases (Recommended for Large Files)

Instead of committing files to git, host them on GitHub Releases:

1. **Create a GitHub release** for each version
2. **Upload build files** to the release
3. **Update download links** in `landing/app/page.tsx` to point to GitHub:

```tsx
// Example for macOS
href="https://github.com/your-org/ghost/releases/download/v0.1.0/Ghost Protocol-0.1.0-arm64.dmg"
```

**Benefits:**
- No file size limits
- Free hosting
- Automatic versioning
- Download statistics

#### Option 2: Use Cloud Storage (S3, Cloudflare R2, etc.)

1. Upload files to your cloud storage bucket
2. Make files publicly accessible
3. Update download links to point to your CDN URLs

#### Option 3: Vercel Pro Plan

If you have Vercel Pro, the file size limit is higher, but still check your plan limits.

### Quick Fix: Exclude Downloads from Git

If you want to keep using Vercel but avoid the 100MB limit:

1. **Add to `.gitignore`**:
   ```
   landing/public/downloads/*.dmg
   landing/public/downloads/*.zip
   landing/public/downloads/*.exe
   landing/public/downloads/*.AppImage
   landing/public/downloads/*.deb
   ```

2. **Use GitHub Releases** or cloud storage for actual file hosting
3. **Update links** in the landing page to point to external URLs

## Notes

- **File Sizes**: Electron builds can be 50-200MB. Vercel free tier has a 100MB limit
- **Git**: Large binary files in git can slow down clones. Consider using Git LFS or hosting files elsewhere
- **CDN**: GitHub Releases and cloud storage both provide CDN benefits
- **Bandwidth**: Monitor bandwidth usage if you expect many downloads

## Alternative: GitHub Releases

If you prefer not to commit large files to git, see `DOWNLOAD_SETUP.md` for GitHub Releases option.

