import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { acceptInvite } from '../api';
import { ApiError } from '../api/http';
import { takePendingInvite } from '../auth/invite';

type Message = { kind: 'ok' | 'error'; text: string };

// ถ้าล็อกอินมาจากลิงก์เชิญ ให้รับคำเชิญทันที แล้วบอกผลด้วยแถบข้อความ
export function InviteHandler() {
  const qc = useQueryClient();
  const started = useRef(false); // กัน StrictMode ใน dev ทำงานซ้ำสองรอบ
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (started.current) return;
    const code = takePendingInvite();
    if (!code) return;
    started.current = true;

    acceptInvite(code)
      .then((joined) => {
        setMessage({ kind: 'ok', text: `เข้าร่วม "${joined.name}" แล้ว` });
        return qc.invalidateQueries(); // ข้อมูลที่เห็นเปลี่ยนเป็นของบ้านใหม่ ต้องดึงใหม่
      })
      .catch((err: unknown) =>
        setMessage({
          kind: 'error',
          text: err instanceof ApiError ? err.message : 'เข้าร่วมบ้านไม่สำเร็จ',
        }),
      );
  }, [qc]);

  if (!message) return null;
  return (
    <div className={`banner is-${message.kind}`} role={message.kind === 'error' ? 'alert' : 'status'}>
      <span>{message.text}</span>
      <button type="button" className="link-btn" onClick={() => setMessage(null)}>
        ปิด
      </button>
    </div>
  );
}
