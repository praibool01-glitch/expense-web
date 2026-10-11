import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Household } from '../types';
import { ApiError } from '../api/http';
import {
  useCreateInvite,
  useHousehold,
  useRemoveMember,
  useRenameHousehold,
} from '../hooks/useHousehold';

const errorText = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' }).format(new Date(iso));

export function HouseholdSheet({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { data, isPending, isError } = useHousehold();

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="sheet" onClose={onClose} aria-labelledby="household-title">
      <h2 id="household-title">ครอบครัว</h2>

      {isPending && <p className="status">กำลังโหลด…</p>}
      {isError && (
        <p className="field-error" role="alert">
          โหลดข้อมูลไม่สำเร็จ
        </p>
      )}
      {data && <Body household={data} onClose={onClose} />}

      <div className="actions">
        <span className="spacer" />
        <button type="button" onClick={onClose}>
          ปิด
        </button>
      </div>
    </dialog>
  );
}

function Body({ household, onClose }: { household: Household; onClose: () => void }) {
  const isOwner = household.myRole === 'owner';
  const remove = useRemoveMember();
  const [error, setError] = useState<string | null>(null);

  function handleRemove(userId: string, displayName: string | null, isMe: boolean) {
    const message = isMe
      ? 'ออกจากบ้านนี้? คุณจะไม่เห็นรายการของบ้านนี้อีก และจะได้บ้านใหม่ที่ว่างเปล่า'
      : `นำ ${displayName ?? 'สมาชิกคนนี้'} ออกจากบ้าน?`;
    if (!window.confirm(message)) return;
    setError(null);
    remove.mutate(
      { userId, isMe },
      {
        onSuccess: () => {
          if (isMe) onClose();
        },
        onError: (err) => setError(errorText(err, 'ทำรายการไม่สำเร็จ')),
      },
    );
  }

  return (
    <>
      {isOwner ? (
        <RenameForm key={household.name} household={household} />
      ) : (
        <p className="household-name">{household.name}</p>
      )}

      <h3 className="sheet-heading">สมาชิก</h3>
      <ul className="members">
        {household.members.map((m) => {
          // เจ้าของนำสมาชิกออกได้ สมาชิกออกเองได้ เจ้าของออกเองไม่ได้
          const canRemove = m.isMe ? !isOwner : isOwner && m.role === 'member';
          return (
            <li key={m.userId} className="member-row">
              <span className="name">
                {m.displayName ?? 'ไม่มีชื่อ'}
                {m.isMe && <span className="note">คุณ</span>}
              </span>
              <span className="badge">{m.role === 'owner' ? 'เจ้าของ' : 'สมาชิก'}</span>
              {canRemove && (
                <button
                  type="button"
                  className="danger-link"
                  disabled={remove.isPending}
                  onClick={() => handleRemove(m.userId, m.displayName, m.isMe)}
                >
                  {m.isMe ? 'ออกจากบ้าน' : 'นำออก'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {isOwner && <InviteSection />}
    </>
  );
}

function RenameForm({ household }: { household: Household }) {
  const rename = useRenameHousehold();
  const [name, setName] = useState(household.name);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed === household.name) return;
    rename.mutate(trimmed);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="h-name">ชื่อบ้าน</label>
        <div className="inline-field">
          <input id="h-name" value={name} maxLength={50} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="small-btn" disabled={rename.isPending}>
            บันทึก
          </button>
        </div>
        {rename.isError && (
          <p className="field-error" role="alert">
            {errorText(rename.error, 'บันทึกไม่สำเร็จ')}
          </p>
        )}
      </div>
    </form>
  );
}

function InviteSection() {
  const invite = useCreateInvite();
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const data = invite.data;

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      inputRef.current?.select(); // clipboard ใช้ไม่ได้ (เช่น ไม่ใช่ HTTPS) ให้เลือกข้อความไว้ให้คัดลอกเอง
    }
  }

  return (
    <section>
      <h3 className="sheet-heading">เชิญสมาชิก</h3>
      <button
        type="button"
        className="small-btn"
        disabled={invite.isPending}
        onClick={() => {
          setCopied(false);
          invite.mutate();
        }}
      >
        {data ? 'สร้างลิงก์ใหม่' : 'สร้างลิงก์เชิญ'}
      </button>
      {invite.isError && (
        <p className="field-error" role="alert">
          {errorText(invite.error, 'สร้างลิงก์ไม่สำเร็จ')}
        </p>
      )}

      {data && (
        <div className="invite-box">
          <input
            ref={inputRef}
            readOnly
            value={data.url}
            aria-label="ลิงก์เชิญ"
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="invite-actions">
            <button type="button" className="small-btn" onClick={() => copy(data.url)}>
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </button>
            <a
              className="small-btn"
              href={`https://line.me/R/share?text=${encodeURIComponent(data.url)}`}
              target="_blank"
              rel="noreferrer"
            >
              ส่งทาง LINE
            </a>
          </div>
          <p className="note">ใช้ได้ครั้งเดียว หมดอายุ {formatDate(data.expiresAt)}</p>
        </div>
      )}
    </section>
  );
}
