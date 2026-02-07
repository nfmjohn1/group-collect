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

// Copy icons to dist/icons/
const iconsDir = path.resolve(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Find the actual icon files (they may be nested)
const findIcons = (dir) => {
  const iconFiles = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      iconFiles.push(...findIcons(fullPath));
    } else if (file.name.match(/^icon(16|48|128)\.png$/)) {
      iconFiles.push(fullPath);
    }
  }
  return iconFiles;
};

// Look for icons in extension/public or dist
const publicIconsDir = path.resolve(__dirname, '../extension/public/icons');
const distIconsDir = path.resolve(distDir, 'icons');

let iconsCopied = false;

// Try to find and copy icons
if (fs.existsSync(publicIconsDir)) {
  const foundIcons = findIcons(publicIconsDir);
  for (const iconPath of foundIcons) {
    const iconName = path.basename(iconPath);
    const destPath = path.resolve(iconsDir, iconName);
    fs.copyFileSync(iconPath, destPath);
    iconsCopied = true;
  }
}

if (!iconsCopied && fs.existsSync(distIconsDir)) {
  const foundIcons = findIcons(distIconsDir);
  for (const iconPath of foundIcons) {
    const iconName = path.basename(iconPath);
    if (iconPath !== path.resolve(iconsDir, iconName)) {
      const destPath = path.resolve(iconsDir, iconName);
      fs.copyFileSync(iconPath, destPath);
      iconsCopied = true;
    }
  }
}

if (iconsCopied) {
  console.log('✓ Copied icons to dist/icons/');
} else {
  console.log('⚠ Warning: No icons found, creating placeholder icons');
  // Create simple placeholder icons
  const { createCanvas } = await import('canvas').catch(() => null);
  if (!createCanvas) {
    console.log('  (Install canvas package for auto-generated icons: npm install canvas)');
  }
}

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
