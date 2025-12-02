# Fix: Vercel Uploading 636.8MB

## Problem

Vercel was trying to upload 636.8MB because the `app/dist/` directory (644MB) containing Electron build files was being tracked by git and included in the deployment.

## Solution Applied

1. **Added to `.gitignore`**:
   - `app/dist/` - Contains Electron build artifacts
   - `app/dist-electron/` - Electron builder output directory

2. **Removed from git tracking**:
   ```bash
   git rm -r --cached app/dist/
   ```

## Next Steps

1. **Commit the changes**:
   ```bash
   git add .gitignore
   git commit -m "Exclude Electron build directories from git and Vercel"
   ```

2. **Redeploy to Vercel**:
   ```bash
   vercel --prod
   ```
   
   The upload should now be much smaller (only the actual source code and necessary files).

## What Was Being Uploaded

- `app/dist/` (644MB) - Electron build output including:
  - `ghost-0.1.0-arm64.dmg` (123MB)
  - `ghost-0.1.0-arm64-mac.zip` (119MB)
  - Full Electron app bundle (`mac-arm64/ghost.app/`)
  - All built assets

## Why This Happened

The `app/dist/` directory is created when you run `npm run build` in the `app/` directory. This directory contains the production build of the React app, which is then packaged by electron-builder. These files should never be committed to git or deployed to Vercel since:

1. They're build artifacts (can be regenerated)
2. They're huge (600+ MB)
3. Vercel has a 100MB file size limit
4. We're using GitHub Releases for Electron builds anyway

## Prevention

The `.gitignore` now includes:
```
app/dist/
app/dist-electron/
```

These directories will be ignored by git and won't be uploaded to Vercel.

