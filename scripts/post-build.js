import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, '../dist');

// Copy manifest.json to dist
const manifestSrc = path.resolve(__dirname, '../extension/manifest.json');
const manifestDest = path.resolve(distDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);
console.log('✓ Copied manifest.json to dist/');

// Move HTML files to root of dist
const popupHtmlSrc = path.resolve(distDir, 'extension/src/popup/index.html');
const popupHtmlDest = path.resolve(distDir, 'popup.html');
if (fs.existsSync(popupHtmlSrc)) {
  fs.copyFileSync(popupHtmlSrc, popupHtmlDest);
  console.log('✓ Moved popup.html to dist/');
}

const dashboardHtmlSrc = path.resolve(distDir, 'extension/src/dashboard/index.html');
const dashboardHtmlDest = path.resolve(distDir, 'dashboard.html');
if (fs.existsSync(dashboardHtmlSrc)) {
  fs.copyFileSync(dashboardHtmlSrc, dashboardHtmlDest);
  console.log('✓ Moved dashboard.html to dist/');
}

// Clean up nested extension folder
const extensionDir = path.resolve(distDir, 'extension');
if (fs.existsSync(extensionDir)) {
  fs.rmSync(extensionDir, { recursive: true });
  console.log('✓ Cleaned up extension directory');
}

console.log('\n✅ Build completed successfully!');
console.log('📦 Extension ready in dist/ directory');
console.log('🚀 Load the extension in Chrome:');
console.log('   1. Open chrome://extensions/');
console.log('   2. Enable "Developer mode"');
console.log('   3. Click "Load unpacked"');
console.log('   4. Select the dist/ folder');
