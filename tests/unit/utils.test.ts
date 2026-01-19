/**
 * Unit Tests for Utility Functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  cn,
  formatDate,
  isValidEmail,
  isValidGoogleSheetUrl,
  extractSheetId,
  replaceMessageVariables,
  generateId,
  debounce,
  sleep,
  arrayToCSV,
} from '../../extension/src/shared/utils';

describe('Utils - cn (className merger)', () => {
  it('should merge multiple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
  });

  it('should handle arrays', () => {
    expect(cn(['class1', 'class2'])).toContain('class1');
  });
});

describe('Utils - formatDate', () => {
  it('should format Date object correctly', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = formatDate(date, 'yyyy-MM-dd');
    expect(formatted).toBe('2024-01-15');
  });

  it('should format string date correctly', () => {
    const dateStr = '2024-01-15T10:30:00';
    const formatted = formatDate(dateStr, 'yyyy-MM-dd');
    expect(formatted).toBe('2024-01-15');
  });

  it('should use default format when not specified', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toBeTruthy();
  });
});

describe('Utils - isValidEmail', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@example.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('Utils - isValidGoogleSheetUrl', () => {
  it('should validate correct Google Sheets URLs', () => {
    expect(isValidGoogleSheetUrl('https://docs.google.com/spreadsheets/d/1abc123')).toBe(true);
    expect(isValidGoogleSheetUrl('https://docs.google.com/spreadsheets/d/1abc-123_XYZ/edit')).toBe(true);
  });

  it('should reject invalid URLs', () => {
    expect(isValidGoogleSheetUrl('https://google.com')).toBe(false);
    expect(isValidGoogleSheetUrl('https://docs.google.com/document/d/123')).toBe(false);
    expect(isValidGoogleSheetUrl('http://docs.google.com/spreadsheets/d/123')).toBe(false);
    expect(isValidGoogleSheetUrl('')).toBe(false);
  });
});

describe('Utils - extractSheetId', () => {
  it('should extract spreadsheet ID from URL', () => {
    const url = 'https://docs.google.com/spreadsheets/d/1abc123xyz/edit#gid=0';
    expect(extractSheetId(url)).toBe('1abc123xyz');
  });

  it('should return null for invalid URLs', () => {
    expect(extractSheetId('https://google.com')).toBe(null);
    expect(extractSheetId('')).toBe(null);
  });
});

describe('Utils - replaceMessageVariables', () => {
  it('should replace all variables in template', () => {
    const template = 'Hello {first_name} {last_name}, welcome to {group_name}!';
    const result = replaceMessageVariables(template, {
      first_name: 'John',
      last_name: 'Doe',
      group_name: 'Test Group',
    });
    expect(result).toBe('Hello John Doe, welcome to Test Group!');
  });

  it('should handle partial variable replacement', () => {
    const template = 'Hello {first_name}!';
    const result = replaceMessageVariables(template, {
      first_name: 'John',
    });
    expect(result).toBe('Hello John!');
  });

  it('should handle missing variables', () => {
    const template = 'Hello {first_name}!';
    const result = replaceMessageVariables(template, {});
    expect(result).toBe('Hello {first_name}!');
  });

  it('should replace multiple occurrences', () => {
    const template = '{first_name}, {first_name}, {first_name}!';
    const result = replaceMessageVariables(template, {
      first_name: 'John',
    });
    expect(result).toBe('John, John, John!');
  });
});

describe('Utils - generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate string IDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should contain timestamp and random parts', () => {
    const id = generateId();
    expect(id).toMatch(/^\d+-[a-z0-9]+$/);
  });
});

describe('Utils - debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should call with latest arguments', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('third');
  });
});

describe('Utils - sleep', () => {
  it('should return a promise', () => {
    const result = sleep(10);
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve after specified time', async () => {
    vi.useFakeTimers();
    const sleepPromise = sleep(100);
    vi.advanceTimersByTime(100);
    await sleepPromise;
    vi.useRealTimers();
    expect(true).toBe(true); // If we get here, sleep worked
  });
});

describe('Utils - arrayToCSV', () => {
  it('should convert array to CSV with headers', () => {
    const data = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Los Angeles' },
    ];
    const headers = ['name', 'age', 'city'];
    const csv = arrayToCSV(data, headers);

    expect(csv).toContain('name,age,city');
    expect(csv).toContain('John,30,New York');
    expect(csv).toContain('Jane,25,Los Angeles');
  });

  it('should escape values with commas', () => {
    const data = [{ name: 'Doe, John', age: 30 }];
    const headers = ['name', 'age'];
    const csv = arrayToCSV(data, headers);

    expect(csv).toContain('"Doe, John"');
  });

  it('should escape values with quotes', () => {
    const data = [{ name: 'John "Johnny" Doe', age: 30 }];
    const headers = ['name', 'age'];
    const csv = arrayToCSV(data, headers);

    expect(csv).toContain('"John ""Johnny"" Doe"');
  });

  it('should handle null and undefined values', () => {
    const data = [{ name: 'John', age: null, city: undefined }];
    const headers = ['name', 'age', 'city'];
    const csv = arrayToCSV(data, headers);

    expect(csv).toContain('John,,');
  });

  it('should handle empty array', () => {
    const data: any[] = [];
    const headers = ['name', 'age'];
    const csv = arrayToCSV(data, headers);

    expect(csv).toBe('name,age');
  });
});
