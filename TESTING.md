# Testing Guide - Phase 1

## Quick Start

### 1. Load the Extension

1. Build the extension:
   ```bash
   npm run build
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top-right corner)

4. Click "Load unpacked" button

5. Navigate to and select the `dist/` folder

6. The extension should now appear in your extensions list

### 2. Verify Installation

- You should see "Group Collect" in the extensions list
- Click the extension icon in the toolbar to open the popup
- The popup should show:
  - "Group Collect" header with green shield icon
  - Home and Settings tabs
  - Stats showing "0 Members Captured"
  - Export CSV and Refresh buttons
  - Empty state message

### 3. Test on Facebook

1. Log into Facebook

2. Navigate to a Facebook Group where you're an admin

3. Go to the Member Requests page:
   - Click "Admin tools" or "Manage"
   - Click "Member requests"
   - URL should contain `/groups/[group-id]/member-requests`

4. **Expected Result**: A dark bar with the Group Collect branding should appear at the top of the page

### 4. Test UI Injection

**The injected bar should show:**
- Green shield icon on the left
- "Group Collect Active" title
- "0 members captured" subtitle
- "View Data" button
- Minimize/expand button

**Test interactions:**
- Click the minimize button → bar should slide up
- Click again → bar should slide back down
- Click "View Data" → should attempt to open popup (may need implementation)

### 5. Test Popup Functionality

**Home Tab:**
- Shows member count (0 initially)
- Export CSV button (shows alert when no data)
- Refresh button (reloads data from storage)
- Empty state with helpful message

**Settings Tab:**
- Google Sheet URL input field
- Save Settings button
- About section showing version and status

### 6. Test Data Persistence

1. Open the popup
2. Go to Settings tab
3. Enter a Google Sheet URL: `https://docs.google.com/spreadsheets/d/test123`
4. Click "Save Settings"
5. Button should show "✓ Saved" briefly
6. Close and reopen the popup
7. Settings tab should still show your saved URL

## Debugging

### Console Logs

The extension logs messages with the prefix `[Group Collect]` or `[Background]`.

**To view logs:**

1. **Content Script Logs** (Facebook page):
   - Right-click on the Facebook page → Inspect
   - Go to Console tab
   - Look for `[Group Collect]` messages

2. **Background Script Logs**:
   - Go to `chrome://extensions/`
   - Find Group Collect
   - Click "service worker" link under the extension
   - Console opens with background script logs

3. **Popup Logs**:
   - Right-click on the popup → Inspect
   - Console tab shows popup logs

### Common Issues

#### Extension doesn't appear in toolbar
- Make sure it's enabled in `chrome://extensions/`
- Check for any errors in the extensions page

#### UI bar doesn't inject
- Check the URL pattern - must contain `/groups/*/member-requests`
- Check console for errors
- Refresh the Facebook page

#### Popup shows blank screen
- Check popup console for React errors
- Rebuild: `npm run build`
- Reload extension in `chrome://extensions/`

#### Changes not appearing
- Always reload the extension after rebuilding
- Hard refresh the Facebook page (Cmd+Shift+R / Ctrl+Shift+F5)

### Expected Console Messages

**When navigating to member requests page:**
```
[Group Collect] Content script initialized
[Group Collect] Member requests page detected!
[Background] Received message: PAGE_DETECTED
[Background] Facebook member requests page detected
[Group Collect] Injecting UI...
[Group Collect] UI injected successfully
```

**When opening popup:**
```
[Background] Received message: GET_DATA
```

## Phase 1 Completion Checklist

- [x] Extension loads without errors
- [x] Popup opens and renders correctly
- [x] UI bar injects on Facebook member requests pages
- [x] Settings can be saved and persist
- [x] Chrome storage works correctly
- [x] Message passing between scripts works
- [x] All console logs appear as expected
- [x] No TypeScript compilation errors
- [x] UI matches Robinhood design aesthetic

## Next Phase Preview

**Phase 2 will add:**
- Actual member data scraping from Facebook DOM
- Capture button functionality
- Real-time member count updates
- Member data display in popup

---

**Current Status**: Phase 1 Complete - Ready for Phase 2 🚀
