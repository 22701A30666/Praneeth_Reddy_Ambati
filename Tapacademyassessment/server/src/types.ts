export type Role = 'employee' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  employeeId: string;
  department: string;
  createdAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half-day';

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD (UTC)
  checkInTime?: string; // ISO
  checkOutTime?: string; // ISO
  status: AttendanceStatus;
  totalHours?: number; // decimal hours
  createdAt: string;
}