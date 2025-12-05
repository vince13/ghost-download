#!/usr/bin/env node

/**
 * Script to copy Electron build files to landing/public/downloads/
 * Usage: node scripts/copy-downloads.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(PROJECT_ROOT, 'electron-app');
const LANDING_DOWNLOADS = path.join(PROJECT_ROOT, 'public', 'downloads');

// Check both possible output directories (electron-builder config says 'dist-electron' but may output to 'dist')
const DIST_ELECTRON = fs.existsSync(path.join(APP_DIR, 'dist-electron')) 
  ? path.join(APP_DIR, 'dist-electron')
  : path.join(APP_DIR, 'dist');

console.log('📦 Copying Electron build files to public/downloads/...\n');

// Check if build directory exists
if (!fs.existsSync(DIST_ELECTRON)) {
  console.error(`❌ Error: Build directory does not exist: ${DIST_ELECTRON}`);
  console.error('   Please build the Electron app first:');
  console.error('   cd electron-app && npm run electron:build');
  process.exit(1);
}

console.log(`📂 Looking for build files in: ${DIST_ELECTRON}\n`);

// Create downloads directory if it doesn't exist
if (!fs.existsSync(LANDING_DOWNLOADS)) {
  fs.mkdirSync(LANDING_DOWNLOADS, { recursive: true });
  console.log('📁 Created public/downloads/ directory');
}

// Get all files in dist-electron
const files = fs.readdirSync(DIST_ELECTRON);

// Filter and copy build files
const patterns = {
  mac: ['.dmg', 'mac.zip'],
  win: ['.exe'],
  linux: ['.AppImage', '.deb']
};

let copiedCount = 0;

files.forEach(file => {
  const sourcePath = path.join(DIST_ELECTRON, file);
  const destPath = path.join(LANDING_DOWNLOADS, file);
  
  // Check if it's a build file (not a directory)
  const stat = fs.statSync(sourcePath);
  if (stat.isFile()) {
    // Check if it matches any pattern
    const isBuildFile = 
      file.endsWith('.dmg') ||
      file.includes('mac.zip') ||
      file.endsWith('.exe') ||
      file.endsWith('.AppImage') ||
      file.endsWith('.deb');
    
    if (isBuildFile) {
      // Skip .blockmap files (not needed for downloads)
      if (file.endsWith('.blockmap')) {
        return;
      }
      
      fs.copyFileSync(sourcePath, destPath);
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ Copied: ${file} (${sizeMB} MB)`);
      copiedCount++;
    }
  }
});

if (copiedCount === 0) {
  console.log('⚠️  No build files found in dist-electron/');
  console.log('   Make sure you have built the Electron app.');
} else {
  console.log(`\n✅ Done! Copied ${copiedCount} file(s) to public/downloads/`);
  console.log('\n💡 Next steps:');
  console.log('   1. Commit the files: git add public/downloads/');
  console.log('   2. Deploy to Vercel: vercel --prod');
  console.log('   3. Files will be available at: https://your-domain.com/downloads/[filename]');
}

