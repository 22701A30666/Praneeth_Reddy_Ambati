"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUsers = loadUsers;
exports.saveUsers = saveUsers;
exports.loadAttendance = loadAttendance;
exports.saveAttendance = saveAttendance;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const dataDir = node_path_1.default.join(__dirname, '..', 'data');
const usersPath = node_path_1.default.join(dataDir, 'users.json');
const attendancePath = node_path_1.default.join(dataDir, 'attendance.json');
function ensureDir() {
    if (!node_fs_1.default.existsSync(dataDir))
        node_fs_1.default.mkdirSync(dataDir, { recursive: true });
}
function loadUsers() {
    try {
        if (node_fs_1.default.existsSync(usersPath)) {
            const raw = node_fs_1.default.readFileSync(usersPath, 'utf-8');
            return JSON.parse(raw);
        }
    }
    catch (e) {
        console.error('Failed to load users.json', e);
    }
    return [];
}
function saveUsers(users) {
    try {
        ensureDir();
        node_fs_1.default.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    }
    catch (e) {
        console.error('Failed to save users.json', e);
    }
}
function loadAttendance() {
    try {
        if (node_fs_1.default.existsSync(attendancePath)) {
            const raw = node_fs_1.default.readFileSync(attendancePath, 'utf-8');
            return JSON.parse(raw);
        }
    }
    catch (e) {
        console.error('Failed to load attendance.json', e);
    }
    return [];
}
function saveAttendance(records) {
    try {
        ensureDir();
        node_fs_1.default.writeFileSync(attendancePath, JSON.stringify(records, null, 2));
    }
    catch (e) {
        console.error('Failed to save attendance.json', e);
    }
}
