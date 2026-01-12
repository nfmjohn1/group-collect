# Group Collect - Project Plan

## Project Overview

**Group Collect** is a Chrome extension that automates the collection and management of Facebook group membership request data. The extension scrapes approval questions/answers from pending group members, stores member information (especially emails) in Google Sheets, and provides automated welcome messaging and decline functionality.

## Tech Stack

### Chrome Extension (Main App)
- **Manifest V3** - Required for Chrome extensions
- **React 18 + TypeScript** - Modern, type-safe UI
- **Tailwind CSS** - Fast, beautiful UI styling
- **Zustand** - Lightweight state management
- **Chrome Storage API** - Local data persistence
- **Vite** - Build tool for fast development

### Backend (Authentication & User Management)
- **Supabase**
  - Built-in JWT authentication
  - PostgreSQL database
  - Row-level security
  - REST & Realtime APIs

### Key Integrations
- **Google Sheets API** - For exporting collected member data
- **Google OAuth 2.0** - For Sheets access and optional login

## Project Structure

```
group-collect-2/
├── extension/                    # Chrome extension code
│   ├── manifest.json            # Extension manifest (V3)
│   ├── public/                  # Static assets
│   │   ├── icons/              # Extension icons (16, 48, 128px)
│   │   └── logo.png            # Group Collect logo
│   ├── src/
│   │   ├── popup/              # Main popup UI
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Plan.tsx
│   │   │   │   ├── Links.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   └── Message.tsx
│   │   │   ├── components/
│   │   │   └── index.html
│   │   ├── content/            # Content scripts
│   │   │   ├── scraper.ts     # FB page scraper
│   │   │   ├── messenger.ts   # Welcome message sender
│   │   │   └── decliner.ts    # Auto-decline handler
│   │   ├── background/         # Service worker
│   │   │   ├── index.ts       # Background script
│   │   │   └── sync.ts        # Periodic sync logic
│   │   ├── dashboard/          # Data viewing panel (separate page)
│   │   │   ├── index.html
│   │   │   ├── Dashboard.tsx
│   │   │   └── components/
│   │   ├── services/           # Business logic
│   │   │   ├── auth.ts        # Supabase auth
│   │   │   ├── sheets.ts      # Google Sheets API
│   │   │   ├── facebook.ts    # FB scraping logic
│   │   │   └── storage.ts     # Chrome storage wrapper
│   │   ├── store/              # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── memberStore.ts
│   │   │   └── settingsStore.ts
│   │   └── shared/             # Shared utilities
│   │       ├── types.ts
│   │       ├── constants.ts
│   │       └── utils.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── backend/                      # Supabase configuration
│   ├── supabase/
│   │   ├── migrations/          # Database migrations
│   │   ├── functions/           # Edge functions (if needed)
│   │   └── config.toml
│   └── schema.sql               # Initial schema
└── shared/                       # Shared types (if needed)
    └── types.ts
```

## Core Features & Implementation

### 1. Authentication System

**User Stories:**
- Users can sign up with email/password
- Users can sign in with Google OAuth
- Users stay logged in across sessions
- Users can log out

**Implementation:**
- Supabase Auth for user management
- Google OAuth integration for Sheets access
- Store auth tokens in Chrome storage (encrypted)
- Display active email in popup home screen
- Logout button clears auth state

**Database Tables:**
```sql
users (managed by Supabase Auth)
- id (uuid)
- email
- created_at

user_settings
- id (uuid)
- user_id (fk to auth.users)
- google_sheet_url
- active_decline_feature (boolean)
- send_welcome_message (boolean)
- message_interval_mins (integer)
- max_messages (integer)
- message_template (text)
- created_at
- updated_at
```

### 2. Facebook Group Selection & Configuration

**User Stories:**
- Users can select which FB group to monitor from a dropdown
- Users can enter their Google Sheet URL
- Users can sync questions/answers mapping with their sheet

**Implementation:**
- Settings page with group selector dropdown
- Content script detects available groups user manages
- Store selected group ID in Chrome storage
- Google Sheet URL input field with validation
- "Sync Questions/Answers" button triggers mapping flow
- Display last sync timestamp

### 3. Member Data Scraping

**User Stories:**
- Users can manually trigger scraping of pending member requests
- Extension extracts member data: name, username, join date, answers to questions
- Emails are captured from approval questions
- Data is temporarily stored locally before sync

**Implementation:**
- Content script injected on Facebook group pages
- Manual "Sync Now" button in popup or settings
- DOM scraping logic to extract:
  - Group Name
  - User ID
  - Facebook Username
  - Join date
  - Q1-Q3 answers (configurable)
  - First Name, Last Name
  - City, Country
  - Status (pending, approved, declined)
- Store scraped data in Chrome storage
- Handle Facebook's dynamic DOM structure
- Error handling for missing fields

**Data Structure:**
```typescript
interface MemberRequest {
  id: string;
  groupName: string;
  userId: string;
  facebookUsername: string;
  joinedOn: Date;
  q1?: string;
  q2?: string;
  q3?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  status: 'pending' | 'approved' | 'declined';
  dateAdded: Date;
}
```

### 4. Google Sheets Integration

**User Stories:**
- Users can push scraped data to their Google Sheet
- Data syncs automatically to the configured sheet
- Users can download data as CSV
- Users can open their Google Sheet directly from extension

**Implementation:**
- Google Sheets API v4 integration
- OAuth 2.0 flow for sheet access permissions
- "Push to Google Sheet" button in dashboard
- Map member data to sheet columns:
  - Group Name, User ID, Facebook Username, Joined On
  - Q1, A1, Q2, A2, Q3, A3
  - Date Added, First Name, Last Name, City, Country, Status
- Batch insert/update operations
- "Download to CSV" export functionality
- "Open Google Sheet" button (opens in new tab)
- Handle API rate limits and errors

### 5. Auto-Decline Feature

**User Stories:**
- Users can enable/disable auto-decline feature
- Users can set rules for auto-declining (e.g., missing email)
- Extension automatically declines members who don't meet criteria
- Users can see decline statistics

**Implementation:**
- Toggle switch in Settings page
- Rule configuration UI:
  - Decline if email missing
  - Decline if specific questions unanswered
  - Custom decline reasons
- Content script monitors approval queue
- Auto-click decline button for matching members
- Log declined members with reason
- Store decline count in local storage
- Safety: Require user confirmation before enabling

### 6. Welcome Message Automation

**User Stories:**
- Users can enable/disable welcome messages
- Users can customize message template with variables
- Messages auto-send at configured intervals
- Users can set maximum messages per session
- Users can preview message before enabling

**Implementation:**
- Message settings page with:
  - Toggle for send welcome message
  - Interval input (in minutes)
  - Max messages input
  - Template textarea with variable support:
    - `{first_name}`, `{last_name}`, `{group_name}`
- Content script for sending FB messages
- Background worker schedules message sends
- Queue system to respect rate limits
- Track sent messages to avoid duplicates
- "Save" button to persist settings

**Message Flow:**
1. Member approved
2. Wait for configured interval
3. Check if under max message limit
4. Inject personalized message
5. Send via Facebook's messaging system
6. Mark as sent in database

### 7. Data Dashboard (View Data)

**User Stories:**
- Users can view all collected member data in a table
- Users can filter and search members
- Users can perform bulk actions (approve, decline, export)
- Dashboard opens in a new Chrome tab

**Implementation:**
- Separate HTML page (dashboard.html) opened via chrome.tabs.create
- Data table with columns matching Google Sheet
- Action buttons:
  - "Automate" - opens automation settings
  - "Download to CSV" - exports current view
  - "Push to Google Sheet" - syncs to Sheets
  - "Clear Data" - clears local storage
  - "The fly tying bench (No Spam)" - external link
  - "Open Google Sheet" - opens configured sheet
  - "Automate Fbook" - triggers automation
- Filtering and search functionality
- Pagination for large datasets
- Real-time sync indicator

### 8. Navigation & UI Structure

**Popup Navigation (Side Menu):**
- HOME - Welcome screen with active email, logout, quick links
- PLAN - Subscription/plan information (future feature)
- LINKS - Useful resources and external links
- SETTINGS - Group selection, Sheet URL, sync questions/answers
- MESSAGE - Welcome message configuration

**Visual Design:**
- Blue sidebar navigation (#4A69BD color scheme)
- White content area
- Group Convert logo and branding
- Responsive layout for popup (400px width)
- Tailwind CSS for consistent styling

## Development Phases

### Phase 1: Foundation & Setup
**Goal:** Set up project structure, authentication, and basic UI

**Tasks:**
1. Initialize project with Vite + React + TypeScript
2. Configure Tailwind CSS
3. Set up Supabase project and database schema
4. Create manifest.json for Chrome Extension (Manifest V3)
5. Implement basic popup UI with navigation
6. Build authentication pages (login, signup)
7. Integrate Supabase Auth
8. Set up Google OAuth flow
9. Create Zustand stores for state management
10. Implement Chrome storage wrapper

**Deliverables:**
- Working extension with popup UI
- User can sign up/login/logout
- Navigation between pages works
- Basic styling matches design

### Phase 2: Facebook Scraping & Data Collection
**Goal:** Extract member data from Facebook group pages

**Tasks:**
1. Create content script for Facebook.com
2. Implement group detection logic
3. Build DOM scraper for member requests
4. Extract approval questions and answers
5. Parse member information (name, email, etc.)
6. Store scraped data in Chrome storage
7. Build Settings page UI
8. Implement group selector dropdown
9. Add manual "Sync Now" functionality
10. Handle scraping errors gracefully

**Deliverables:**
- Content script successfully scrapes member data
- Settings page allows group selection
- Data stored locally in structured format
- Error handling for edge cases

### Phase 3: Google Sheets Integration
**Goal:** Sync collected data to Google Sheets

**Tasks:**
1. Set up Google Cloud project for Sheets API
2. Implement OAuth 2.0 flow for Sheets access
3. Build Google Sheets service module
4. Create sheet URL input and validation
5. Implement "Push to Google Sheet" functionality
6. Map member data to sheet columns
7. Handle batch operations for performance
8. Add "Sync Questions/Answers" mapping feature
9. Implement "Download to CSV" export
10. Add "Open Google Sheet" link functionality

**Deliverables:**
- Users can connect their Google Sheet
- Data successfully syncs to Sheet
- CSV export works
- Questions/answers mapping functional

### Phase 4: Data Dashboard
**Goal:** Build comprehensive data viewing interface

**Tasks:**
1. Create dashboard HTML page
2. Build data table component
3. Implement filtering and search
4. Add pagination for large datasets
5. Create action buttons (Automate, Download, Push, Clear, Open Sheet)
6. Implement "View Data" link from popup
7. Style dashboard to match design
8. Add real-time data refresh
9. Implement bulk selection functionality
10. Add data visualization (optional: charts for stats)

**Deliverables:**
- Dashboard page shows all collected data
- Filtering, search, and pagination work
- All action buttons functional
- Opens from popup "View Data" link

### Phase 5: Auto-Decline Feature
**Goal:** Automatically decline members based on rules

**Tasks:**
1. Build decline feature toggle in Settings
2. Create rule configuration UI
3. Implement rule evaluation logic
4. Build content script for auto-declining
5. Integrate with Facebook's decline button
6. Log declined members with reasons
7. Add safety confirmation dialog
8. Track decline statistics
9. Handle Facebook UI variations
10. Test across different group types

**Deliverables:**
- Auto-decline feature toggleable
- Rules can be configured
- Members auto-declined based on criteria
- Decline logs available in dashboard

### Phase 6: Welcome Message Automation
**Goal:** Auto-send personalized welcome messages to new members

**Tasks:**
1. Build Message settings page UI
2. Implement message template with variables
3. Create message queue system
4. Build background worker for scheduled sends
5. Implement Facebook messenger content script
6. Add interval and max message controls
7. Track sent messages to avoid duplicates
8. Implement message preview
9. Add rate limiting for FB compliance
10. Handle messaging errors

**Deliverables:**
- Message page allows template customization
- Variables ({first_name}, etc.) work
- Messages auto-send at intervals
- Respects max message limits
- Preview functionality works

### Phase 7: Background Sync & Polish
**Goal:** Add background processing and final polish

**Tasks:**
1. Implement background service worker
2. Add periodic sync for member requests
3. Create notification system for new members
4. Add extension badge with pending count
5. Implement data backup/restore
6. Add comprehensive error logging
7. Build user onboarding flow
8. Create help documentation
9. Optimize performance and bundle size
10. Cross-browser testing (Chrome, Edge, Brave)

**Deliverables:**
- Background sync works reliably
- Notifications appear for new members
- Extension badge shows pending count
- Onboarding guides new users
- Help docs available

### Phase 8: Testing & Deployment
**Goal:** Ensure quality and deploy to Chrome Web Store

**Tasks:**
1. Write unit tests for critical functions
2. Perform integration testing
3. Test across different Facebook group types
4. Security audit (auth, data handling)
5. Privacy policy and terms of service
6. Prepare Chrome Web Store listing
7. Create promotional images and screenshots
8. Submit extension for review
9. Set up analytics (optional)
10. Create user feedback mechanism

**Deliverables:**
- Comprehensive test coverage
- Security vulnerabilities addressed
- Chrome Web Store listing live
- Privacy policy published
- Extension available for download

## Database Schema

```sql
-- Users table (managed by Supabase Auth)
-- auth.users

-- User settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_sheet_url TEXT,
  selected_group_id TEXT,
  active_decline_feature BOOLEAN DEFAULT false,
  decline_rules JSONB DEFAULT '{}',
  send_welcome_message BOOLEAN DEFAULT false,
  message_interval_mins INTEGER DEFAULT 1,
  max_messages INTEGER DEFAULT 0,
  message_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Member data (synced from extension)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  group_name TEXT,
  fb_user_id TEXT,
  facebook_username TEXT,
  joined_on TIMESTAMP WITH TIME ZONE,
  q1 TEXT,
  q2 TEXT,
  q3 TEXT,
  first_name TEXT,
  last_name TEXT,
  city TEXT,
  country TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, declined
  date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fb_user_id, group_name)
);

-- Message log
CREATE TABLE message_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  message_content TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent' -- sent, failed
);

-- Decline log
CREATE TABLE decline_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  decline_reason TEXT,
  declined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE decline_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own members"
  ON members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own members"
  ON members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own members"
  ON members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own members"
  ON members FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for message_log and decline_log
CREATE POLICY "Users can view own message log"
  ON message_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message log"
  ON message_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own decline log"
  ON decline_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own decline log"
  ON decline_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Chrome Extension Manifest (V3)

```json
{
  "manifest_version": 3,
  "name": "Group Collect",
  "version": "1.0.0",
  "description": "Automate Facebook group member request collection and management",
  "permissions": [
    "storage",
    "tabs",
    "notifications",
    "identity"
  ],
  "host_permissions": [
    "https://www.facebook.com/*",
    "https://docs.google.com/*",
    "https://*.supabase.co/*"
  ],
  "background": {
    "service_worker": "background/index.js"
  },
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://www.facebook.com/*"],
      "js": ["content/scraper.js", "content/messenger.js", "content/decliner.js"],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["dashboard/index.html"],
      "matches": ["<all_urls>"]
    }
  ],
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID",
    "scopes": [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/userinfo.email"
    ]
  }
}
```

## Key Technical Considerations

### Facebook Scraping Challenges
- Facebook's DOM structure changes frequently
- Need robust selectors and fallback strategies
- Handle infinite scroll for member lists
- Rate limiting to avoid detection
- Handle React-based dynamic content
- Test across different Facebook UI versions

### Google Sheets API
- OAuth 2.0 token refresh handling
- Batch operations to respect API quotas
- Handle concurrent writes
- Schema validation before writing
- Error recovery for failed syncs

### Chrome Extension Limitations
- Service workers have limited lifetime
- Storage quotas (5MB for chrome.storage.sync, unlimited for local)
- Content scripts can't directly access Chrome APIs
- Message passing required between components
- Background script can't access DOM

### Security & Privacy
- Never store passwords in plain text
- Encrypt sensitive data in Chrome storage
- Use HTTPS for all API calls
- Row-level security in Supabase
- No tracking of user's Facebook activity beyond selected group
- Clear privacy policy regarding data handling
- User consent for Google Sheets access

### Performance Optimization
- Lazy load dashboard data
- Debounce scraping triggers
- Cache frequently accessed data
- Minimize background script activity
- Optimize bundle size with code splitting
- Use Chrome storage efficiently

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_API_KEY=your_google_api_key

# Google Sheets
VITE_GOOGLE_SHEETS_SCOPE=https://www.googleapis.com/auth/spreadsheets

# Extension
VITE_EXTENSION_ID=your_extension_id
```

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/chrome": "^0.0.250",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@crxjs/vite-plugin": "^2.0.0-beta.21"
  }
}
```

## Success Metrics

### User Metrics
- Number of active users
- Daily active groups monitored
- Total members processed
- Messages sent per day

### Performance Metrics
- Scraping success rate (>95%)
- Google Sheets sync success rate (>98%)
- Average scraping time (<5 seconds)
- Extension load time (<1 second)

### Quality Metrics
- Crash-free rate (>99%)
- User-reported bugs (<1% of users)
- User retention (7-day, 30-day)
- Chrome Web Store rating (>4.5 stars)

## Risk Mitigation

### Facebook Changes
- **Risk:** Facebook updates DOM structure, breaking scraper
- **Mitigation:**
  - Build flexible selectors with fallbacks
  - Implement error logging and monitoring
  - Version scraping logic for different FB versions
  - Community-driven scraper updates

### Google API Limits
- **Risk:** Exceeding Sheets API quotas
- **Mitigation:**
  - Batch operations efficiently
  - Implement exponential backoff
  - Cache data locally
  - Show clear error messages to users

### Chrome Web Store Rejection
- **Risk:** Extension rejected for policy violations
- **Mitigation:**
  - Clear privacy policy
  - Minimal permissions requested
  - No data collection beyond user's explicit action
  - Comply with Facebook's terms of service
  - Request user consent for all automations

### Data Loss
- **Risk:** Chrome storage data lost
- **Mitigation:**
  - Regular sync to Supabase backend
  - Export to Google Sheets frequently
  - Backup/restore functionality
  - User warnings before clearing data

## Future Enhancements (Post-MVP)

1. **Multi-Group Management** - Monitor multiple groups simultaneously
2. **Advanced Analytics** - Member growth charts, approval rates, etc.
3. **Template Library** - Pre-built message templates
4. **CRM Integration** - Export to Mailchimp, HubSpot, etc.
5. **Mobile App** - React Native companion app
6. **Team Collaboration** - Multiple admins per group
7. **AI-Powered Insights** - Identify high-quality members
8. **Zapier Integration** - Connect to other tools
9. **Premium Plans** - Tiered pricing for power users
10. **Custom Branding** - White-label for agencies

## Next Steps

1. **Set up development environment**
   - Install Node.js, npm, Chrome
   - Create Supabase account and project
   - Set up Google Cloud project for Sheets API

2. **Initialize project**
   - Run `npm create vite@latest` with React + TypeScript
   - Install dependencies
   - Configure Tailwind CSS
   - Set up extension structure

3. **Start with Phase 1**
   - Follow implementation plan sequentially
   - Test each feature before moving to next phase
   - Get user feedback early and often

4. **Deploy MVP**
   - Complete Phases 1-4 for basic functionality
   - Test thoroughly with real Facebook groups
   - Submit to Chrome Web Store
   - Gather user feedback for prioritizing Phases 5-8
