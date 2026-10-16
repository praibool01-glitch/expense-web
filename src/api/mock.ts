// ข้อมูลปลอมที่ทำงานเหมือน backend ตาม API contract
// ตอนมี backend จริง เขียน api/http.ts ที่มีฟังก์ชันชื่อเดียวกัน แล้วเปลี่ยน export ใน api/index.ts
import type {
  Category,
  Entry,
  EntryInput,
  EntryPatch,
  Income,
  IncomeInput,
  IncomePatch,
  MonthResponse,
  Household,
  HouseholdRef,
  Invite,
} from '../types';
import { toMonthKey } from '../lib/month';

type Row = Omit<Entry, 'totalSatang' | 'children'> & { month: string };

const MONTH = toMonthKey(new Date()); // ให้เดือนปัจจุบันมีข้อมูลตัวอย่างเสมอ

const categories: Category[] = [
  { id: 'fix', name: 'ค่าใช้จ่ายคงที่', color: '#E07A6B' },
  { id: 'food', name: 'ค่ากิน', color: '#5FB59E' },
  { id: 'trip', name: 'ค่าเที่ยว', color: '#B493C4' },
  { id: 'misc', name: 'ของใช้จุกจิก', color: '#E3B948' },
];

let seq = 0;
const row = (o: Partial<Row> & Pick<Row, 'name'>): Row => {
  seq += 1;
  return {
    id: `e${seq}`,
    month: MONTH,
    parentId: null,
    amountSatang: null,
    categoryId: null,
    note: null,
    isPaid: false,
    createdBy: null,
    sortOrder: seq,
    createdAt: new Date().toISOString(),
    ...o,
  };
};

const ttb = row({ name: 'บัตร ttb', categoryId: 'fix' });
const rows: Row[] = [
  row({ name: 'ผ่อนบ้าน', amountSatang: 1500000, categoryId: 'fix', isPaid: true }),
  ttb,
  row({ parentId: ttb.id, name: 'นม', amountSatang: 234000, isPaid: true }),
  row({ parentId: ttb.id, name: 'แพมเพิส', amountSatang: 150000 }),
  row({ parentId: ttb.id, name: 'ผ่อนประกัน', amountSatang: 60020, note: 'เหลือ 2 เดือน' }),
  row({ parentId: ttb.id, name: 'ขนม', amountSatang: 60000 }),
  row({ name: 'ค่าไฟ', amountSatang: 250000, categoryId: 'fix' }),
  row({ name: 'ค่าน้ำ', amountSatang: 10000, categoryId: 'fix' }),
  row({ name: 'ค่ากิน', amountSatang: 1680000, categoryId: 'food', note: 'วีคละ 4,200' }),
  row({ name: 'ค่าเที่ยว เสาร์-อาทิตย์', amountSatang: 600000, categoryId: 'trip', note: 'วีคละ 1,500' }),
  row({ name: 'ของใช้จุกจิก', amountSatang: 200000, categoryId: 'misc' }),
];

const incomes: (Income & { month: string })[] = [
  {
    id: 'i1',
    month: MONTH,
    name: 'เงินเดือน',
    amountSatang: 7791100,
    createdBy: null,
    createdAt: new Date().toISOString(),
  },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const byNewest = (a: Row, b: Row) =>
  b.createdAt.localeCompare(a.createdAt) || b.sortOrder - a.sortOrder;

export async function getCategories(): Promise<Category[]> {
  await sleep(150);
  return categories.map((c) => ({ ...c }));
}

export async function getMonth(month: string): Promise<MonthResponse> {
  await sleep(250);
  const monthRows = rows.filter((r) => r.month === month);
  const byId = new Map(monthRows.map((r) => [r.id, r]));

  const toEntry = (r: Row): Entry => {
    const kids = monthRows.filter((c) => c.parentId === r.id).sort(byNewest).map(toEntry);
    const total = kids.length
      ? kids.reduce((sum, k) => sum + k.totalSatang, 0)
      : (r.amountSatang ?? 0);
    return { ...r, totalSatang: total, ...(kids.length ? { children: kids } : {}) };
  };

  const entries = monthRows
    .filter((r) => r.parentId === null)
    .sort(byNewest)
    .map(toEntry);

  // สรุปตามหมวด: นับเฉพาะแถวที่มียอด และใช้หมวดของแม่ถ้าลูกไม่มีหมวด
  const acc = new Map<string | null, { totalSatang: number; paidSatang: number }>();
  for (const r of monthRows) {
    if (r.amountSatang === null) continue;
    const parentCat = r.parentId ? (byId.get(r.parentId)?.categoryId ?? null) : null;
    const key = r.categoryId ?? parentCat;
    const cur = acc.get(key) ?? { totalSatang: 0, paidSatang: 0 };
    cur.totalSatang += r.amountSatang;
    if (r.isPaid) cur.paidSatang += r.amountSatang;
    acc.set(key, cur);
  }
  const byCategory = [...acc].map(([categoryId, v]) => ({ categoryId, ...v }));

  const totalExpenseSatang = byCategory.reduce((s, c) => s + c.totalSatang, 0);
  const totalPaidSatang = byCategory.reduce((s, c) => s + c.paidSatang, 0);
  const monthIncomes = incomes.filter((i) => i.month === month);
  const totalIncomeSatang = monthIncomes.reduce((s, i) => s + i.amountSatang, 0);

  return {
    month,
    entries,
    incomes: monthIncomes.map(({ id, name, amountSatang, createdBy, createdAt }) => ({
      id,
      name,
      amountSatang,
      createdBy,
      createdAt,
    })),
    summary: {
      totalExpenseSatang,
      totalPaidSatang,
      totalIncomeSatang,
      remainingSatang: totalIncomeSatang - totalExpenseSatang,
      byCategory,
    },
  };
}

export async function patchEntry(id: string, patch: EntryPatch): Promise<void> {
  await sleep(150);
  const target = rows.find((r) => r.id === id);
  if (!target) throw new Error('NOT_FOUND');
  Object.assign(target, patch);
}

export async function createEntry(input: EntryInput): Promise<void> {
  await sleep(150);
  if (!input.name.trim()) throw new Error('VALIDATION_ERROR');
  if (input.parentId) {
    // กฎเดียวกับ backend: แม่ต้องเป็นแถวระดับบนสุดที่ไม่มียอด และอยู่ในเดือนเดียวกัน
    const parent = rows.find((r) => r.id === input.parentId && r.month === input.month);
    if (!parent || parent.parentId !== null || parent.amountSatang !== null) {
      throw new Error('VALIDATION_ERROR');
    }
  }
  rows.push(
    row({
      month: input.month,
      parentId: input.parentId ?? null,
      name: input.name.trim(),
      amountSatang: input.amountSatang ?? null,
      categoryId: input.categoryId ?? null,
      note: input.note ?? null,
      isPaid: input.isPaid ?? false,
    }),
  );
}

// ลบแม่แล้วลูกหายตามไปด้วย
export async function deleteEntry(id: string): Promise<void> {
  await sleep(150);
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    if (rows[i].id === id || rows[i].parentId === id) rows.splice(i, 1);
  }
}

// ---------- เงินเข้า ----------
let incomeSeq = 1; // i1 ถูกใช้ไปแล้วในข้อมูลตัวอย่าง

const validAmount = (n: number) => Number.isInteger(n) && n >= 0;

export async function createIncome(input: IncomeInput): Promise<void> {
  await sleep(150);
  if (!input.name.trim() || !validAmount(input.amountSatang)) throw new Error('VALIDATION_ERROR');
  incomeSeq += 1;
  incomes.push({
    id: `i${incomeSeq}`,
    month: input.month,
    name: input.name.trim(),
    amountSatang: input.amountSatang,
    createdBy: null,
    createdAt: new Date().toISOString(),
  });
}

export async function patchIncome(id: string, patch: IncomePatch): Promise<void> {
  await sleep(150);
  const target = incomes.find((i) => i.id === id);
  if (!target) throw new Error('NOT_FOUND');
  if (patch.amountSatang !== undefined && !validAmount(patch.amountSatang)) {
    throw new Error('VALIDATION_ERROR');
  }
  Object.assign(target, patch);
}

export async function deleteIncome(id: string): Promise<void> {
  await sleep(150);
  const i = incomes.findIndex((x) => x.id === id);
  if (i >= 0) incomes.splice(i, 1);
}

// ---------- ครอบครัว (โหมดข้อมูลปลอมมีสมาชิกคนเดียว) ----------
let householdName = 'บ้านของเรา';

export async function getHousehold(): Promise<Household> {
  await sleep(150);
  return {
    id: 'h1',
    name: householdName,
    myRole: 'owner',
    members: [{ userId: 'u1', displayName: 'คุณ', role: 'owner', isMe: true }],
  };
}

export async function renameHousehold(name: string): Promise<void> {
  await sleep(150);
  householdName = name;
}

export async function createInvite(): Promise<Invite> {
  await sleep(150);
  return {
    code: 'mock-code',
    url: `${window.location.origin}/?invite=mock-code`,
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  };
}

export async function acceptInvite(_code: string): Promise<HouseholdRef> {
  throw new Error('โหมดข้อมูลปลอมรับคำเชิญไม่ได้');
}

export async function removeMember(_userId: string): Promise<void> {
  throw new Error('โหมดข้อมูลปลอมไม่มีสมาชิกคนอื่น');
}
