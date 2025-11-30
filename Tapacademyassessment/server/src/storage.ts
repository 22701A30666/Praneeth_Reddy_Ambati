import fs from 'node:fs';
import path from 'node:path';
import { AttendanceRecord, User } from './types';

const dataDir = path.join(__dirname, '..', 'data');
const usersPath = path.join(dataDir, 'users.json');
const attendancePath = path.join(dataDir, 'attendance.json');

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function loadUsers(): User[] {
  try {
    if (fs.existsSync(usersPath)) {
      const raw = fs.readFileSync(usersPath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load users.json', e);
  }
  return [];
}

export function saveUsers(users: User[]) {
  try {
    ensureDir();
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Failed to save users.json', e);
  }
}

export function loadAttendance(): AttendanceRecord[] {
  try {
    if (fs.existsSync(attendancePath)) {
      const raw = fs.readFileSync(attendancePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load attendance.json', e);
  }
  return [];
}

export function saveAttendance(records: AttendanceRecord[]) {
  try {
    ensureDir();
    fs.writeFileSync(attendancePath, JSON.stringify(records, null, 2));
  } catch (e) {
    console.error('Failed to save attendance.json', e);
  }
}