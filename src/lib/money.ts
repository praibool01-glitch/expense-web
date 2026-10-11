// เงินในระบบเป็นสตางค์ (จำนวนเต็ม) แปลงเป็นบาทตอนแสดงผลเท่านั้น
const fmt = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatBaht = (satang: number) => `฿${fmt.format(satang / 100)}`;

// แปลงข้อความที่พิมพ์ (บาท) เป็นสตางค์ ไม่ใช้ float: '1,500.5' -> 150050
// คืน null ถ้าไม่ใช่ตัวเลขที่ถูกต้อง
export function parseBaht(input: string): number | null {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(input.replace(/[,\s]/g, ''));
  if (!m) return null;
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
}

// สตางค์ -> ข้อความสำหรับใส่ในช่อง input ตอนแก้ไข: 150000 -> '1500', 150050 -> '1500.50'
export const toBahtInput = (satang: number) =>
  satang % 100 === 0 ? String(satang / 100) : (satang / 100).toFixed(2);
