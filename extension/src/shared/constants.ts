export const APP_NAME = 'Group Collect';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_USER: 'auth_user',
  AUTH_SESSION: 'auth_session',
  SETTINGS: 'user_settings',
  MEMBERS: 'members_data',
  MESSAGE_LOG: 'message_log',
  DECLINE_LOG: 'decline_log',
  SELECTED_GROUP: 'selected_group',
} as const;

// Navigation Pages
export const PAGES = {
  HOME: 'HOME',
  PLAN: 'PLAN',
  LINKS: 'LINKS',
  SETTINGS: 'SETTINGS',
  MESSAGE: 'MESSAGE',
} as const;

// Default Settings
export const DEFAULT_SETTINGS = {
  activeDeclineFeature: false,
  declineRules: {
    declineIfEmailMissing: false,
    requiredQuestions: [],
    customRules: [],
  },
  sendWelcomeMessage: false,
  messageIntervalMins: 1,
  maxMessages: 0,
  messageTemplate: `Hey {first_name} {last_name},
Thank you for requesting to join {group_name}.
I have just approved you and super excited to have you on your group.

Please feel free to make your first post.`,
};

// API Endpoints
export const API_ENDPOINTS = {
  GOOGLE_SHEETS: 'https://sheets.googleapis.com/v4/spreadsheets',
  SUPABASE: import.meta.env.VITE_SUPABASE_URL,
} as const;

// Environment Variables
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
  EXTENSION_ID: import.meta.env.VITE_EXTENSION_ID || '',
} as const;
