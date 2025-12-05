# Electron Deployment Checklist

Use this checklist to ensure the Electron app on the website is always the latest working version.

## Pre-Deployment

- [ ] All code changes are committed and pushed
- [ ] All tests pass (if applicable)
- [ ] No critical bugs in current version
- [ ] Version number is decided (patch/minor/major)

## Build Process

- [ ] Update version in `app/package.json`
- [ ] Run `./scripts/deploy-electron.sh <version>` OR manually:
  - [ ] `cd app && npm run electron:build:mac`
  - [ ] `cd app && npm run electron:build:win`
  - [ ] `cd app && npm run electron:build:linux`
- [ ] Verify build files exist in `app/dist-electron/`
- [ ] Check file sizes are reasonable (not corrupted)

## Testing

- [ ] **macOS:** Test DMG and ZIP
  - [ ] App opens without errors
  - [ ] Main window loads
  - [ ] HUD overlay appears
  - [ ] HUD is draggable
  - [ ] Opacity slider works
  - [ ] All features functional
- [ ] **Windows:** Test installer and portable
  - [ ] Installer works
  - [ ] Portable runs
  - [ ] All features functional
- [ ] **Linux:** Test AppImage and DEB
  - [ ] AppImage is executable
  - [ ] DEB installs correctly
  - [ ] All features functional

## GitHub Release

- [ ] Go to: https://github.com/vince13/ghost-download/releases/new
- [ ] Create new release:
  - [ ] Tag: `v{version}` (e.g., `v0.1.1`)
  - [ ] Title: `Ghost Protocol v{version}`
  - [ ] Description: Use release notes template
- [ ] Upload all build files:
  - [ ] macOS DMG
  - [ ] macOS ZIP
  - [ ] Windows Installer
  - [ ] Windows Portable
  - [ ] Linux AppImage
  - [ ] Linux DEB
- [ ] Publish release (not draft)

## Website Update

- [ ] Update `landing/app/page.tsx`:
  - [ ] Find all `v0.1.0` (or current version)
  - [ ] Replace with new version `v{version}`
  - [ ] Verify all download links updated
- [ ] Test download links locally (if possible)
- [ ] Commit changes: `git add landing/app/page.tsx && git commit -m "Update Electron download links to v{version}"`

## Deployment

- [ ] Deploy website to Vercel:
  - [ ] Run: `vercel --prod`
  - [ ] Or push to main branch (if auto-deploy enabled)
- [ ] Verify deployment succeeded

## Post-Deployment Verification

- [ ] Visit website: https://ghost-green.vercel.app (or your domain)
- [ ] Navigate to download section
- [ ] Test at least one download link per platform:
  - [ ] macOS DMG link works
  - [ ] Windows Installer link works
  - [ ] Linux AppImage link works
- [ ] Verify downloaded app works:
  - [ ] App opens
  - [ ] No errors
  - [ ] Features work

## Documentation

- [ ] Update `ELECTRON_DEPLOYMENT_WORKFLOW.md` with new version
- [ ] Update version history table
- [ ] Document any breaking changes or important notes

## Rollback Plan (if needed)

If deployment fails:
- [ ] Revert website changes: `git revert HEAD`
- [ ] Redeploy previous version
- [ ] Keep previous GitHub Release available
- [ ] Document what went wrong

## Quick Reference

**Current Version:** Check `app/package.json`

**Build Commands:**
```bash
cd app
npm run electron:build:mac    # macOS only
npm run electron:build:win    # Windows only
npm run electron:build:linux  # Linux only
npm run electron:build:all    # All platforms
```

**Deploy Script:**
```bash
./scripts/deploy-electron.sh 0.1.1
```

**GitHub Releases:**
https://github.com/vince13/ghost-download/releases

**Website:**
https://ghost-green.vercel.app (or your domain)

