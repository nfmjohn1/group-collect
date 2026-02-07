export interface MemberData {
  id: string;
  timestamp: string;
  firstName: string;
  lastName: string;
  fullName: string;
  profileUrl: string;
  userId: string;
  email?: string;
  question1?: string;
  answer1?: string;
  question2?: string;
  answer2?: string;
  question3?: string;
  answer3?: string;
  groupName: string;
  joinedFacebook?: string;
  city?: string;
}

export interface StorageData {
  members: MemberData[];
  googleSheetUrl?: string;
}

export interface Message {
  type: 'CAPTURE_MEMBER' | 'GET_DATA' | 'CLEAR_DATA' | 'SAVE_SETTINGS' | 'GET_SETTINGS' | 'PAGE_DETECTED' | 'PUSH_TO_SHEET';
  payload?: any;
}

export interface MessageResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ExtensionSettings {
  googleSheetUrl?: string;
}
