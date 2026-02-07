# Group Collect - Facebook Group Member Data Capture

A modern Chrome extension that captures member application data from Facebook Groups and exports it to Google Sheets or CSV.

## Features

### Phase 1 (Complete) ✅
- ✅ Detects Facebook Group member requests pages automatically
- ✅ Injects a clean, Robinhood-inspired UI bar at the top of the page
- ✅ Background service worker with message passing infrastructure
- ✅ Modern React + TypeScript architecture
- ✅ Local storage for captured member data
- ✅ Popup interface with statistics, export, and settings

### Phase 2 (Complete) ✅
- ✅ Facebook DOM scraper with multiple fallback strategies
- ✅ MutationObserver watching for member cards and approve actions
- ✅ Auto-capture when approve button is clicked
- ✅ Manual "Capture All" button for batch capture
- ✅ Auto/Manual capture mode toggle
- ✅ Full-page data viewer with search and filtering
- ✅ Name, profile URL, email, and Q&A extraction
- ✅ Robust error handling and duplicate prevention
- ✅ Debug mode for troubleshooting DOM changes

### Phase 3 (Complete) ✅
- ✅ Direct Google Sheets API integration (no Apps Script required)
- ✅ One-click "Push to Google Sheet" button
- ✅ OAuth sign-in via Chrome Identity API
- ✅ Progress indicators and real error handling
- ✅ URL validation with spreadsheet ID detection
- ✅ Automatic token refresh on expiry

## Installation & Testing

### 1. Build the Extension

```bash
npm install
npm run build
```

This creates a `dist/` folder with the compiled extension.

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project

### 3. Test the Extension

1. Navigate to a Facebook Group where you're an admin
2. Go to the Member Requests page (URL pattern: `/groups/*/member-requests`)
3. The Group Collect UI bar should appear at the top of the page
4. Use the controls in the injected bar:
   - **Auto/Manual toggle**: Switch between auto-capture on approve or manual mode
   - **Capture All**: Manually capture all visible member cards
   - **View Data**: Open full-page viewer to see all captured members
5. Click approve buttons to automatically capture member data (in Auto mode)
6. Click the extension icon to open the popup for quick stats and CSV export

## Development

### Project Structure

```
src/
├── background/
│   └── background.ts         # Service worker (message handling, storage, Sheets push)
├── content/
│   ├── content.tsx           # Content script (page detection, UI injection)
│   ├── InjectedUI.tsx        # React component for injected bar
│   ├── InjectedUI.css        # Robinhood-inspired styles
│   ├── FacebookScraper.ts    # DOM scraping with fallback strategies
│   └── MemberCapture.ts      # Capture manager with MutationObserver
├── popup/
│   ├── popup.html            # Popup HTML template
│   ├── popup.tsx             # Popup entry point
│   ├── Popup.tsx             # Main popup React component
│   └── popup.css             # Popup styles
├── services/
│   └── sheetsApi.ts          # Google Sheets API v4 OAuth + append
├── viewer/
│   ├── viewer.html           # Full-page viewer HTML
│   ├── viewer.tsx            # Viewer entry point
│   ├── Viewer.tsx            # Data table component
│   └── viewer.css            # Viewer styles
├── types/
│   └── types.ts              # TypeScript interfaces
└── assets/
    └── icon*.png             # Extension icons
```

### Build Commands

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode
- `npm run clean` - Remove dist folder

## Design Philosophy

The extension uses a Robinhood-inspired design system:

- **Colors**: Dark theme (#1b1b1d background) with bright green (#00c805) accents
- **Typography**: System fonts with careful letter-spacing
- **Interactions**: Smooth transitions, subtle hover effects, clear focus states
- **Layout**: Clean, minimal, focused on core functionality

## Debugging

The extension exposes a global `__groupCollect` object on Facebook member requests pages for debugging:

```javascript
// In browser console on Facebook member requests page
__groupCollect.debugPage()      // Log all page elements
__groupCollect.scraper           // Access scraper instance
__groupCollect.capture           // Access capture manager
```

## Google Sheets Setup

### One-Time Setup: Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Group Collect")
3. Enable the **Google Sheets API**:
   - Navigate to APIs & Services > Library
   - Search "Google Sheets API" and click **Enable**
4. Create OAuth credentials:
   - Go to APIs & Services > Credentials
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Chrome Extension**
   - Item ID: Your extension ID from `chrome://extensions/`
5. Copy the **Client ID** and paste it into `manifest.json` in the `oauth2.client_id` field
6. Rebuild: `npm run build`

### Using Google Sheets

1. Create a Google Sheet (or use an existing one with your column headers)
2. Open the extension popup > **Settings** tab
3. Paste the Google Sheet URL (e.g., `https://docs.google.com/spreadsheets/d/.../edit`)
4. Click **Save Settings**
5. Go to the **Home** tab and click **Push to Google Sheet**
6. The first time, you'll be prompted to sign in with your Google account
7. Data will be appended as new rows to your sheet

### Spreadsheet Template Columns

The extension exports data in this column order:

| Group Name | User ID | Facebook User Name | Joined Facebook | Q1 | A1 | Q2 | A2 | Q3 | A3 | Date Added | First Name | Last Name | City |

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Webpack 5
- **Extension**: Chrome Manifest V3
- **Styling**: Pure CSS (no frameworks)

## License

Proprietary - Built for private community management workflows

---

**Status**: Phase 3 Complete ✅

**All Features Implemented and Ready for Production Use**
