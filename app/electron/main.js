import { app, BrowserWindow, ipcMain, screen, protocol } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow = null;
let hudWindow = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: '#000000',
    title: 'Ghost Protocol',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true
    },
    icon: isDev ? undefined : join(__dirname, '../dist/icon.png')
  });
  
  // Set Content Security Policy to reduce security warning
  // Allow blob: URLs for scripts (needed for Vapi SDK and other dynamic scripts)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; " +
          "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; " +
          "style-src 'self' 'unsafe-inline' https:; " +
          "img-src 'self' data: https: blob:; " +
          "font-src 'self' data: https:; " +
          "connect-src 'self' https: wss: ws:;"
        ]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/app/');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html from the dist folder.
    const indexPath = join(app.getAppPath(), 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Create HUD overlay window when main window is ready
  mainWindow.webContents.once('did-finish-load', () => {
    createHudWindow();
  });
}

function createHudWindow() {
  // Don't create if already exists
  if (hudWindow) return;
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  hudWindow = new BrowserWindow({
    width: 384, // Match w-96 (24rem = 384px) - exact content width
    height: 500, // Start larger to accommodate full expanded HUD with opacity slider
    x: width - 404, // Position on right side (384 + 20px margin)
    y: 100,
    title: 'Ghost HUD',
    frame: false, // Frameless window
    alwaysOnTop: true, // CRITICAL: Keeps window above all others (Zoom, Teams, Meet)
    transparent: true, // Transparent background for floating effect
    skipTaskbar: true, // Don't show in taskbar
    resizable: true,
    minimizable: true,
    maximizable: false,
    backgroundColor: '#00000000', // Fully transparent background
    hasShadow: true, // Add shadow for floating effect
    visibleOnAllWorkspaces: true, // Show on all spaces/desktops
    show: false, // Don't show until properly sized
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      // Content Security Policy
      webSecurity: true
    }
  });
  
  // Set Content Security Policy to reduce security warning
  // Allow blob: URLs for scripts (needed for Vapi SDK and other dynamic scripts)
  hudWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; " +
          "script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https: blob:; " +
          "style-src 'self' 'unsafe-inline' https:; " +
          "img-src 'self' data: https: blob:; " +
          "font-src 'self' data: https:; " +
          "connect-src 'self' https: wss: ws:;"
        ]
      }
    });
  });
  
  // Load HUD overlay page
  if (isDev) {
    hudWindow.loadURL('http://localhost:5173/app/hud-overlay');
    // hudWindow.webContents.openDevTools(); // Uncomment for debugging
  } else {
    // In production, load the same built index.html from the dist folder and use
    // hash routing to show the HUD overlay entry point.
    const indexPath = join(app.getAppPath(), 'dist', 'index.html');
    hudWindow.loadFile(indexPath, { hash: 'hud-overlay' });
  }
  
  // On macOS, make window visible on all workspaces including fullscreen apps
  // This must be set after the window is created
  if (process.platform === 'darwin') {
    // This makes the window appear over fullscreen applications
    // The visibleOnFullScreen option is key for staying above fullscreen apps
    hudWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // Re-apply the setting after window is shown to ensure it sticks
    hudWindow.once('show', () => {
      hudWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    });
  }
  
  // Adjust window size to fit content after load
  const resizeToContent = () => {
    return hudWindow.webContents.executeJavaScript(`
      // Ensure body/html are transparent
      document.body.style.backgroundColor = 'transparent';
      document.documentElement.style.backgroundColor = 'transparent';
      const root = document.getElementById('root');
      if (root) {
        root.style.backgroundColor = 'transparent';
        root.style.width = 'fit-content';
        root.style.height = 'fit-content';
      }
      
      // Find the CompactHud component (the actual HUD content)
      const hudElement = document.querySelector('.rounded-2xl.border.border-gray-800\\/70');
      if (hudElement) {
        const rect = hudElement.getBoundingClientRect();
        return { 
          width: Math.ceil(rect.width), 
          height: Math.ceil(rect.height),
          x: Math.ceil(rect.left),
          y: Math.ceil(rect.top)
        };
      }
      // Fallback: try alternate selector
      const altElement = document.querySelector('.rounded-2xl.border');
      if (altElement) {
        const rect = altElement.getBoundingClientRect();
        return { 
          width: Math.ceil(rect.width), 
          height: Math.ceil(rect.height),
          x: Math.ceil(rect.left),
          y: Math.ceil(rect.top)
        };
      }
      // Fallback to body content
      const body = document.body;
      if (body) {
        const rect = body.getBoundingClientRect();
        return { 
          width: Math.ceil(rect.width), 
          height: Math.ceil(rect.height)
        };
      }
      return null;
    `).then((size) => {
      if (size && size.width && size.height) {
        // Set window size to exactly match content
        hudWindow.setSize(size.width, size.height);
        // Optionally adjust position if content is offset
        if (size.x !== undefined && size.y !== undefined && (size.x > 0 || size.y > 0)) {
          const [currentX, currentY] = hudWindow.getPosition();
          hudWindow.setPosition(currentX - size.x, currentY - size.y);
        }
        return true;
      }
      return false;
    }).catch((error) => {
      console.error('Failed to auto-resize HUD window:', error);
      return false;
    });
  };
  
  // Resize before showing the window to avoid white background flash
  hudWindow.webContents.once('did-finish-load', () => {
    // Show window first (with larger initial size) to allow React to render
    hudWindow.show();
    
    // Resize after React has rendered (multiple attempts to catch all render cycles)
    setTimeout(() => {
      resizeToContent();
    }, 100);
    setTimeout(() => {
      resizeToContent();
    }, 300);
    setTimeout(() => {
      resizeToContent();
    }, 600); // Extra delay to ensure opacity slider and all content is rendered
  });
  
  // Also resize when content updates (e.g., when HUD expands/collapses)
  hudWindow.webContents.on('dom-ready', () => {
    resizeToContent();
  });
  
  hudWindow.on('closed', () => {
    hudWindow = null;
  });
  
  // Make window draggable (user can move it)
  hudWindow.setIgnoreMouseEvents(false);
}

// Set app name to "Ghost" instead of "Electron"
// This automatically sets the dock name on macOS and window titles
app.setName('Ghost');

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for audio device management (future: stealth routing)
ipcMain.handle('get-audio-devices', async () => {
  // TODO: Implement OS-level audio device enumeration
  // This will be used for selecting headphones vs system output
  return { input: [], output: [] };
});

ipcMain.handle('set-audio-output', async (_, deviceId) => {
  // TODO: Implement OS-level audio routing
  // Route AI TTS to specified device (headphones only)
  return { success: true };
});

// HUD window controls
ipcMain.on('close-hud-window', () => {
  if (hudWindow) {
    hudWindow.close();
    hudWindow = null;
  }
});

ipcMain.on('minimize-hud-window', () => {
  if (hudWindow) {
    hudWindow.minimize();
  }
});

ipcMain.on('set-hud-opacity', (_, opacity) => {
  if (hudWindow && typeof opacity === 'number' && opacity >= 0 && opacity <= 1) {
    hudWindow.setOpacity(opacity);
  }
});

ipcMain.on('set-hud-position', (_, x, y) => {
  if (hudWindow && typeof x === 'number' && typeof y === 'number') {
    hudWindow.setPosition(Math.round(x), Math.round(y));
  }
});

ipcMain.on('set-hud-size', (_, width, height) => {
  if (hudWindow && typeof width === 'number' && typeof height === 'number') {
    hudWindow.setSize(Math.ceil(width), Math.ceil(height));
  }
});

ipcMain.on('open-main-app', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
});

// Reopen HUD window if it was closed
ipcMain.on('reopen-hud-window', () => {
  if (!hudWindow || hudWindow.isDestroyed()) {
    createHudWindow();
  } else {
    // If window exists but is minimized or hidden, show it
    hudWindow.show();
    hudWindow.focus();
  }
});

// Handle app protocol for deep links (future: invite codes, magic links)
app.setAsDefaultProtocolClient('ghost');

