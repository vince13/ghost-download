# Quick Start: Setting Up Downloads

## One-Command Setup (After Building)

After you've built the Electron app, copy files to the downloads folder:

```bash
cd app
npm run copy-downloads
```

That's it! Files are now in `landing/public/downloads/` and ready for Vercel.

## Complete Workflow

### 1. Build the Electron App

```bash
cd app
npm run electron:build:mac    # For macOS
# OR
npm run electron:build:win     # For Windows
# OR
npm run electron:build:linux    # For Linux
```

### 2. Copy Files to Downloads

```bash
# From app directory
npm run copy-downloads

# OR from root directory
node scripts/copy-downloads.js
```

### 3. Verify Files

```bash
ls -lh landing/public/downloads/
```

You should see files like:
- `Ghost Protocol-0.1.0-arm64.dmg`
- `Ghost Protocol Setup 0.1.0.exe`
- etc.

### 4. Commit and Deploy

```bash
git add landing/public/downloads/
git commit -m "Add Electron build files"
git push origin main
# Or: vercel --prod
```

## Combined Build + Copy Commands

For convenience, you can build and copy in one step:

```bash
cd app

# macOS
npm run build:mac:deploy

# Windows
npm run build:win:deploy

# Linux
npm run build:linux:deploy
```

## Testing Locally

1. Start Next.js dev server:
   ```bash
   cd landing
   npm run dev
   ```

2. Visit: `http://localhost:3000#download`

3. Click download buttons to test

## File URLs After Deployment

Once deployed to Vercel, files will be available at:
- `https://your-domain.com/downloads/Ghost Protocol-0.1.0-arm64.dmg`
- `https://your-domain.com/downloads/Ghost Protocol Setup 0.1.0.exe`
- etc.

The landing page links are already configured to use these paths!

