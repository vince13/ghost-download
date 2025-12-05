const asar = require('asar');
const path = require('path');

try {
  const asarPath = path.join(__dirname, 'dist/mac-arm64/Ghost Protocol.app/Contents/Resources/app.asar');
  const files = asar.listPackage(asarPath);
  console.log('Files in app.asar:');
  files.filter(f => f.includes('index.html') || f.includes('dist/')).slice(0, 20).forEach(f => console.log('  ', f));
} catch (e) {
  console.log('Could not read asar (need asar package):', e.message);
  console.log('Checking if app.asar exists...');
  const fs = require('fs');
  const asarPath = path.join(__dirname, 'dist/mac-arm64/Ghost Protocol.app/Contents/Resources/app.asar');
  if (fs.existsSync(asarPath)) {
    console.log('✅ app.asar exists at:', asarPath);
  } else {
    console.log('❌ app.asar not found');
  }
}
