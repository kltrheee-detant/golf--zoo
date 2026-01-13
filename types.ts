
export const AttendanceStatus = {
  ATTENDING: '참석',
  ABSENT: '불참',
  PENDING: '미정'
} as const;

export type AttendanceStatusType = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export interface Member {
  id: string;
  name: string;
  role: '회장' | '총무' | '회원';
  phoneNumber: string;
}

export interface Meeting {
  id: string;
  date: string;
  location: string;
  attendance: Record<string, AttendanceStatusType>;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  isImportant: boolean;
}

export interface FinancialRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
}

export type ViewType = 'DASHBOARD' | 'ATTENDANCE' | 'NOTICES' | 'FINANCES' | 'MEMBERS';
