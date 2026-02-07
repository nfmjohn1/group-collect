# 🚀 Setup Guide - First Time Setup

## Step 1: Install Dependencies

Open your terminal in the project folder and run:

```bash
npm install
```

Wait for all packages to download (this may take a minute or two).

---

## Step 2: Build the Extension

Run this command to create the `dist/` folder:

```bash
npm run build
```

You should see output like:
```
✓ built in XXXms
✓ Post-build script completed
```

**Check that dist/ folder was created:**
```bash
ls -la dist/
```

You should see files like:
- manifest.json
- popup/
- dashboard/
- background/
- etc.

---

## Step 3: Load Extension in Chrome

1. **Open Chrome Extensions Page:**
   - Go to `chrome://extensions/` in your browser
   - OR click the puzzle piece icon → "Manage Extensions"

2. **Enable Developer Mode:**
   - Look in the top-right corner
   - Toggle the switch that says "Developer mode" to ON

3. **Load the Extension:**
   - Click the "Load unpacked" button (top-left)
   - Navigate to your project folder
   - Select the **`dist/`** folder (not the project root!)
   - Click "Select"

4. **Pin the Extension (Optional but Recommended):**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Group Collect"
   - Click the pin icon to keep it visible

---

## Step 4: Test the Extension

1. **Click the extension icon** in your Chrome toolbar
2. You should see the popup with Sign Up / Sign In buttons
3. Try signing up with an email and password

---

## Step 5: Development Mode (For Making Changes)

Instead of `npm run build`, you can use dev mode which auto-rebuilds on changes:

```bash
npm run dev
```

**Keep this running in your terminal!** It will watch for file changes and rebuild automatically.

When you make changes:
1. Save your files
2. Go to `chrome://extensions/`
3. Click the **reload icon** (🔄) next to "Group Collect"
4. Your changes will appear

---

## Troubleshooting

### "dist/ folder not found"
- Make sure you ran `npm run build` successfully
- Check for error messages in the terminal

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installing

### Extension doesn't load in Chrome
- Make sure you selected the `dist/` folder, not the project root
- Make sure Developer Mode is ON
- Check for errors in the Chrome Extensions page

### "Module not found" errors during build
- Run `npm install` again
- Delete `node_modules/` and run `npm install` fresh

### Changes not showing up
- Reload the extension in `chrome://extensions/`
- Close and reopen the extension popup
- For background script changes, you MUST reload

### "Failed to fetch" error when signing up
- Make sure your `.env` file has the correct Supabase URL
- Stop and restart `npm run dev`
- Reload the extension

---

## Quick Commands Reference

```bash
# Install dependencies (first time only)
npm install

# Build for production
npm run build

# Development mode (auto-rebuild)
npm run dev

# Run tests
npm run test

# Check environment variables
node check-env.js
```

---

## What's Next?

Once the extension is loaded:
1. Sign up with an email/password
2. Go to Settings and configure your Google Sheet (optional)
3. Visit a Facebook group members page
4. Click "Collect Members" to test the scraper
5. View collected data in the dashboard

---

## Need Help?

- Check TROUBLESHOOTING.md for common issues
- Open DevTools: Right-click extension → Inspect
- Check console for error messages
- See error logs: Send message `{ type: 'GET_ERROR_LOG' }`

---

**First Time Setup Checklist:**
- ✅ Node.js installed
- ✅ Dependencies installed (`npm install`)
- ✅ Extension built (`npm run build`)
- ✅ `dist/` folder exists
- ✅ Extension loaded in Chrome
- ✅ Extension icon visible in toolbar
- ✅ Popup opens when clicked
