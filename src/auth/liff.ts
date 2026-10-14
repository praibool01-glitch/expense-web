import { captureInviteFromUrl } from './invite';

// LIFF ID ของ LIFF app (ได้จาก LINE Developers Console) ถ้าไม่ตั้งจะใช้หน้าล็อกอินทดสอบแทน
export const LIFF_ID: string = import.meta.env.VITE_LIFF_ID ?? '';

// คืน LINE ID token ของผู้ใช้ หรือ null ถ้ากำลังพาไปหน้าล็อกอินของ LINE (หน้าจะโหลดใหม่เมื่อกลับมา)
export async function getLiffIdToken(): Promise<string | null> {
  // โหลด SDK เฉพาะตอนใช้ ไม่ให้โหมดทดสอบต้องแบกไปด้วย
  const { default: liff } = await import('@line/liff');
  await liff.init({ liffId: LIFF_ID, withLoginOnExternalBrowser: true });

  // ลิงก์เชิญอาจมาถึงพร้อม query ที่ LIFF เพิ่งคืนค่าให้หลัง init จึงเก็บอีกครั้งตรงนี้
  captureInviteFromUrl();

  if (!liff.isLoggedIn()) {
    liff.login();
    return null;
  }
  const idToken = liff.getIDToken();
  if (!idToken) {
    throw new Error('ไม่ได้รับ ID token ตรวจว่าเปิด scope openid ใน LIFF app แล้ว');
  }
  return idToken;
}
