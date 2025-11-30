"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const storage_1 = require("./storage");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
const allowedOrigins = (process.env.ALLOW_CORS_ORIGINS || '').split(',').filter(Boolean);
app.use((0, cors_1.default)({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: false,
}));
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev';
// Persisted stores (JSON file-based)
const users = (0, storage_1.loadUsers)();
const attendance = (0, storage_1.loadAttendance)();
// Seed minimal data
(function seed() {
    if (users.length)
        return;
    const manager = {
        id: (0, utils_1.uid)(),
        name: 'Team Manager',
        email: 'manager@example.com',
        passwordHash: bcryptjs_1.default.hashSync('password123', 10),
        role: 'manager',
        employeeId: 'MGR001',
        department: 'Management',
        createdAt: (0, utils_1.nowISO)(),
    };
    users.push(manager);
    for (let i = 1; i <= 5; i++) {
        users.push({
            id: (0, utils_1.uid)(),
            name: `Employee ${i}`,
            email: `emp${i}@example.com`,
            passwordHash: bcryptjs_1.default.hashSync('password123', 10),
            role: 'employee',
            employeeId: `EMP00${i}`,
            department: ['Engineering', 'Sales', 'Support'][i % 3],
            createdAt: (0, utils_1.nowISO)(),
        });
    }
    (0, storage_1.saveUsers)(users);
})();
// Helpers
const signToken = (u) => jsonwebtoken_1.default.sign({ sub: u.id, role: u.role }, JWT_SECRET, { expiresIn: '2h' });
const authMiddleware = (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : undefined;
    if (!token)
        return res.status(401).json({ message: 'Missing token' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = users.find((u) => u.id === payload.sub);
        if (!user)
            return res.status(401).json({ message: 'Invalid token' });
        req.user = user;
        next();
    }
    catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
// Schemas
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    role: zod_1.z.enum(['employee', 'manager']).default('employee'),
    employeeId: zod_1.z.string().min(3),
    department: zod_1.z.string().min(2),
});
const loginSchema = zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string().min(8) });
// Routes
app.post('/api/auth/register', (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: 'Invalid body', details: parsed.error.flatten() });
    const { name, email, password, role, employeeId, department } = parsed.data;
    if (users.some((u) => u.email === email))
        return res.status(409).json({ message: 'Email already exists' });
    const user = {
        id: (0, utils_1.uid)(),
        name,
        email,
        passwordHash: bcryptjs_1.default.hashSync(password, 10),
        role,
        employeeId,
        department,
        createdAt: (0, utils_1.nowISO)(),
    };
    users.push(user);
    (0, storage_1.saveUsers)(users);
    return res.json({ user: { id: user.id, name, email, role, employeeId, department }, token: signToken(user) });
});
app.post('/api/auth/login', (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: 'Invalid body' });
    const { email, password } = parsed.data;
    const user = users.find((u) => u.email === email);
    if (!user)
        return res.status(401).json({ message: 'Invalid credentials' });
    const ok = bcryptjs_1.default.compareSync(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ message: 'Invalid credentials' });
    return res.json({ user: { id: user.id, name: user.name, email, role: user.role, employeeId: user.employeeId, department: user.department }, token: signToken(user) });
});
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const u = req.user;
    res.json({ user: { id: u.id, name: u.name, email: u.email, role: u.role, employeeId: u.employeeId, department: u.department } });
});
// Attendance - Employee
app.post('/api/attendance/checkin', authMiddleware, (req, res) => {
    const u = req.user;
    const today = (0, utils_1.toISODate)();
    let rec = attendance.find((r) => r.userId === u.id && r.date === today);
    if (rec?.checkInTime)
        return res.status(400).json({ message: 'Already checked in' });
    const now = new Date();
    const nowIso = now.toISOString();
    const mins = (0, utils_1.minutesSinceMidnightUTC)(now);
    const status = mins > utils_1.LATE_THRESHOLD_MINUTES ? 'late' : 'present';
    if (!rec) {
        rec = { id: (0, utils_1.uid)(), userId: u.id, date: today, status, checkInTime: nowIso, createdAt: nowIso };
        attendance.push(rec);
    }
    else {
        rec.status = status;
        rec.checkInTime = nowIso;
    }
    (0, storage_1.saveAttendance)(attendance);
    res.json({ record: rec });
});
app.post('/api/attendance/checkout', authMiddleware, (req, res) => {
    const u = req.user;
    const today = (0, utils_1.toISODate)();
    const rec = attendance.find((r) => r.userId === u.id && r.date === today);
    if (!rec?.checkInTime)
        return res.status(400).json({ message: 'Check in first' });
    if (rec.checkOutTime)
        return res.status(400).json({ message: 'Already checked out' });
    const nowIso = new Date().toISOString();
    rec.checkOutTime = nowIso;
    rec.totalHours = Number((0, utils_1.hoursBetween)(rec.checkInTime, nowIso).toFixed(2));
    if ((rec.totalHours || 0) < 4)
        rec.status = 'half-day';
    (0, storage_1.saveAttendance)(attendance);
    res.json({ record: rec });
});
app.get('/api/attendance/my-history', authMiddleware, (req, res) => {
    const u = req.user;
    const month = String(req.query.month || ''); // YYYY-MM
    let list = attendance.filter((r) => r.userId === u.id);
    if (month)
        list = list.filter((r) => r.date.startsWith(month));
    res.json({ records: list.sort((a, b) => (a.date < b.date ? 1 : -1)) });
});
app.get('/api/attendance/my-summary', authMiddleware, (req, res) => {
    const u = req.user;
    const month = String(req.query.month || '');
    let list = attendance.filter((r) => r.userId === u.id);
    if (month)
        list = list.filter((r) => r.date.startsWith(month));
    const summary = list.reduce((acc, r) => {
        acc[r.status]++;
        acc.totalHours += r.totalHours || 0;
        return acc;
    }, { present: 0, absent: 0, late: 0, 'half-day': 0, totalHours: 0 });
    res.json({ summary });
});
app.get('/api/attendance/today', authMiddleware, (req, res) => {
    const u = req.user;
    const today = (0, utils_1.toISODate)();
    const rec = attendance.find((r) => r.userId === u.id && r.date === today);
    res.json({ record: rec || null });
});
// Manager endpoints (simple)
app.get('/api/attendance/all', authMiddleware, (req, res) => {
    const u = req.user;
    if (u.role !== 'manager')
        return res.status(403).json({ message: 'Forbidden' });
    const { from, to, employeeId, status } = req.query;
    let list = attendance.slice();
    if (from)
        list = list.filter((r) => r.date >= from);
    if (to)
        list = list.filter((r) => r.date <= to);
    if (employeeId) {
        const target = users.find((x) => x.employeeId === employeeId);
        if (target)
            list = list.filter((r) => r.userId === target.id);
    }
    if (status)
        list = list.filter((r) => r.status === status);
    res.json({ records: list });
});
app.get('/api/attendance/today-status', authMiddleware, (req, res) => {
    const u = req.user;
    if (u.role !== 'manager')
        return res.status(403).json({ message: 'Forbidden' });
    const today = (0, utils_1.toISODate)();
    const todayRecs = attendance.filter((r) => r.date === today);
    res.json({ records: todayRecs });
});
// List users (manager only)
app.get('/api/users', authMiddleware, (req, res) => {
    const u = req.user;
    if (u.role !== 'manager')
        return res.status(403).json({ message: 'Forbidden' });
    res.json({ users: users.map(({ passwordHash, ...rest }) => rest) });
});
// Export attendance as CSV (manager)
app.get('/api/attendance/export', authMiddleware, (req, res) => {
    const u = req.user;
    if (u.role !== 'manager')
        return res.status(403).json({ message: 'Forbidden' });
    const { from, to, employeeId } = req.query;
    let list = attendance.slice();
    if (from)
        list = list.filter((r) => r.date >= from);
    if (to)
        list = list.filter((r) => r.date <= to);
    if (employeeId) {
        const target = users.find((x) => x.employeeId === employeeId);
        if (target)
            list = list.filter((r) => r.userId === target.id);
    }
    const header = 'employeeId,name,date,status,checkInTime,checkOutTime,totalHours\n';
    const body = list
        .map((r) => {
        const u = users.find((x) => x.id === r.userId);
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
