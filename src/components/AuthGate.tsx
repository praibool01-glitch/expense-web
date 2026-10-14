import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isMock } from '../api';
import { AUTH_EXPIRED, clearToken, getToken } from '../auth/session';
import { LIFF_ID } from '../auth/liff';
import { DevLogin } from './DevLogin';
import { LiffLogin } from './LiffLogin';
import { InviteHandler } from './InviteHandler';

// ถ้ายังไม่ล็อกอินให้แสดงหน้าเข้าสู่ระบบ ถ้าล็อกอินแล้วแสดงแอพ
export function AuthGate({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [token, setTokenState] = useState(getToken);

  // backend ตอบ 401 (session หมดอายุ) -> api/http.ts ส่ง event นี้มา
  useEffect(() => {
    const onExpired = () => {
      qc.clear();
      setTokenState(null);
    };
    window.addEventListener(AUTH_EXPIRED, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED, onExpired);
  }, [qc]);

  if (isMock) return <>{children}</>;
  if (!token) {
    // ตั้ง VITE_LIFF_ID แล้วใช้ล็อกอิน LINE จริง ถ้าไม่ตั้งใช้หน้าทดสอบ
    return LIFF_ID ? (
      <LiffLogin onLoggedIn={setTokenState} />
    ) : (
      <DevLogin onLoggedIn={setTokenState} />
    );
  }

  function logout() {
    clearToken();
    qc.clear(); // ล้างข้อมูลที่ cache ไว้ จะได้ไม่ค้างของผู้ใช้คนก่อน
    setTokenState(null);
  }

  return (
    <>
      <InviteHandler />
      {children}
      {/* ใน LINE ไม่ต้องออกจากระบบ (ออกไปก็ล็อกอินกลับอัตโนมัติ) จึงมีปุ่มนี้เฉพาะโหมดทดสอบ */}
      {!LIFF_ID && (
        <footer className="page-foot">
          <button type="button" className="link-btn" onClick={logout}>
            ออกจากระบบ
          </button>
        </footer>
      )}
    </>
  );
}
