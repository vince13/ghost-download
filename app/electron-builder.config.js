export default {
  appId: 'com.ghost.protocol',
  productName: 'Ghost Protocol',
  directories: {
    output: 'dist-electron'
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json'
  ],
  mac: {
    category: 'public.app-category.productivity',
    target: ['dmg', 'zip'], // Both DMG (installer) and ZIP (portable)
    icon: 'build/icon.icns', // Optional - will use default Electron icon if not found
    hardenedRuntime: false, // Disable for now to avoid code signing requirements
    gatekeeperAssess: false
  },
  win: {
    target: ['nsis', 'portable'],
    icon: 'build/icon.ico'
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'build/icon.png',
    category: 'Office'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  }
};

