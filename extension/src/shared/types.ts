// User and Authentication Types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
}

// Member Request Types
export interface MemberRequest {
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

// Settings Types
export interface UserSettings {
  id?: string;
  userId?: string;
  googleSheetUrl?: string;
  selectedGroupId?: string;
  activeDeclineFeature: boolean;
  declineRules: DeclineRules;
  sendWelcomeMessage: boolean;
  messageIntervalMins: number;
  maxMessages: number;
  messageTemplate: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DeclineRules {
  declineIfEmailMissing?: boolean;
  requiredQuestions?: string[];
  customRules?: string[];
}

// Message Types
export interface MessageLog {
  id: string;
  userId: string;
  memberId: string;
  messageContent: string;
  sentAt: Date;
  status: 'sent' | 'failed';
}

// Decline Log Types
export interface DeclineLog {
  id: string;
  userId: string;
  memberId: string;
  declineReason: string;
  declinedAt: Date;
}

// Facebook Group Types
export interface FacebookGroup {
  id: string;
  name: string;
  url: string;
}

// Google Sheets Types
export interface SheetsData {
  range: string;
  values: any[][];
}

// Navigation Types
export type NavigationPage = 'HOME' | 'PLAN' | 'LINKS' | 'SETTINGS' | 'MESSAGE';
