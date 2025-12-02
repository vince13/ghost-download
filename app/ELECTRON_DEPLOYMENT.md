# Electron Deployment Guide

This guide explains how to build and deploy the Ghost Protocol Electron app for production.

## Prerequisites

1. **Build the React app first**: The Electron app needs the built React app in the `dist/` folder
2. **Install dependencies**: Make sure all dependencies are installed (`npm install`)

## Build Commands

### Development Mode
```bash
cd app
npm run electron:dev
```
This runs:
- Vite dev server on `http://localhost:5173`
- Electron app that loads from the dev server
- Hot reload enabled
- DevTools open automatically

### Production Build

#### Step 1: Navigate to app directory
```bash
cd app
```

#### Step 2: Build the React App
```bash
npm run build
```
This creates the production build in the `dist/` folder with all assets.

#### Step 3: Build the Electron App

**For macOS (current platform):**
```bash
npm run electron:build
```

**For Windows (from macOS - cross-compile):**
```bash
npm run build
npx electron-builder --win
```

**For Linux (from macOS - cross-compile):**
```bash
npm run build
npx electron-builder --linux
```

**For all platforms:**
```bash
npm run build
npx electron-builder --mac --win --linux
```

**Note**: The build process will:
- Copy `dist/` folder (React app)
- Copy `electron/` folder (main process files)
- Copy `package.json`
- Create platform-specific installers

## Build Output

After building, you'll find the installers in the `dist/` folder:

### macOS
- `dist/ghost-{version}-arm64.dmg` - Disk image installer (drag to Applications)
- `dist/ghost-{version}-arm64-mac.zip` - ZIP archive (portable, no installation needed)

### Windows
- `dist/Ghost Protocol Setup {version}.exe` - NSIS installer (allows custom installation directory)
- `dist/Ghost Protocol-{version}-win-portable.exe` - Portable executable (no installation needed)

### Linux
- `dist/Ghost Protocol-{version}.AppImage` - AppImage (universal, works on most Linux distros)
- `dist/ghost-protocol_{version}_amd64.deb` - Debian package (for Debian/Ubuntu-based systems)

### Windows
- `dist-electron/Ghost Protocol Setup {version}.exe` - NSIS installer
- `dist-electron/Ghost Protocol-{version}-win-portable.exe` - Portable executable

### Linux
- `dist-electron/Ghost Protocol-{version}.AppImage` - AppImage
- `dist-electron/ghost-protocol_{version}_amd64.deb` - Debian package

## Configuration

The build configuration is in `electron-builder.config.js`:

- **App ID**: `com.ghost.protocol`
- **Product Name**: `Ghost Protocol`
- **Output Directory**: `dist-electron/`

## Platform-Specific Notes

### macOS
- Requires code signing for distribution outside Mac App Store
- Icons: `build/icon.icns` (512x512 recommended)
- Entitlements: `build/entitlements.mac.plist` (for hardened runtime)

### Windows
- Icons: `build/icon.ico` (256x256 recommended)
- NSIS installer allows custom installation directory

### Linux
- Icons: `build/icon.png` (512x512 recommended)
- Creates both AppImage and Debian package

## Troubleshooting

### "Production build not found"
- Make sure you've run `npm run build` first
- Check that `dist/index.html` exists

### Missing icons
- Create a `build/` directory in the `app/` folder
- Add platform-specific icons:
  - `build/icon.icns` (macOS)
  - `build/icon.ico` (Windows)
  - `build/icon.png` (Linux)

### Build fails
- Check that all dependencies are installed
- Ensure `dist/` folder contains the built React app
- Check `electron-builder.config.js` for correct paths

## Cross-Platform Building

### Building from macOS for Other Platforms

You can build for Windows and Linux from macOS using electron-builder's cross-compilation:

**Windows:**
```bash
cd app
npm run build
npx electron-builder --win
```

**Linux:**
```bash
cd app
npm run build
npx electron-builder --linux
```

**All platforms:**
```bash
cd app
npm run build
npx electron-builder --mac --win --linux
```

**Note**: Cross-compilation works, but:
- Windows builds from macOS require Wine (for code signing, optional)
- Linux builds from macOS work without additional tools
- For best results, build on the target platform when possible

### Building on Target Platform

**Windows:**
1. Install Node.js and npm
2. Clone the repo
3. Run `cd app && npm install`
4. Run `npm run electron:build`

**Linux:**
1. Install Node.js and npm
2. Install required dependencies: `sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2` (Debian/Ubuntu)
3. Clone the repo
4. Run `cd app && npm install`
5. Run `npm run electron:build`

## Distribution

### For Testing
- Use the portable/zip versions for quick testing
- No installation required

### For Distribution
- **macOS**: Use `.dmg` for distribution (users can drag to Applications)
- **Windows**: Use `.exe` installer for distribution (NSIS installer)
- **Linux**: Use `.AppImage` for universal compatibility or `.deb` for Debian-based systems

## Code Signing (Optional)

For production distribution, you may want to code sign your app:

### macOS
```bash
# Requires Apple Developer account
electron-builder --mac --publish never
```

### Windows
```bash
# Requires code signing certificate
electron-builder --win --publish never
```

## Environment Variables

Make sure to set production environment variables:
- `NODE_ENV=production`
- Firebase config (if needed)
- API keys (if needed)

The app will automatically detect production mode and load from `dist/` instead of dev server.

