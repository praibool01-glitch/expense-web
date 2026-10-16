// Types ตาม API contract (หัวข้อ TypeScript types) ใช้ร่วมกันทั้ง mock และ API จริง

export type Category = { id: string; name: string; color: string };

export type Entry = {
  id: string;
  parentId: string | null;
  name: string;
  amountSatang: number | null; // แถวแม่เป็น null
  totalSatang: number; // แถวแม่ = ผลรวมของลูก (backend คำนวณ)
  categoryId: string | null; // ลูกที่เป็น null ใช้หมวดของแม่
  note: string | null;
  isPaid: boolean;
  createdBy: string | null;
  sortOrder: number;
  createdAt: string;
  children?: Entry[];
};

export type Income = {
  id: string;
  name: string;
  amountSatang: number;
  createdBy: string | null;
  createdAt: string | null;
};

export type MonthSummary = {
  totalExpenseSatang: number;
  totalPaidSatang: number;
  totalIncomeSatang: number;
  remainingSatang: number;
  byCategory: { categoryId: string | null; totalSatang: number; paidSatang: number }[];
};

export type MonthResponse = {
  month: string; // 'YYYY-MM'
  entries: Entry[];
  incomes: Income[];
  summary: MonthSummary;
};

export type EntryInput = {
  month: string; // ใช้ตอนสร้างเท่านั้น
  parentId?: string | null;
  name: string;
  amountSatang?: number | null;
  categoryId?: string | null;
  note?: string | null;
  isPaid?: boolean;
};

export type EntryPatch = Partial<
  Pick<Entry, 'name' | 'amountSatang' | 'categoryId' | 'note' | 'isPaid' | 'parentId'>
>;

export type IncomeInput = {
  month: string; // ใช้ตอนสร้างเท่านั้น
  name: string;
  amountSatang: number;
};

export type IncomePatch = Partial<Pick<Income, 'name' | 'amountSatang'>>;

export type HouseholdMember = {
  userId: string;
  displayName: string | null;
  role: 'owner' | 'member';
  isMe: boolean;
};

export type Household = {
  id: string;
  name: string;
  myRole: 'owner' | 'member';
  members: HouseholdMember[];
};

export type HouseholdRef = { id: string; name: string; role: 'owner' | 'member' };

export type Invite = { code: string; url: string; expiresAt: string };
