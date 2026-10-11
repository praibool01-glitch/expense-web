// เก็บรหัสเชิญจาก URL (?invite=...) ไว้ชั่วคราว เพราะคนที่เปิดลิงก์อาจต้องล็อกอินก่อน
const KEY = 'expense.invite';
let memoryInvite: string | null = null;

export function captureInviteFromUrl() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('invite');
  if (!code) return;

  memoryInvite = code;
  try {
    sessionStorage.setItem(KEY, code);
  } catch {
    /* ใช้ค่าในหน่วยความจำแทน */
  }
  // เอารหัสออกจาก URL จะได้ไม่ถูกใช้ซ้ำตอนรีเฟรช/แชร์หน้านี้ต่อ
  url.searchParams.delete('invite');
  window.history.replaceState(null, '', url.toString());
}

// อ่านแล้วลบทิ้งทันที ใช้ได้ครั้งเดียว
export function takePendingInvite(): string | null {
  let code = memoryInvite;
  memoryInvite = null;
  try {
    code = sessionStorage.getItem(KEY) ?? code;
    sessionStorage.removeItem(KEY);
  } catch {
    /* ไม่มีอะไรต้องทำ */
  }
  return code;
}
