# Troubleshooting Guide

## Authentication Issues

### Issue: "Failed to fetch" error on signup/login

**Symptoms:**
- Loading circle appears indefinitely
- Extension popup shows "Failed to fetch"
- Console shows CORS error or "AuthRetryableFetchError"

**Causes:**
1. **Incorrect Supabase URL in .env file**
   - ❌ Wrong: `https://supabase.com/dashboard/project/xxx/settings/api-keysupabase_url`
   - ✅ Correct: `https://[project-ref].supabase.co`

2. **Environment variables not loaded**
   - Dev server needs full restart after .env changes
   - Extension needs to be reloaded in Chrome

**Solution:**

1. **Fix the .env file:**
   ```bash
   # Open .env and verify the URL format
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Verify with the debug script:**
   ```bash
   node check-env.js
   ```
   This will check your .env file and show if the URL format is correct.

3. **Full restart process:**
   ```bash
   # Stop the dev server (Ctrl+C in terminal)

   # Clear any cached builds
   rm -rf dist/

   # Restart dev server
   npm run dev
   ```

4. **Reload extension:**
   - Open `chrome://extensions/`
   - Find "Group Collect"
   - Click the refresh icon 🔄
   - Try signing up again

5. **Check browser console:**
   - Open extension popup
   - Right-click → Inspect
   - Check Console tab for environment variable logs
   - You should see the Supabase URL validation messages

### Issue: "Cannot read properties of undefined (reading 'create')"

**Cause:** Missing Chrome API or module import issue

**Solution:**
1. Check that manifest.json includes all required permissions
2. Verify extension is loaded properly in `chrome://extensions/`
3. Check browser console for specific API that's undefined

## Environment Variables Not Loading

### Symptoms:
- `import.meta.env.VITE_SUPABASE_URL` is undefined
- Console shows placeholder values

### Solution:
1. Make sure .env file is in project root (not in subdirectories)
2. Variable names must start with `VITE_` for Vite to expose them
3. Restart dev server completely (stop and start, not hot reload)
4. Check that .env is not in .gitignore (it should be, but needs to exist locally)

## Build Issues

### Issue: Extension doesn't load after build

**Solution:**
```bash
# Clean build
rm -rf dist/

# Rebuild
npm run build

# Load unpacked extension from dist/ folder
```

### Issue: "Unexpected token" errors

**Cause:** TypeScript or JSX not being transpiled correctly

**Solution:**
1. Check vite.config.ts has React plugin
2. Verify tsconfig.json includes correct settings
3. Make sure all `.tsx` files use React imports

## Data Collection Issues

### Issue: "Collect Members" button doesn't work

**Solution:**
1. Make sure you're on a Facebook group members page
2. Check that content script is injected (look in DevTools → Sources)
3. Verify manifest.json has correct content_scripts configuration
4. Check browser console for scraper errors

## Google Sheets Integration Issues

### Issue: "Failed to authenticate with Google"

**Solution:**
1. Check that chrome.identity API is available
2. Verify Google OAuth credentials in .env
3. Make sure extension has identity permission in manifest.json
4. Try removing cached auth token:
   ```javascript
   chrome.identity.removeCachedAuthToken({ token: 'your-token' })
   ```

### Issue: "Failed to push to sheet"

**Solution:**
1. Verify Google Sheets URL is correct
2. Make sure sheet is not protected/read-only
3. Check that you have edit permissions on the sheet
4. Try syncing questions mapping first

## Dashboard Issues

### Issue: Dashboard page blank or not loading

**Solution:**
1. Check browser console for errors
2. Verify dashboard/index.html exists in dist/
3. Make sure members data exists in storage:
   ```javascript
   chrome.storage.local.get('members_data', console.log)
   ```

### Issue: Data not appearing in dashboard

**Solution:**
1. Collect members first from Facebook page
2. Check that data is stored:
   ```javascript
   chrome.storage.local.get('members_data', (result) => {
     console.log('Members:', result.members_data?.length || 0);
   });
   ```
3. Click "Refresh Data" button in dashboard

## Auto-Decline Issues

### Issue: Auto-decline not working

**Solution:**
1. Verify feature is enabled in Settings
2. Check that at least one decline rule is configured
3. Make sure you're on Facebook group members page
4. Check content script console for decliner errors
5. Facebook UI changes may require selector updates

## Storage Issues

### Issue: "Storage quota exceeded"

**Solution:**
1. Chrome extensions have 10MB limit for local storage
2. Clear old data:
   ```javascript
   // Clear decline log
   chrome.storage.local.remove('decline_log');

   // Clear old backups
   chrome.storage.local.get(null, (items) => {
     const backupKeys = Object.keys(items).filter(k => k.startsWith('backup_'));
     chrome.storage.local.remove(backupKeys);
   });
   ```
3. Implement data compression (see OPTIMIZATION-GUIDE.md)

## Permission Issues

### Issue: Extension requesting too many permissions

**Solution:**
1. Review manifest.json permissions
2. Remove unused permissions
3. Use optional_permissions for features that don't need immediate access

## Debugging Tips

### Enable verbose logging:
```javascript
// In any service file, add detailed logs
console.log('[Service Name]', 'Operation', data);
```

### Check Chrome extension logs:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "service worker" link to see background script logs
4. Click "Inspect views" for popup/dashboard logs

### View stored data:
```javascript
// Get all storage
chrome.storage.local.get(null, (items) => {
  console.log('All stored data:', items);
  console.log('Storage size:', JSON.stringify(items).length, 'bytes');
});
```

### Clear all extension data:
```javascript
// WARNING: This deletes everything!
chrome.storage.local.clear(() => {
  console.log('All data cleared');
});
```

## Getting Help

If you're still experiencing issues:

1. **Check error logs:**
   ```javascript
   chrome.runtime.sendMessage({ type: 'GET_ERROR_LOG' }, (response) => {
     console.log('Error log:', response.log);
   });
   ```

2. **Create a bug report with:**
   - Chrome version
   - Extension version
   - Steps to reproduce
   - Console error messages
   - Screenshots if applicable

3. **Enable debug mode:**
   - Add `DEBUG=true` to .env
   - Rebuild extension
   - Logs will be more verbose

## Common Error Messages

### "chrome.storage is undefined"
- Extension context is invalid
- Reload extension in chrome://extensions/

### "Extension context invalidated"
- Extension was reloaded while page was open
- Refresh the page

### "Could not establish connection"
- Background service worker is not running
- Check for errors in service worker console
- Reload extension

### "Uncaught (in promise) Error: Extension context invalidated"
- Extension was updated or reloaded
- Close and reopen extension popup
- Refresh any open dashboard tabs

---

**Still having issues?** Create an issue on GitHub with:
- Error messages from console
- Steps to reproduce
- Expected vs actual behavior
- Your Chrome and extension version
