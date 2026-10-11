import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError, devLogin } from '../api/http';
import { setToken } from '../auth/session';

type Props = { onLoggedIn: (token: string) => void };

// หน้าเข้าสู่ระบบสำหรับทดสอบ (ยังไม่ได้ต่อ LINE) จะถูกแทนด้วย LIFF login ทีหลัง
export function DevLogin({ onLoggedIn }: Props) {
  const [lineUserId, setLineUserId] = useState('dev-1');
  const [displayName, setDisplayName] = useState('');

  const login = useMutation({
    mutationFn: () => devLogin(lineUserId.trim(), displayName.trim() || undefined),
    onSuccess: (result) => {
      setToken(result.token);
      onLoggedIn(result.token);
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (lineUserId.trim()) login.mutate();
  }

  return (
    <main className="page">
      <form className="login" onSubmit={handleSubmit}>
        <h1>เข้าสู่ระบบ</h1>
        <p className="login-hint">โหมดทดสอบ ยังไม่ได้ต่อ LINE ใช้ชื่อไหนก็ได้ ชื่อเดิมจะได้ข้อมูลชุดเดิม</p>

        <div className="field">
          <label htmlFor="l-id">ชื่อผู้ใช้ทดสอบ</label>
          <input id="l-id" value={lineUserId} onChange={(e) => setLineUserId(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="l-name">ชื่อที่แสดง (ไม่บังคับ)</label>
          <input id="l-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        {login.isError && (
          <p className="field-error" role="alert">
            {login.error instanceof ApiError ? login.error.message : 'เข้าสู่ระบบไม่สำเร็จ'}
          </p>
        )}

        <button type="submit" className="login-btn" disabled={login.isPending}>
          {login.isPending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </main>
  );
}
