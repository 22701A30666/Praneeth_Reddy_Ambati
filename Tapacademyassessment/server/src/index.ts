import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import { AttendanceRecord, User } from './types';
import { loadUsers, saveUsers, loadAttendance, saveAttendance } from './storage';
import { LATE_THRESHOLD_MINUTES, ABSENT_AFTER_MINUTES, hoursBetween, minutesSinceMidnightLocal, nowISO, toISODate, uid } from './utils';

const app = express();
app.use(express.json());
app.use(morgan('dev'));
const allowedOrigins = (process.env.ALLOW_CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: false,
  })
);

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev';

// Persisted stores (JSON file-based)
const users: User[] = loadUsers();
const attendance: AttendanceRecord[] = loadAttendance();

// Seed minimal data
(function seed() {
  if (users.length) return;
  const manager: User = {
    id: uid(),
    name: 'Team Manager',
    email: 'manager@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'manager',
    employeeId: 'MGR001',
    department: 'Management',
    createdAt: nowISO(),
  };
  users.push(manager);
  for (let i = 1; i <= 5; i++) {
    users.push({
      id: uid(),
      name: `Employee ${i}`,
      email: `emp${i}@example.com`,
      passwordHash: bcrypt.hashSync('password123', 10),
      role: 'employee',
      employeeId: `EMP00${i}`,
      department: ['Engineering', 'Sales', 'Support'][i % 3],
      createdAt: nowISO(),
    });
  }
  saveUsers(users);
})();

// Helpers
const signToken = (u: User) => jwt.sign({ sub: u.id, role: u.role }, JWT_SECRET, { expiresIn: '2h' });

const authMiddleware: express.RequestHandler = (req, res, next) => {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : undefined;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
    const user = users.find((u) => u.id === payload.sub);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    (req as any).user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Schemas
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['employee', 'manager']).default('employee'),
  employeeId: z.string().min(3),
  department: z.string().min(2),
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

// Routes
app.post('/api/auth/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid body', details: parsed.error.flatten() });
  const { name, email, password, role, employeeId, department } = parsed.data;
  if (users.some((u) => u.email === email)) return res.status(409).json({ message: 'Email already exists' });
  const user: User = {
    id: uid(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    employeeId,
    department,
    createdAt: nowISO(),
  };
  users.push(user);
  saveUsers(users);
  return res.json({ user: { id: user.id, name, email, role, employeeId, department }, token: signToken(user) });
});

app.post('/api/auth/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid body' });
  const { email, password } = parsed.data;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  return res.json({ user: { id: user.id, name: user.name, email, role: user.role, employeeId: user.employeeId, department: user.department }, token: signToken(user) });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  res.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role, employeeId: u.employeeId, department: u.department } });
});

// Attendance - Employee
app.post('/api/attendance/checkin', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  const today = toISODate();
  let rec = attendance.find((r) => r.userId === u.id && r.date === today);
  if (rec?.checkInTime) return res.status(400).json({ message: 'Already checked in' });
  const now = new Date();
  const nowIso = now.toISOString();
  const mins = minutesSinceMidnightLocal(now);
  const status = mins > ABSENT_AFTER_MINUTES ? 'absent' : 'present';
  if (!rec) {
    rec = { id: uid(), userId: u.id, date: today, status, checkInTime: nowIso, createdAt: nowIso };
    attendance.push(rec);
  } else {
    rec.status = status;
    rec.checkInTime = nowIso;
  }
  saveAttendance(attendance);
  res.json({ record: rec });
});

app.post('/api/attendance/checkout', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  const today = toISODate();
  const rec = attendance.find((r) => r.userId === u.id && r.date === today);
  if (!rec?.checkInTime) return res.status(400).json({ message: 'Check in first' });
  if (rec.checkOutTime) return res.status(400).json({ message: 'Already checked out' });
  const nowIso = new Date().toISOString();
  rec.checkOutTime = nowIso;
  rec.totalHours = Number(hoursBetween(rec.checkInTime, nowIso).toFixed(2));
  if ((rec.totalHours || 0) < 4) rec.status = 'half-day';
  saveAttendance(attendance);
  res.json({ record: rec });
});

app.get('/api/attendance/my-history', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  const month = String(req.query.month || ''); // YYYY-MM
  let list = attendance.filter((r) => r.userId === u.id);
  if (month) list = list.filter((r) => r.date.startsWith(month));
  res.json({ records: list.sort((a, b) => (a.date < b.date ? 1 : -1)) });
});

app.get('/api/attendance/my-summary', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  const month = String(req.query.month || '');
  let list = attendance.filter((r) => r.userId === u.id);
  if (month) list = list.filter((r) => r.date.startsWith(month));
  const summary = list.reduce(
    (acc, r) => {
      acc[r.status]++;
      acc.totalHours += r.totalHours || 0;
      return acc;
    },
    { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 } as any
  );
  res.json({ summary });
});

app.get('/api/attendance/today', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  const today = toISODate();
  const rec = attendance.find((r) => r.userId === u.id && r.date === today);
  res.json({ record: rec || null });
});

// Manager endpoints (simple)
app.get('/api/attendance/all', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { from, to, employeeId, status } = req.query as Record<string, string>;
  let list = attendance.slice();
  if (from) list = list.filter((r) => r.date >= from);
  if (to) list = list.filter((r) => r.date <= to);
  if (employeeId) {
    const target = users.find((x) => x.employeeId === employeeId);
    if (target) list = list.filter((r) => r.userId === target.id);
  }
  if (status) list = list.filter((r) => r.status === status);
  res.json({ records: list });
});

app.get('/api/attendance/today-status', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const today = toISODate();
  const todayRecs = attendance.filter((r) => r.date === today);
  res.json({ records: todayRecs });
});

app.get('/api/attendance/employee/:id', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const empId = String(req.params.id);
  const { from, to } = req.query as Record<string, string>;
  const target = users.find((x) => x.employeeId === empId);
  if (!target) return res.status(404).json({ message: 'Not found' });
  let list = attendance.filter((r) => r.userId === target.id);
  if (from) list = list.filter((r) => r.date >= from);
  if (to) list = list.filter((r) => r.date <= to);
  res.json({ user: { id: target.id, name: target.name, employeeId: target.employeeId, department: target.department }, records: list });
});

app.get('/api/attendance/summary', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { from, to, employeeId } = req.query as Record<string, string>;
  let list = attendance.slice();
  if (from) list = list.filter((r) => r.date >= from);
  if (to) list = list.filter((r) => r.date <= to);
  if (employeeId) {
    const target = users.find((x) => x.employeeId === employeeId);
    if (target) list = list.filter((r) => r.userId === target.id);
  }
  const summary = list.reduce(
    (acc: any, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.totalHours += r.totalHours || 0;
      return acc;
    },
    { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 }
  );
  res.json({ summary });
});

app.get('/api/dashboard/employee', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'employee') return res.status(403).json({ message: 'Forbidden' });
  const today = toISODate();
  const todayRec = attendance.find((r) => r.userId === u.id && r.date === today) || null;
  const month = today.slice(0, 7);
  let list = attendance.filter((r) => r.userId === u.id && r.date.startsWith(month));
  const summary = list.reduce(
    (acc: any, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.totalHours += r.totalHours || 0;
      return acc;
    },
    { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 }
  );
  const recent = attendance
    .filter((r) => r.userId === u.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 7);
  res.json({ today: todayRec, summary, recent });
});

app.get('/api/dashboard/manager', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const totalEmployees = users.filter((x) => x.role === 'employee').length;
  const today = toISODate();
  const todayRecs = attendance.filter((r) => r.date === today);
  const presentToday = todayRecs.filter((r) => r.status === 'present').length;
  const lateToday = todayRecs.filter((r) => r.status === 'late').length;
  const absentTodayIds = new Set(users.filter((x) => x.role === 'employee').map((x) => x.id));
  for (const r of todayRecs) absentTodayIds.delete(r.userId);
  const absentList = users.filter((x) => x.role === 'employee' && absentTodayIds.has(x.id));
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  const format = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const weeklyDays: Record<string, { present: number; late: number; half: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    weeklyDays[format(d)] = { present: 0, late: 0, half: 0 };
  }
  for (const r of attendance) {
    if (r.date in weeklyDays) {
      if (r.status === 'present') weeklyDays[r.date].present++;
      if (r.status === 'late') weeklyDays[r.date].late++;
      if (r.status === 'half-day') weeklyDays[r.date].half++;
    }
  }
  const weekly = Object.entries(weeklyDays).map(([date, v]) => ({ date, ...v }));
  const month = today.slice(0, 7);
  const monthlyList = attendance.filter((r) => r.date.startsWith(month));
  const byDept: Record<string, number> = {};
  for (const r of monthlyList) {
    const usr = users.find((x) => x.id === r.userId);
    const dept = usr?.department || 'Unknown';
    if (r.status === 'present' || r.status === 'late' || r.status === 'half-day') byDept[dept] = (byDept[dept] || 0) + 1;
  }
  const departments = Object.entries(byDept).map(([department, count]) => ({ department, count }));
  res.json({ totalEmployees, presentToday, lateToday, absentList, weekly, departments });
});

// List users (manager only)
app.get('/api/users', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  res.json({ users: users.map(({ passwordHash, ...rest }) => rest) });
});

// Export attendance as CSV (manager)
app.get('/api/attendance/export', authMiddleware, (req, res) => {
  const u = (req as any).user as User;
  if (u.role !== 'manager') return res.status(403).json({ message: 'Forbidden' });
  const { from, to, employeeId } = req.query as Record<string, string>;
  let list = attendance.slice();
  if (from) list = list.filter((r) => r.date >= from);
  if (to) list = list.filter((r) => r.date <= to);
  if (employeeId) {
    const target = users.find((x) => x.employeeId === employeeId);
    if (target) list = list.filter((r) => r.userId === target.id);
  }
  const header = 'employeeId,name,date,status,checkInTime,checkOutTime,totalHours\n';
  const body = list
    .map((r) => {
      const u = users.find((x) => x.id === r.userId)!;
      return [u.employeeId, u.name, r.date, r.status, r.checkInTime || '', r.checkOutTime || '', r.totalHours ?? ''].join(',');
    })
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send(header + body);
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
