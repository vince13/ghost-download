# Electron Development Guide

## Quick Start

### Development Mode (Recommended)

This starts both the Vite dev server AND Electron:

```bash
cd app
npm run electron:dev
```

This command:
1. Starts Vite dev server on `http://localhost:5173`
2. Waits for the server to be ready
3. Launches Electron which connects to the dev server
4. Enables hot reload

### What NOT to Use

❌ **Don't use**: `npm run electron`
- This only starts Electron
- It tries to connect to `http://localhost:5173/app/` but the server isn't running
- You'll get `ERR_CONNECTION_REFUSED` errors

### Testing Production Build

To test the production build (what users will get):

```bash
cd app
npm run build          # Build React app
npm run electron:build:mac  # Build Electron app
```

Then open the DMG from `app/dist/ghost-0.1.0-arm64.dmg`

## Commands Reference

| Command | What It Does |
|---------|-------------|
| `npm run electron:dev` | Start dev server + Electron (hot reload) |
| `npm run electron` | ❌ Only starts Electron (needs dev server running) |
| `npm run build` | Build React app for production |
| `npm run electron:build:mac` | Build complete Electron app for macOS |
| `npm run electron:build:win` | Build for Windows |
| `npm run electron:build:linux` | Build for Linux |

## Troubleshooting

### "ERR_CONNECTION_REFUSED"

**Problem**: Electron can't connect to dev server

**Solution**: Use `npm run electron:dev` instead of `npm run electron`

### Blank Window in Production

**Problem**: App window is black/blank

**Solution**: 
1. Check DevTools console for errors
2. Verify protocol handler is working
3. Check that assets are loading from `app://` protocol

### HUD Window Not Appearing

**Problem**: Floating HUD doesn't show up

**Solution**:
- Check console for HUD creation errors
- Verify HUD window isn't minimized
- Check if HUD is hidden behind other windows

