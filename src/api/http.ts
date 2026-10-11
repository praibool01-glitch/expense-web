// เรียก backend จริงตาม API contract ฟังก์ชันชื่อและรูปแบบเดียวกับ api/mock.ts
import type {
  Category,
  Household,
  HouseholdRef,
  Invite,
  EntryInput,
  EntryPatch,
  IncomeInput,
  IncomePatch,
  MonthResponse,
} from '../types';
import { AUTH_EXPIRED, clearToken, getToken } from '../auth/session';

const BASE = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/v1`;

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // session หมดอายุ/ไม่ถูกต้อง: ล้าง token แล้วให้ AuthGate พากลับไปหน้าเข้าสู่ระบบ
    if (res.status === 401 && auth) {
      clearToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED));
    }
    const e = data?.error;
    throw new ApiError(res.status, e?.code ?? 'UNKNOWN', e?.message ?? 'เกิดข้อผิดพลาด', e?.fields);
  }
  return data as T;
}

// ---------- auth ----------
type LoginResult = {
  token: string;
  user: { id: string; displayName: string | null };
  household: { id: string; name: string; role: string };
};

// ล็อกอินแบบทดสอบ (backend ต้องเปิด DEV_AUTH=true) ตอนต่อ LIFF จะใช้ POST /auth/line แทน
export const devLogin = (lineUserId: string, displayName?: string) =>
  request<LoginResult>('POST', '/auth/dev', { lineUserId, displayName }, false);

// ---------- ข้อมูล ----------
export const getCategories = () => request<Category[]>('GET', '/categories');

export const getMonth = (month: string) => request<MonthResponse>('GET', `/months/${month}`);

export async function createEntry(input: EntryInput): Promise<void> {
  await request('POST', '/entries', input);
}
export async function patchEntry(id: string, patch: EntryPatch): Promise<void> {
  await request('PATCH', `/entries/${id}`, patch);
}
export const deleteEntry = (id: string) => request<void>('DELETE', `/entries/${id}`);

export async function createIncome(input: IncomeInput): Promise<void> {
  await request('POST', '/incomes', input);
}
export async function patchIncome(id: string, patch: IncomePatch): Promise<void> {
  await request('PATCH', `/incomes/${id}`, patch);
}
export const deleteIncome = (id: string) => request<void>('DELETE', `/incomes/${id}`);

// ---------- ครอบครัว ----------
export const getHousehold = () => request<Household>('GET', '/household');
export async function renameHousehold(name: string): Promise<void> {
  await request('PATCH', '/household', { name });
}
export const createInvite = () => request<Invite>('POST', '/household/invites');
export const acceptInvite = (code: string) =>
  request<HouseholdRef>('POST', '/invites/accept', { code });
export const removeMember = (userId: string) =>
  request<void>('DELETE', `/household/members/${userId}`);
