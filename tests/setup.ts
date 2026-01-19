/**
 * Test Setup and Global Mocks
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Chrome Extension APIs
const chromeMock = {
  storage: {
    local: {
      get: vi.fn((keys) => Promise.resolve({})),
      set: vi.fn((items) => Promise.resolve()),
      remove: vi.fn((keys) => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
    },
    sync: {
      get: vi.fn((keys) => Promise.resolve({})),
      set: vi.fn((items) => Promise.resolve()),
      remove: vi.fn((keys) => Promise.resolve()),
    },
  },
  runtime: {
    getManifest: vi.fn(() => ({
      version: '1.0.0',
      name: 'Group Collect',
      manifest_version: 3,
    })),
    getURL: vi.fn((path) => `chrome-extension://test/${path}`),
    sendMessage: vi.fn((message, callback) => {
      if (callback) callback({ success: true });
      return Promise.resolve({ success: true });
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    lastError: null,
  },
  tabs: {
    create: vi.fn((options) => Promise.resolve({ id: 1, ...options })),
    query: vi.fn((options) => Promise.resolve([])),
    sendMessage: vi.fn((tabId, message) => Promise.resolve({ success: true })),
  },
  action: {
    setBadgeText: vi.fn((details) => Promise.resolve()),
    setBadgeBackgroundColor: vi.fn((details) => Promise.resolve()),
    setIcon: vi.fn((details) => Promise.resolve()),
  },
  notifications: {
    create: vi.fn((id, options, callback) => {
      if (callback) callback('notification-id');
      return Promise.resolve('notification-id');
    }),
    clear: vi.fn((id) => Promise.resolve(true)),
  },
  alarms: {
    create: vi.fn((name, alarmInfo) => {}),
    clear: vi.fn((name) => Promise.resolve(true)),
    clearAll: vi.fn(() => Promise.resolve(true)),
    get: vi.fn((name) => Promise.resolve(null)),
    getAll: vi.fn(() => Promise.resolve([])),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  identity: {
    getAuthToken: vi.fn((options, callback) => {
      if (callback) callback('mock-auth-token');
      return Promise.resolve('mock-auth-token');
    }),
    removeCachedAuthToken: vi.fn((options) => Promise.resolve()),
  },
  downloads: {
    download: vi.fn((options) => Promise.resolve(1)),
  },
};

// @ts-ignore
global.chrome = chromeMock;

// Mock fetch for API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as Response)
);

// Mock window.URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback: MutationCallback) {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
} as any;

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  vi.restoreAllMocks();
});
