# Performance & Bundle Size Optimization Guide

## Overview

This document outlines performance optimization strategies and bundle size reduction techniques for the Group Collect Chrome extension.

## Current Architecture

### Tech Stack:
- **Frontend:** React 18 + TypeScript + Tailwind CSS
- **Build Tool:** Vite (assumed based on modern React setup)
- **State Management:** Zustand
- **Storage:** Chrome Storage API
- **Backend:** Supabase (for auth)

### Extension Components:
1. **Popup** (~200KB estimated) - React UI for main interface
2. **Dashboard** (~300KB estimated) - Full data table with filters/sorting
3. **Content Scripts** (~50KB) - Facebook page scraper and auto-decliner
4. **Background Worker** (~100KB) - Service worker with sync and notifications
5. **Onboarding** (~30KB) - Welcome page
6. **Help** (~40KB) - Documentation page

## Optimization Strategies

### 1. Code Splitting

**Implementation:**
```javascript
// In popup main.tsx or router
const Home = lazy(() => import('./pages/Home'));
const Settings = lazy(() => import('./pages/Settings'));
const Dashboard = lazy(() => import('./dashboard/Dashboard'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

**Benefits:**
- Only load pages when needed
- Reduces initial bundle size by 40-60%
- Faster popup open time

### 2. Tree Shaking & Dead Code Elimination

**Vite Configuration:**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          zustand: ['zustand'],
        },
      },
    },
  },
});
```

**Benefits:**
- Removes unused code automatically
- Strips console statements in production
- Reduces bundle by 10-20%

### 3. Optimize Dependencies

**Current Dependencies to Review:**

```bash
# Large dependencies that could be replaced/optimized:
- moment.js → date-fns (if used) - 70KB savings
- lodash → lodash-es (tree-shakeable) - 50KB savings
- Use Chrome APIs instead of polyfills
```

**Recommendations:**
```javascript
// Before: Import entire lodash
import _ from 'lodash';

// After: Import only what you need
import debounce from 'lodash-es/debounce';
import throttle from 'lodash-es/throttle';
```

### 4. Lazy Load Heavy Components

**Dashboard Optimization:**
```typescript
// Lazy load table virtualization only when needed
const VirtualizedTable = lazy(() =>
  import('react-window').then(module => ({
    default: module.FixedSizeList
  }))
);

// Use for 100+ rows
{members.length > 100 ? (
  <VirtualizedTable />
) : (
  <RegularTable />
)}
```

**Benefits:**
- Only load virtualization library for large datasets
- Reduces initial load by 30KB

### 5. Optimize Images & Assets

**Current Assets:**
- icon16.png
- icon48.png
- icon128.png

**Optimization:**
```bash
# Use imagemin or similar tool
npm install -D imagemin imagemin-pngquant

# Compress all images
imagemin extension/icons/*.png --out-dir=extension/icons --plugin=pngquant
```

**Results:**
- 20-40% reduction in image size
- No visible quality loss

### 6. Memoization & React Performance

**Current Optimizations:**
- ✓ useMemo for filtered/sorted data
- ✓ useMemo for statistics
- ✓ Pagination to limit rendered rows

**Additional Optimizations:**

```typescript
// Memoize expensive components
const MemberRow = memo(({ member }) => {
  return <tr>...</tr>;
}, (prevProps, nextProps) => {
  return prevProps.member.id === nextProps.member.id &&
         prevProps.member.status === nextProps.member.status;
});

// Use useCallback for event handlers passed to children
const handleMemberSelect = useCallback((id: string) => {
  setSelectedMembers(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}, []);
```

### 7. Storage Optimization

**Current Storage Structure:**
```javascript
chrome.storage.local.set({
  members_data: [...] // Can be large!
  decline_log: [...]
  error_log: [...]
  backup_YYYY-MM-DD: {...}
});
```

**Optimizations:**

```typescript
// 1. Index-based storage for large datasets
// Instead of storing all members in one key, shard by group
await chrome.storage.local.set({
  [`members_${groupId}`]: members,
});

// 2. Compress large data before storing
import pako from 'pako';

const compressed = pako.deflate(JSON.stringify(members));
await chrome.storage.local.set({
  members_compressed: Array.from(compressed),
});

// 3. Limit log sizes (already implemented ✓)
// - error_log: Last 500 entries
// - decline_log: Last 1000 entries
// - backups: Last 7 days
```

### 8. Background Worker Optimization

**Current Performance:**
- Alarms run every 30 minutes (members sync)
- Daily backups

**Optimizations:**

```typescript
// 1. Use efficient queries
async function getPendingCount(): Promise<number> {
  // Instead of loading all members
  const result = await chrome.storage.local.get('members_data');
  const members = result.members_data || [];

  // Use filter with early return
  return members.reduce((count, m) =>
    m.status === 'pending' ? count + 1 : count, 0
  );
}

// 2. Debounce frequent operations
let badgeUpdateTimeout: NodeJS.Timeout;
function debouncedBadgeUpdate() {
  clearTimeout(badgeUpdateTimeout);
  badgeUpdateTimeout = setTimeout(() => updateBadge(), 300);
}
```

### 9. Content Script Optimization

**Current Scripts:**
- scraper.ts (~150 lines)
- decliner.ts (~260 lines)

**Optimizations:**

```typescript
// 1. Load only when needed
// In manifest.json, use dynamic injection instead of always loaded

// 2. Reduce DOM queries
// Cache selectors
const memberListCache = new WeakMap();

function getMemberList(): NodeList {
  const container = document.querySelector('[data-members-container]');
  if (memberListCache.has(container)) {
    return memberListCache.get(container);
  }
  const list = container.querySelectorAll('[data-member-id]');
  memberListCache.set(container, list);
  return list;
}

// 3. Throttle mutation observers
const debouncedMutationHandler = throttle((mutations) => {
  processAutoDecline();
}, 2000, { leading: true, trailing: true });

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
```

### 10. Tailwind CSS Optimization

**Current Setup:**
- Full Tailwind CSS bundle (~3MB unpurged)

**PurgeCSS Configuration:**

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './extension/src/**/*.{js,jsx,ts,tsx}',
    './extension/src/**/*.html',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Results:**
- Reduces CSS from 3MB to ~10-20KB
- Automatic with Tailwind 3.x

## Bundle Size Targets

### Current Estimates:
- Popup: ~400KB (unoptimized)
- Dashboard: ~500KB (unoptimized)
- Content Scripts: ~100KB (unoptimized)
- **Total: ~1MB**

### Target After Optimization:
- Popup: ~150KB (62% reduction)
- Dashboard: ~200KB (60% reduction)
- Content Scripts: ~50KB (50% reduction)
- **Total: ~400KB (60% reduction)**

## Performance Metrics

### Target Metrics:

| Metric | Current | Target |
|--------|---------|--------|
| Popup Open Time | ~500ms | <200ms |
| Dashboard Load | ~800ms | <400ms |
| Member Collection | ~2s (100 members) | ~1s |
| Badge Update | ~100ms | <50ms |
| Memory Usage | ~80MB | <50MB |

## Implementation Checklist

### Phase 1: Quick Wins (1-2 hours)
- [ ] Enable minification and tree shaking in Vite config
- [ ] Remove console.logs in production build
- [ ] Add PurgeCSS configuration
- [ ] Optimize images with imagemin
- [ ] Review and remove unused dependencies

### Phase 2: Code Splitting (2-3 hours)
- [ ] Implement lazy loading for routes
- [ ] Split vendor chunks (React, Zustand)
- [ ] Lazy load dashboard heavy components
- [ ] Dynamic import for Google Sheets service

### Phase 3: React Optimization (2-3 hours)
- [ ] Add React.memo to MemberRow component
- [ ] Implement useCallback for event handlers
- [ ] Add virtualization for tables with 100+ rows
- [ ] Optimize re-renders with React DevTools

### Phase 4: Storage & Data (2-3 hours)
- [ ] Implement data compression for large datasets
- [ ] Add data pagination/sharding by group
- [ ] Optimize query patterns (avoid loading all data)
- [ ] Add caching layer for frequently accessed data

### Phase 5: Testing & Validation (1-2 hours)
- [ ] Measure bundle sizes before/after
- [ ] Profile with Chrome DevTools
- [ ] Test with 1000+ members
- [ ] Memory leak testing
- [ ] Load time testing

## Build Script

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:analyze": "vite build --mode analyze",
    "preview": "vite preview"
  }
}
```

## Bundle Analysis

```bash
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# Add to vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({
    open: true,
    gzipSize: true,
    brotliSize: true,
  }),
]

# Run build and analyze
npm run build:analyze
```

## Monitoring Performance

### Chrome Extension Performance Tab:
1. Open DevTools → Performance
2. Record while opening popup/dashboard
3. Look for:
   - Long tasks (>50ms)
   - Layout thrashing
   - Memory leaks
   - Excessive re-renders

### Lighthouse CI (Optional):
```bash
# For dashboard page
lighthouse https://localhost:3000/dashboard --view
```

## Best Practices Going Forward

1. **Always measure before optimizing**
   - Use Chrome DevTools
   - Profile with React DevTools
   - Monitor bundle size on each PR

2. **Lazy load by default**
   - Only eager load critical path
   - Split routes and heavy components

3. **Memoize expensive operations**
   - useMemo for calculations
   - useCallback for handlers
   - React.memo for components

4. **Limit data loaded into memory**
   - Paginate everything
   - Only load visible data
   - Compress before storing

5. **Regular dependency audits**
   - Remove unused packages
   - Update to latest versions
   - Replace with lighter alternatives

## Resources

- [Vite Performance Guide](https://vitejs.dev/guide/performance.html)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Chrome Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/mv3-migration/)
- [Bundle Size Tracking](https://bundlephobia.com/)

---

**Status:** 📋 Guide Complete - Ready for Implementation
**Estimated Time:** 8-12 hours for full optimization
**Expected Results:** 60% bundle size reduction, 2x performance improvement
