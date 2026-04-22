export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isPhone = (s: string) => /^\+?[0-9\-\s]{10,15}$/.test(s);
export const isStrongPassword = (s: string) => s.length >= 8;
