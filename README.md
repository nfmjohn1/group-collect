# Group Collect

A Chrome extension to automate Facebook group member request collection and management.

## Features

- 📊 Collect member data from Facebook group approval requests
- 📝 Export data to Google Sheets
- 💬 Automated welcome messages to new members
- ❌ Auto-decline members based on custom rules
- 🔐 Secure authentication with Supabase
- ☁️ Cloud sync across devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (Auth + Database)
- **Build Tool**: Vite
- **Chrome Extension**: Manifest V3

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Chrome browser
- Supabase account (for backend)
- Google Cloud project (for Sheets API)

### Installation

1. Clone the repository:
   ```bash
   cd Group-Collect-2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Fill in your environment variables in `.env`:
   - Supabase URL and anon key
   - Google Client ID and API key

5. Build the extension:
   ```bash
   npm run build
   ```

6. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Development

Run the development server:
```bash
npm run dev
```

This will start Vite in watch mode and rebuild on file changes.

## Project Structure

```
extension/
├── src/
│   ├── popup/          # Main popup UI
│   ├── dashboard/      # Data viewing page
│   ├── content/        # Content scripts for Facebook
│   ├── background/     # Service worker
│   ├── services/       # Business logic (auth, storage, etc.)
│   ├── store/          # Zustand state management
│   └── shared/         # Shared types and utilities
├── public/             # Static assets
└── manifest.json       # Chrome extension manifest
```

## Usage

1. **Sign Up/Login**: Create an account or sign in with Google
2. **Configure Settings**:
   - Select your Facebook group
   - Add your Google Sheet URL
   - Sync questions/answers mapping
3. **Collect Data**: Navigate to Facebook group members page and use the extension
4. **View Data**: Click "View Data" to see collected member information
5. **Export**: Push data to Google Sheets or download as CSV

## Phase 1 Status

✅ Project setup and configuration
✅ Authentication system (email/password + Google OAuth)
✅ Popup UI with navigation
✅ Settings page
✅ Message configuration
✅ Dashboard (data viewing)
✅ Zustand stores for state management
✅ Chrome storage wrapper

## Next Steps (Phase 2+)

- Implement Facebook scraping logic
- Google Sheets API integration
- Auto-decline feature
- Welcome message automation
- Background sync
- Testing and deployment

## Contributing

This is a private project. Please contact the owner for contribution guidelines.

## License

Private - All rights reserved
