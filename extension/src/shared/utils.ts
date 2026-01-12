import clsx, { ClassValue } from 'clsx';
import { format } from 'date-fns';

/**
 * Utility function to merge class names
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string, formatString = 'PPP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Google Sheets URL
 */
export function isValidGoogleSheetUrl(url: string): boolean {
  const sheetsRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/;
  return sheetsRegex.test(url);
}

/**
 * Extract spreadsheet ID from Google Sheets URL
 */
export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Replace template variables in message
 */
export function replaceMessageVariables(
  template: string,
  variables: {
    first_name?: string;
    last_name?: string;
    group_name?: string;
  }
): string {
  let message = template;

  if (variables.first_name) {
    message = message.replace(/{first_name}/g, variables.first_name);
  }
  if (variables.last_name) {
    message = message.replace(/{last_name}/g, variables.last_name);
  }
  if (variables.group_name) {
    message = message.replace(/{group_name}/g, variables.group_name);
  }

  return message;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
