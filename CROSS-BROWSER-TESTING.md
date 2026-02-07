# Cross-Browser Testing Preparation Guide

## Overview

This document outlines the preparation steps, compatibility considerations, and testing procedures for deploying Group Collect across multiple browsers.

## Target Browsers

### Primary:
- ✅ **Chrome** (v88+) - Primary development target
- 🔄 **Edge** (v88+) - Chromium-based, high compatibility
- 🔄 **Brave** (v1.20+) - Chromium-based, privacy-focused
- 🔄 **Opera** (v74+) - Chromium-based

### Secondary:
- ⚠️ **Firefox** (v109+) - Requires manifest conversion
- ⚠️ **Safari** (v15.4+) - Requires Safari Web Extension format

## Browser API Compatibility

### Chrome Storage API
```typescript
// ✅ Chrome, Edge, Brave, Opera
chrome.storage.local.get(...)
chrome.storage.local.set(...)

// ⚠️ Firefox - Use browser namespace (auto-polyfilled by webextension-polyfill)
browser.storage.local.get(...)
```

### Identity API (Google OAuth)
```typescript
// ✅ Chrome, Edge, Opera
chrome.identity.getAuthToken(...)

// ❌ Brave - Requires different OAuth flow (built-in wallet)
// ❌ Firefox - No chrome.identity API, use OAuth redirect
// ❌ Safari - No chrome.identity API, use OAuth redirect
```

### Notifications API
```typescript
// ✅ All browsers support basic notifications
chrome.notifications.create(...)
browser.notifications.create(...) // Firefox

// ⚠️ Safari - Limited notification features
```

### Alarms API
```typescript
// ✅ Chrome, Edge, Brave, Opera, Firefox
chrome.alarms.create(...)
chrome.alarms.onAlarm.addListener(...)

// ⚠️ Safari - Alarms API available but limited
```

## Manifest V3 Compatibility

### Manifest Differences

**Chrome/Edge/Brave/Opera:**
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "src/background/index.ts"
  },
  "host_permissions": [
    "https://www.facebook.com/*"
  ]
}
```

**Firefox (Manifest V2 → V3 transition):**
```json
{
  "manifest_version": 3,
  "background": {
    "scripts": ["src/background/index.ts"]
  },
  "permissions": [
    "https://www.facebook.com/*"
  ]
}
```

**Safari:**
```json
{
  "manifest_version": 2,
  "background": {
    "scripts": ["src/background/index.js"],
    "persistent": false
  },
  "permissions": [
    "https://www.facebook.com/*"
  ]
}
```

## Browser-Specific Polyfills

### WebExtension Polyfill

**Installation:**
```bash
npm install webextension-polyfill
npm install -D @types/webextension-polyfill
```

**Usage:**
```typescript
// Before (Chrome-specific)
chrome.storage.local.get(...)

// After (Cross-browser)
import browser from 'webextension-polyfill';
browser.storage.local.get(...)
```

**Replace all instances:**
- `chrome.storage` → `browser.storage`
- `chrome.runtime` → `browser.runtime`
- `chrome.tabs` → `browser.tabs`
- `chrome.notifications` → `browser.notifications`
- `chrome.alarms` → `browser.alarms`

### Browser Detection

```typescript
// utils/browser.ts
export function getBrowser(): 'chrome' | 'firefox' | 'safari' | 'edge' | 'brave' | 'opera' {
  const ua = navigator.userAgent;

  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Brave/') || (navigator as any).brave) return 'brave';
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'opera';
  if (ua.includes('Firefox/')) return 'firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'safari';
  if (ua.includes('Chrome/')) return 'chrome';

  return 'chrome'; // default
}

export function isChromiumBased(): boolean {
  return ['chrome', 'edge', 'brave', 'opera'].includes(getBrowser());
}

export function supportsIdentityAPI(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.identity;
}
```

## Google Sheets Integration - Cross-Browser

### OAuth Flow Alternatives

**Chrome/Edge/Brave/Opera:**
```typescript
// Use chrome.identity.getAuthToken
async function authenticateChromeIdentity() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(token);
    });
  });
}
```

**Firefox/Safari (OAuth Redirect):**
```typescript
// Use OAuth 2.0 redirect flow
async function authenticateOAuthRedirect() {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
    client_id=${CLIENT_ID}&
    redirect_uri=${REDIRECT_URI}&
    response_type=token&
    scope=https://www.googleapis.com/auth/spreadsheets`;

  // Open popup for OAuth
  const authWindow = window.open(authUrl, '_blank', 'width=500,height=600');

  // Listen for callback
  return new Promise((resolve, reject) => {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'OAUTH_CALLBACK') {
        resolve(event.data.token);
        authWindow?.close();
      }
    });
  });
}

// Unified function
export async function authenticate() {
  if (supportsIdentityAPI()) {
    return authenticateChromeIdentity();
  } else {
    return authenticateOAuthRedirect();
  }
}
```

## Content Script Compatibility

### Facebook DOM Selectors

**Current selectors work across all browsers** since they're DOM-based, not browser API-based.

**Potential Issues:**
- CSS selector differences (rare)
- `MutationObserver` performance (Firefox can be slower)
- Event listener compatibility (generally good)

**Testing Required:**
```typescript
// Test these selectors in each browser:
const selectors = [
  '[data-member-id]',
  '[aria-label*="Decline"]',
  'button[data-testid*="decline"]',
];
```

## Build System for Multiple Browsers

### Vite Multi-Browser Build

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';

const browsers = ['chrome', 'firefox', 'safari'];

export default defineConfig(({ mode }) => {
  const targetBrowser = process.env.BROWSER || 'chrome';

  return {
    build: {
      outDir: `dist/${targetBrowser}`,
      rollupOptions: {
        input: {
          popup: 'src/popup/index.html',
          dashboard: 'src/dashboard/index.html',
          onboarding: 'src/onboarding/onboarding.html',
          help: 'src/help/help.html',
          background: 'src/background/index.ts',
          scraper: 'src/content/scraper.ts',
          decliner: 'src/content/decliner.ts',
        },
      },
    },
    define: {
      __BROWSER__: JSON.stringify(targetBrowser),
    },
  };
});
```

**Build Scripts:**
```json
{
  "scripts": {
    "build:chrome": "BROWSER=chrome vite build",
    "build:firefox": "BROWSER=firefox vite build",
    "build:safari": "BROWSER=safari vite build",
    "build:edge": "BROWSER=edge vite build",
    "build:all": "npm run build:chrome && npm run build:firefox && npm run build:safari"
  }
}
```

### Manifest Generation

**manifest-generator.js:**
```javascript
const fs = require('fs');
const path = require('path');

const baseManifest = require('./manifest.base.json');

const browserManifests = {
  chrome: {
    manifest_version: 3,
    background: {
      service_worker: 'background.js',
    },
    host_permissions: ['https://www.facebook.com/*'],
  },
  firefox: {
    manifest_version: 3,
    background: {
      scripts: ['background.js'],
    },
    permissions: ['https://www.facebook.com/*'],
    browser_specific_settings: {
      gecko: {
        id: 'group-collect@example.com',
        strict_min_version: '109.0',
      },
    },
  },
  safari: {
    manifest_version: 2,
    background: {
      scripts: ['background.js'],
      persistent: false,
    },
    permissions: ['https://www.facebook.com/*'],
  },
};

// Generate browser-specific manifests
Object.keys(browserManifests).forEach((browser) => {
  const manifest = {
    ...baseManifest,
    ...browserManifests[browser],
  };

  fs.writeFileSync(
    path.join(__dirname, `dist/${browser}/manifest.json`),
    JSON.stringify(manifest, null, 2)
  );
});
```

## Testing Strategy

### Automated Testing

**Test Suite Structure:**
```
tests/
├── unit/           # Unit tests (Jest)
├── integration/    # Integration tests (Vitest)
├── e2e/           # End-to-end tests (Playwright)
└── cross-browser/ # Browser-specific tests
```

**Playwright Configuration:**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### Manual Testing Checklist

#### Chrome/Edge/Brave/Opera (Per Browser):
- [ ] Install extension from local build
- [ ] Open popup - verify UI renders
- [ ] Navigate to Facebook group members page
- [ ] Click "Collect Members" - verify data collection
- [ ] Open dashboard - verify data display
- [ ] Test sorting, filtering, pagination
- [ ] Test Google Sheets export (Chrome Identity API)
- [ ] Test auto-decline feature
- [ ] Verify notifications appear
- [ ] Check badge count updates
- [ ] Test backup/restore functionality
- [ ] Verify error logging
- [ ] Check onboarding page on first install

#### Firefox-Specific:
- [ ] Install extension (use about:debugging)
- [ ] Verify webextension-polyfill works
- [ ] Test OAuth redirect flow (if Identity API not used)
- [ ] Verify MutationObserver performance
- [ ] Test storage.local limits (Firefox has lower limits)
- [ ] Verify notification permissions
- [ ] Test alarm API

#### Safari-Specific:
- [ ] Convert extension with Safari Web Extension Converter
- [ ] Test on macOS Safari 15.4+
- [ ] Verify content script injection
- [ ] Test limited notification features
- [ ] Verify OAuth redirect flow
- [ ] Test storage quota limits
- [ ] Check alarm API compatibility

### Browser-Specific Issues to Watch For

**Chrome:**
- ✅ Full feature support
- ✅ Identity API for Google OAuth

**Edge:**
- ✅ Near-identical to Chrome
- ⚠️ May require Microsoft Store listing

**Brave:**
- ⚠️ Shields may block some functionality
- ⚠️ Different privacy settings than Chrome
- ❌ Identity API may be blocked

**Opera:**
- ✅ Chromium-based, high compatibility
- ⚠️ May require Opera Addons listing

**Firefox:**
- ⚠️ No chrome.identity API (use OAuth redirect)
- ⚠️ Lower storage.local quota (5MB vs 10MB)
- ⚠️ Slower MutationObserver in some cases
- ⚠️ Requires browser namespace instead of chrome

**Safari:**
- ⚠️ Manifest V2 only (as of Safari 16)
- ⚠️ No chrome.identity API
- ⚠️ Limited notification features
- ⚠️ Requires Xcode conversion process
- ⚠️ Different storage limits

## Storage Limits by Browser

| Browser | storage.local | storage.sync |
|---------|---------------|--------------|
| Chrome  | 10 MB        | 100 KB       |
| Firefox | 5 MB         | 100 KB       |
| Edge    | 10 MB        | 100 KB       |
| Safari  | 5 MB         | 100 KB       |

**Mitigation:**
- Implement data compression
- Paginate stored data
- Clean old entries regularly

## Distribution Channels

### Chrome Web Store
- Upload: [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- Review time: 1-3 days
- Fee: $5 one-time

### Microsoft Edge Add-ons
- Upload: [Edge Partner Center](https://partner.microsoft.com/dashboard/microsoftedge)
- Review time: 1-2 days
- Fee: Free

### Firefox Add-ons
- Upload: [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
- Review time: 1-7 days
- Fee: Free

### Opera Add-ons
- Upload: [Opera Addons](https://addons.opera.com/developer/)
- Review time: 1-3 days
- Fee: Free

### Safari Extensions Gallery (Mac App Store)
- Upload: Via App Store Connect
- Review time: 2-7 days
- Fee: $99/year Apple Developer account

## Implementation Plan

### Phase 1: Polyfill Integration (1-2 hours)
1. Install webextension-polyfill
2. Replace all chrome.* calls with browser.*
3. Add browser detection utility
4. Test in Chrome (should work identically)

### Phase 2: OAuth Abstraction (2-3 hours)
1. Create authentication abstraction layer
2. Implement OAuth redirect flow
3. Add fallback for browsers without Identity API
4. Test in Firefox

### Phase 3: Build System (2-3 hours)
1. Set up multi-browser build configuration
2. Create manifest generator script
3. Add browser-specific build scripts
4. Test builds for Chrome, Firefox, Edge

### Phase 4: Testing (4-6 hours)
1. Manual testing in Chrome, Edge, Brave, Opera
2. Manual testing in Firefox
3. Document browser-specific issues
4. Fix critical compatibility bugs

### Phase 5: Safari Support (Optional, 6-8 hours)
1. Convert extension with Xcode
2. Update manifest to V2
3. Implement OAuth redirect
4. Test on macOS Safari

### Phase 6: Distribution (2-3 hours per store)
1. Prepare store listings (descriptions, screenshots)
2. Submit to Chrome Web Store
3. Submit to Edge Add-ons
4. Submit to Firefox Add-ons
5. Submit to Opera Add-ons

## Testing Matrix

| Feature | Chrome | Edge | Brave | Opera | Firefox | Safari |
|---------|--------|------|-------|-------|---------|--------|
| Popup UI | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |
| Data Collection | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |
| Dashboard | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |
| Google Sheets | ✅ | 🔄 | ⚠️ | 🔄 | ⚠️ | ⚠️ |
| Auto-Decline | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |
| Notifications | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |
| Alarms | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |
| Backup/Restore | ✅ | 🔄 | 🔄 | 🔄 | 🔄 | ⚠️ |

Legend:
- ✅ Tested and working
- 🔄 Not yet tested
- ⚠️ Known issues / requires workaround
- ❌ Not supported

## Resources

- [WebExtension Polyfill](https://github.com/mozilla/webextension-polyfill)
- [Browser Extension Guide](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/reference/)
- [Firefox Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
- [Safari Web Extensions](https://developer.apple.com/documentation/safariservices/safari_web_extensions)

---

**Status:** 📋 Guide Complete - Ready for Implementation
**Priority:** Chromium browsers first (Chrome, Edge, Brave, Opera), then Firefox
**Estimated Time:** 10-15 hours for full cross-browser support
