import crypto from 'node:crypto';

export const uid = () => crypto.randomUUID();

export const toISODate = (d = new Date()): string => {
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
  return iso; // YYYY-MM-DD
};

export const nowISO = () => new Date().toISOString();

export const hoursBetween = (startISO: string, endISO: string): number => {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  return Math.max(0, (end - start) / 3600000);
};

export const LATE_THRESHOLD_MINUTES = 9 * 60 + 30; // 09:30
export const ABSENT_AFTER_MINUTES = 9 * 60; // 09:00

export const minutesSinceMidnightUTC = (d = new Date()): number => {
  const utcHours = d.getUTCHours();
  const utcMinutes = d.getUTCMinutes();
  return utcHours * 60 + utcMinutes;
};

export const minutesSinceMidnightLocal = (d = new Date()): number => {
  const h = d.getHours();
  const m = d.getMinutes();
  return h * 60 + m;
};
