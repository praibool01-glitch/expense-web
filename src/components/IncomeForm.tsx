import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Income } from '../types';
import { parseBaht, toBahtInput } from '../lib/money';
import { ApiError } from '../api/http';
import { useDeleteIncome, useSaveIncome } from '../hooks/useMonth';

type Props = {
  month: string;
  income: Income | null; // null = เพิ่มใหม่, มีค่า = แก้ไข
  onClose: () => void;
};

type Errors = { name?: string; amount?: string };

export function IncomeForm({ month, income, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const save = useSaveIncome(month);
  const remove = useDeleteIncome(month);
  const isEdit = income !== null;

  const [name, setName] = useState(income?.name ?? '');
  const [amount, setAmount] = useState(income ? toBahtInput(income.amountSatang) : '');
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  const busy = save.isPending || remove.isPending;
  const done = {
    onSuccess: onClose,
    // แสดงข้อความจาก backend ถ้ามี (เช่น กลุ่มที่เลือกไม่ถูกต้อง)
    onError: (err: Error) =>
      setSubmitError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ ลองอีกครั้ง'),
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const trimmed = name.trim();
    const parsed = parseBaht(amount);
    const next: Errors = {};
    if (!trimmed) next.name = 'ใส่ชื่อรายรับ เช่น เงินเดือน';
    if (parsed === null || parsed === 0) next.amount = 'ใส่จำนวนเงินเป็นตัวเลขที่มากกว่า 0';

    setErrors(next);
    if (Object.keys(next).length > 0 || parsed === null) return;

    if (income) save.mutate({ id: income.id, patch: { name: trimmed, amountSatang: parsed } }, done);
    else save.mutate({ id: null, input: { month, name: trimmed, amountSatang: parsed } }, done);
  }

  function handleDelete() {
    if (!income) return;
    if (!window.confirm(`ลบ "${income.name}"?`)) return;
    setSubmitError(null);
    remove.mutate(income.id, done);
  }

  return (
    <dialog ref={dialogRef} className="sheet" onClose={onClose} aria-labelledby="income-form-title">
      <form onSubmit={handleSubmit} noValidate>
        <h2 id="income-form-title">{isEdit ? 'แก้ไขรายรับ' : 'เพิ่มรายรับ'}</h2>

        <div className="field">
          <label htmlFor="i-name">ชื่อ</label>
          <input
            id="i-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'i-name-err' : undefined}
          />
          {errors.name && (
            <p id="i-name-err" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="i-amount">จำนวนเงิน (บาท)</label>
          <input
            id="i-amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={errors.amount ? 'i-amount-err' : undefined}
          />
          {errors.amount && (
            <p id="i-amount-err" className="field-error">
              {errors.amount}
            </p>
          )}
        </div>

        {submitError && (
          <p className="field-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="actions">
          {isEdit && (
            <button type="button" className="danger" onClick={handleDelete} disabled={busy}>
              ลบ
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose}>
            ยกเลิก
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
