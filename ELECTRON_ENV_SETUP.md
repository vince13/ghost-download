# Electron Environment Variables Setup

## Issue
The console shows "Firebase config missing" warnings. This is because environment variables aren't configured for Electron.

## Solution

### 1. Create `.env` file in `app/` directory

Create a file at `app/.env` with your Firebase configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Vapi Configuration (optional, for voice features)
VITE_VAPI_API_KEY=your-vapi-public-key
VITE_VAPI_ASSISTANT_ID=your-assistant-id
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon)
4. Scroll to **Your apps** section
5. Click on your web app (or create one)
6. Copy the config values

### 3. Restart Electron

After creating `.env`, restart the Electron app:

```bash
cd app
npm run electron:dev
```

## Note

- The `.env` file should be in the `app/` directory (same level as `package.json`)
- Vite automatically loads `.env` files and makes them available via `import.meta.env.VITE_*`
- The `.env` file should be in `.gitignore` (don't commit secrets)

## Current Behavior

Without Firebase config:
- ✅ App loads and displays UI
- ✅ HUD overlay window opens
- ❌ No authentication
- ❌ No real-time suggestions sync
- ❌ No Firestore data

With Firebase config:
- ✅ Full functionality
- ✅ Authentication works
- ✅ Real-time suggestions sync between main app and HUD
- ✅ Firestore data persistence

## Alternative: Use Web Version

If you don't want to set up Electron environment variables, you can:
1. Use the web version at `https://ghost-green.vercel.app`
2. Environment variables are already configured there
3. The HUD overlay feature requires Electron for always-on-top functionality

