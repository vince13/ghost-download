Checking the Electron icon configuration and adding a Ghost logo:


Checking for existing logo/icon assets and setting up the icon configuration:


Config already references `build/icon.icns`. Creating a script to generate icons from a logo image:



## Quick steps

### 1. Get your Ghost logo
- PNG format
- At least 1024x1024px (square)
- Transparent background recommended

### 2. Create icons automatically

```bash
cd app
./scripts/create-icons.sh path/to/your-ghost-logo.png
```

This creates:
- `build/icon.icns` (macOS)
- `build/icon.ico` (Windows)
- `build/icon.png` (Linux)

### 3. Rebuild

```bash
npm run electron:build:mac
```

### 4. Test

```bash
open dist/ghost-0.1.0-arm64.dmg
```

You should see your Ghost logo instead of the Electron logo.

## Alternative: online converters

If the script doesn't work:

1. macOS: https://cloudconvert.com/png-to-icns → Save to `app/build/icon.icns`
2. Windows: https://cloudconvert.com/png-to-ico → Save to `app/build/icon.ico`
3. Linux: Resize logo to 512x512px → Save to `app/build/icon.png`

## Configuration

Your `electron-builder.config.js` is already set up to use:
- `build/icon.icns` for macOS
- `build/icon.ico` for Windows
- `build/icon.png` for Linux

Once you add these files, rebuild and the Ghost logo will appear in the DMG installer window.

See `app/ICON_SETUP_COMPLETE.md` for detailed instructions.
