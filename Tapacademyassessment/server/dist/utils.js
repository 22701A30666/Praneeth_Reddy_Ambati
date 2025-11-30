"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.minutesSinceMidnightUTC = exports.LATE_THRESHOLD_MINUTES = exports.hoursBetween = exports.nowISO = exports.toISODate = exports.uid = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const uid = () => node_crypto_1.default.randomUUID();
exports.uid = uid;
const toISODate = (d = new Date()) => {
    const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10);
    return iso; // YYYY-MM-DD
};
exports.toISODate = toISODate;
const nowISO = () => new Date().toISOString();
exports.nowISO = nowISO;
const hoursBetween = (startISO, endISO) => {
    const start = new Date(startISO).getTime();
    const end = new Date(endISO).getTime();
    return Math.max(0, (end - start) / 3600000);
};
exports.hoursBetween = hoursBetween;
exports.LATE_THRESHOLD_MINUTES = 9 * 60 + 30; // 09:30
const minutesSinceMidnightUTC = (d = new Date()) => {
    const utcHours = d.getUTCHours();
    const utcMinutes = d.getUTCMinutes();
    return utcHours * 60 + utcMinutes;
};
exports.minutesSinceMidnightUTC = minutesSinceMidnightUTC;
