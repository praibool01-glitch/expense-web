// เก็บ session token ไว้ใน localStorage (ถ้าใช้ไม่ได้ เช่น โหมด private จะเก็บในหน่วยความจำแทน)
const KEY = 'expense.token';
export const AUTH_EXPIRED = 'auth:expired';

let memoryToken: string | null = null;

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
}

export function setToken(token: string) {
  memoryToken = token;
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* ใช้ค่าในหน่วยความจำแทน */
  }
}

export function clearToken() {
  memoryToken = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ไม่มีอะไรต้องทำ */
  }
}
