# HUD Video Conference Integration Guide

## Overview
This guide explains how to make the Ghost Protocol HUD float over video conferencing apps (Zoom, Microsoft Teams, Google Meet) during live calls.

## Current HUD Implementation
The HUD is currently embedded in the main React app (`app/src/App.jsx`). To float over other applications, we need to extract it into a separate window/overlay.

## Integration Approaches

### Option 1: Electron Desktop App (Recommended)
**Best for:** Full control, always-on-top, cross-platform

#### Implementation Steps:

1. **Extract HUD Component**
   - Create `app/src/components/HudOverlay.jsx` with the HUD UI
   - Make it a standalone component that can run independently

2. **Electron Main Process Setup**
   ```javascript
   // app/electron/main.js
   const { app, BrowserWindow } = require('electron');
   
   let hudWindow = null;
   
   function createHudWindow() {
     hudWindow = new BrowserWindow({
       width: 400,
       height: 600,
       frame: false, // Frameless window
       alwaysOnTop: true, // CRITICAL: Keeps window above all others
       transparent: true, // For overlay effect
       skipTaskbar: true, // Don't show in taskbar
       resizable: true,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true,
         preload: path.join(__dirname, 'preload.js')
       }
     });
     
     // Load HUD-only page
     hudWindow.loadURL('http://localhost:5173/hud-overlay'); // Dev
     // Or: hudWindow.loadFile('dist/hud-overlay.html'); // Production
     
     // Position window (user can drag)
     hudWindow.setPosition(100, 100);
   }
   
   app.whenReady().then(() => {
     createHudWindow();
   });
   ```

3. **Create HUD-Only Route**
   - Create `app/src/pages/HudOverlay.jsx` that only renders the HUD
   - Add route in `app/src/main.jsx` or router config

4. **Communication Between Windows**
   ```javascript
   // Use Electron IPC or WebSocket/Server-Sent Events
   // Main window sends data to HUD window
   const { ipcMain } = require('electron');
   
   ipcMain.on('hud-update', (event, data) => {
     if (hudWindow) {
       hudWindow.webContents.send('hud-data', data);
     }
   });
   ```

5. **Build & Package**
   ```bash
   npm install electron electron-builder --save-dev
   npm run build
   npm run electron:build
   ```

**Pros:**
- ✅ Full control over window behavior
- ✅ Always-on-top works reliably
- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ Can position anywhere on screen
- ✅ Works with any application (not just browsers)

**Cons:**
- ❌ Requires separate desktop app installation
- ❌ More complex deployment
- ❌ Need to maintain Electron version

---

### Option 2: Browser Extension (Chrome/Edge/Firefox)
**Best for:** Browser-based video calls, no separate app needed

#### Implementation Steps:

1. **Create Extension Structure**
   ```
   extension/
   ├── manifest.json
   ├── background.js
   ├── content-script.js
   ├── hud-overlay.html
   ├── hud-overlay.js
   └── styles.css
   ```

2. **Manifest.json** (Chrome/Edge)
   ```json
   {
     "manifest_version": 3,
     "name": "Ghost Protocol HUD",
     "version": "1.0.0",
     "permissions": [
       "activeTab",
       "storage",
       "scripting"
     ],
     "host_permissions": [
       "https://ghost-green.vercel.app/*",
       "https://zoom.us/*",
       "https://teams.microsoft.com/*",
       "https://meet.google.com/*"
     ],
     "background": {
       "service_worker": "background.js"
     },
     "content_scripts": [
       {
         "matches": [
           "https://zoom.us/*",
           "https://teams.microsoft.com/*",
           "https://meet.google.com/*"
         ],
         "js": ["content-script.js"],
         "css": ["styles.css"]
       }
     ],
     "action": {
       "default_popup": "popup.html"
     }
   }
   ```

3. **Content Script** (Injects HUD into video call pages)
   ```javascript
   // extension/content-script.js
   let hudContainer = null;
   
   function createHudOverlay() {
     // Create iframe pointing to Ghost HUD page
     hudContainer = document.createElement('div');
     hudContainer.id = 'ghost-hud-overlay';
     hudContainer.style.cssText = `
       position: fixed;
       top: 20px;
       right: 20px;
       width: 400px;
       height: 600px;
       z-index: 999999;
       pointer-events: auto;
       border: 1px solid rgba(255, 255, 255, 0.1);
       border-radius: 8px;
       background: rgba(17, 24, 39, 0.95);
       backdrop-filter: blur(10px);
     `;
     
     const iframe = document.createElement('iframe');
     iframe.src = 'https://ghost-green.vercel.app/app/hud-overlay';
     iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
     hudContainer.appendChild(iframe);
     
     document.body.appendChild(hudContainer);
   }
   
   // Wait for page to load
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', createHudOverlay);
   } else {
     createHudOverlay();
   }
   ```

4. **Background Script** (Manages extension state)
   ```javascript
   // extension/background.js
   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     if (request.action === 'toggle-hud') {
       chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
         chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle-hud' });
       });
     }
   });
   ```

**Pros:**
- ✅ No separate app installation
- ✅ Works directly in browser
- ✅ Easy to distribute via Chrome Web Store
- ✅ Auto-updates

**Cons:**
- ❌ Only works in browser (not desktop Zoom/Teams apps)
- ❌ Limited window control (can't force always-on-top)
- ❌ May conflict with video call UI
- ❌ Requires extension store approval

---

### Option 3: Picture-in-Picture API
**Best for:** Simple overlay, limited browser support

#### Implementation:

```javascript
// app/src/components/HudOverlay.jsx
const [pipWindow, setPipWindow] = useState(null);

async function openHudInPiP() {
  const video = document.createElement('video');
  video.srcObject = canvasStream; // Canvas with HUD rendered
  video.play();
  
  try {
    await video.requestPictureInPicture();
    // HUD now floats in PiP window
  } catch (error) {
    console.error('PiP not supported:', error);
  }
}
```

**Pros:**
- ✅ Native browser feature
- ✅ Simple implementation

**Cons:**
- ❌ Limited browser support (Chrome/Edge only)
- ❌ Requires video element (hacky for UI)
- ❌ User must manually enable PiP
- ❌ Limited positioning control

---

### Option 4: Browser Popup Window
**Best for:** Quick prototype, simple use case

#### Implementation:

```javascript
// app/src/App.jsx
function openHudWindow() {
  const hudWindow = window.open(
    '/hud-overlay',
    'GhostHUD',
    'width=400,height=600,alwaysOnTop=yes,resizable=yes'
  );
  
  // Note: 'alwaysOnTop' is not standard and may not work in all browsers
}
```

**Pros:**
- ✅ Simple to implement
- ✅ No installation needed

**Cons:**
- ❌ `alwaysOnTop` not supported in most browsers
- ❌ Popup blockers may block it
- ❌ Limited control over window behavior
- ❌ User experience issues

---

## Recommended Approach: Hybrid Solution

**Use Electron for desktop apps + Browser extension for web-based calls**

### Implementation Plan:

1. **Phase 1: Extract HUD Component**
   - Create `app/src/components/HudOverlay.jsx`
   - Make it standalone and reusable
   - Add WebSocket/SSE for real-time updates

2. **Phase 2: Electron Desktop App**
   - Create always-on-top window
   - Position it over video conferencing apps
   - Handle window management (minimize, close, position)

3. **Phase 3: Browser Extension (Optional)**
   - For users who only use web-based calls
   - Inject HUD as overlay in browser

4. **Phase 4: Communication Layer**
   - WebSocket server for real-time HUD updates
   - Or use Firebase Realtime Database
   - Sync state between main app and HUD window

---

## Technical Implementation Details

### 1. Extract HUD Component

Create `app/src/components/HudOverlay.jsx`:

```jsx
import { useEffect, useState } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useSuggestions } from '../hooks/useSuggestions'; // New hook

export function HudOverlay() {
  const { user } = useFirebaseAuth();
  const { suggestions, transcript } = useSuggestions(user?.uid);
  
  // Render only HUD UI (no main app chrome)
  return (
    <div className="hud-overlay-container">
      {/* HUD content from App.jsx */}
    </div>
  );
}
```

### 2. Create HUD-Only Page

Create `app/src/pages/HudOverlayPage.jsx`:

```jsx
import { HudOverlay } from '../components/HudOverlay';

export default function HudOverlayPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent' }}>
      <HudOverlay />
    </div>
  );
}
```

### 3. Add Route

In `app/src/main.jsx` or router:

```jsx
import { createBrowserRouter } from 'react-router-dom';
import HudOverlayPage from './pages/HudOverlayPage';

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/hud-overlay', element: <HudOverlayPage /> },
]);
```

### 4. Electron Main Process

Update `app/electron/main.js`:

```javascript
const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

let hudWindow = null;
let mainWindow = null;

function createHudWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  hudWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: width - 420, // Position on right side
    y: 100,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    skipTaskbar: true,
    resizable: true,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Load HUD overlay page
  if (process.env.NODE_ENV === 'development') {
    hudWindow.loadURL('http://localhost:5173/hud-overlay');
    hudWindow.webContents.openDevTools();
  } else {
    hudWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: 'hud-overlay'
    });
  }
  
  // Make window draggable
  hudWindow.setIgnoreMouseEvents(false);
}

app.whenReady().then(() => {
  createHudWindow();
});
```

### 5. Real-time Communication

Use WebSocket or Firebase Realtime Database:

```javascript
// app/src/hooks/useHudSync.js
import { useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function useHudSync(userId, callId) {
  useEffect(() => {
    if (!userId || !callId) return;
    
    const q = query(
      collection(db, 'users', userId, 'calls', callId, 'suggestions'),
      where('createdAt', '>', new Date(Date.now() - 60000)) // Last minute
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const suggestions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Broadcast to HUD window (if Electron)
      if (window.electronAPI) {
        window.electronAPI.sendToHud('suggestions', suggestions);
      }
    });
    
    return unsubscribe;
  }, [userId, callId]);
}
```

---

## User Experience Flow

1. **User starts Ghost session** in main app
2. **HUD window automatically opens** (Electron) or **extension injects HUD** (browser)
3. **User joins Zoom/Teams/Meet call**
4. **HUD floats over video call** showing coaching cues
5. **User can drag HUD** to preferred position
6. **HUD position persists** across sessions

---

## Testing Checklist

- [ ] HUD appears over Zoom desktop app
- [ ] HUD appears over Teams desktop app
- [ ] HUD appears over Meet in browser
- [ ] HUD stays on top when switching windows
- [ ] HUD position persists after restart
- [ ] HUD updates in real-time with coaching cues
- [ ] HUD doesn't interfere with video call controls
- [ ] HUD can be minimized/hidden
- [ ] HUD works on Windows, macOS, Linux (Electron)

---

## Next Steps

1. **Extract HUD component** into standalone module
2. **Set up Electron** with always-on-top window
3. **Create HUD-only route** in React app
4. **Implement real-time sync** between main app and HUD
5. **Test with Zoom/Teams/Meet**
6. **Package and distribute** Electron app

---

## Resources

- [Electron Always-On-Top Documentation](https://www.electronjs.org/docs/latest/api/browser-window#winandalwaysontop)
- [Chrome Extension Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API)
- [Firebase Realtime Database](https://firebase.google.com/docs/database)

