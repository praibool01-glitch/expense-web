import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, lineLogin } from '../api/http';
import { getLiffIdToken } from '../auth/liff';
import { setToken } from '../auth/session';

type Props = { onLoggedIn: (token: string) => void };

// ล็อกอินด้วย LINE อัตโนมัติ: LIFF ให้ ID token -> backend verify -> ได้ session token
export function LiffLogin({ onLoggedIn }: Props) {
  const started = useRef(false); // กัน StrictMode ใน dev เรียก liff.init ซ้ำสองรอบ
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    setError(null);
    try {
      const idToken = await getLiffIdToken();
      if (idToken === null) return; // กำลังไปหน้าล็อกอินของ LINE
      const result = await lineLogin(idToken);
      setToken(result.token);
      onLoggedIn(result.token);
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ',
      );
    }
  }, [onLoggedIn]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void run();
  }, [run]);

  return (
    <main className="page">
      <div className="login">
        <h1>เข้าสู่ระบบด้วย LINE</h1>
        {error ? (
          <>
            <p className="field-error" role="alert">
              {error}
            </p>
            <button type="button" className="login-btn" onClick={() => void run()}>
              ลองอีกครั้ง
            </button>
          </>
        ) : (
          <p className="login-hint">กำลังเข้าสู่ระบบ…</p>
        )}
      </div>
    </main>
  );
}
