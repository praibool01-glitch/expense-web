import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Category, Entry } from '../types';
import { parseBaht, toBahtInput } from '../lib/money';
import { getFrequentEntries, rememberFrequentEntry } from '../lib/frequent-entries';
import { ApiError } from '../api/http';
import { useDeleteEntry, useSaveEntry } from '../hooks/useMonth';

type Props = {
  month: string;
  entry: Entry | null; // null = เพิ่มใหม่, มีค่า = แก้ไข
  defaultParentId: string | null;
  entries: Entry[]; // ใช้สร้างตัวเลือก "กลุ่ม"
  categories: Category[];
  householdId: string | null;
  onClose: () => void;
};

type Errors = { name?: string; amount?: string };

export function EntryForm({
  month,
  entry,
  defaultParentId,
  entries,
  categories,
  householdId,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const save = useSaveEntry(month);
  const remove = useDeleteEntry(month);
  const isEdit = entry !== null;

  // ทุกช่องเป็น controlled input: ค่าอยู่ใน state และ onChange เขียนกลับเข้า state (แทน v-model)
  const [kind, setKind] = useState<'item' | 'group'>(
    entry && entry.amountSatang === null ? 'group' : 'item',
  );
  const [name, setName] = useState(entry?.name ?? '');
  const [amount, setAmount] = useState(
    entry?.amountSatang != null ? toBahtInput(entry.amountSatang) : '',
  );
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? '');
  const [parentId, setParentId] = useState(entry?.parentId ?? defaultParentId ?? '');
  const [note, setNote] = useState(entry?.note ?? '');
  const [frequentEntries] = useState(() => getFrequentEntries(householdId));
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  // ค่าที่คำนวณจาก state ได้ ให้คำนวณตรงๆ ไม่ต้องเก็บเป็น state เพิ่ม
  const groups = entries.filter((e) => e.amountSatang === null && e.id !== entry?.id);
  const busy = save.isPending || remove.isPending;
  const done = {
    onSuccess: onClose,
    // แสดงข้อความจาก backend ถ้ามี (เช่น กลุ่มที่เลือกไม่ถูกต้อง)
    onError: (err: Error) =>
      setSubmitError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ ลองอีกครั้ง'),
  };

  function selectFrequentEntry(frequentEntry: (typeof frequentEntries)[number]) {
    setName(frequentEntry.name);
    setCategoryId(
      categories.find((category) => category.name === frequentEntry.categoryName)?.id ?? '',
    );
    setErrors({});
    setSubmitError(null);
    amountRef.current?.focus();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const trimmed = name.trim();
    const next: Errors = {};
    if (!trimmed) next.name = 'ใส่ชื่อรายการ';

    let amountSatang: number | null = null;
    if (kind === 'item') {
      const parsed = parseBaht(amount);
      if (parsed === null) next.amount = 'ใส่จำนวนเงินเป็นตัวเลข เช่น 1500 หรือ 1500.50';
      else amountSatang = parsed;
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const fields = {
      name: trimmed,
      amountSatang,
      categoryId: categoryId || null,
      note: note.trim() || null,
      parentId: kind === 'item' ? parentId || null : null,
    };

    if (entry) {
      save.mutate({ id: entry.id, patch: fields }, done);
    } else {
      const categoryName =
        categories.find((category) => category.id === categoryId)?.name ??
        (parentId
          ? categories.find(
              (category) => category.id === entries.find((group) => group.id === parentId)?.categoryId,
            )?.name
          : null) ??
        null;
      save.mutate(
        { id: null, input: { month, ...fields } },
        kind === 'item'
          ? {
              ...done,
              onSuccess: () => {
                if (householdId !== null) {
                  rememberFrequentEntry(trimmed, categoryName, householdId);
                }
                onClose();
              },
            }
          : done,
      );
    }
  }

  function handleDelete() {
    if (!entry) return;
    const n = entry.children?.length ?? 0;
    const message =
      n > 0 ? `ลบ "${entry.name}" และรายการย่อยอีก ${n} รายการ?` : `ลบ "${entry.name}"?`;
    if (!window.confirm(message)) return;
    setSubmitError(null);
    remove.mutate(entry.id, done);
  }

  return (
    <dialog ref={dialogRef} className="sheet" onClose={onClose} aria-labelledby="entry-form-title">
      <form onSubmit={handleSubmit} noValidate>
        <h2 id="entry-form-title">{isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการ'}</h2>

        {!isEdit && (
          <fieldset className="kind">
            <legend>ประเภท</legend>
            <label>
              <input
                type="radio"
                name="kind"
                checked={kind === 'item'}
                onChange={() => setKind('item')}
              />
              รายการ
            </label>
            <label>
              <input
                type="radio"
                name="kind"
                checked={kind === 'group'}
                onChange={() => setKind('group')}
              />
              กลุ่ม (มีรายการย่อย เช่น บัตรเครดิต)
            </label>
          </fieldset>
        )}

        {!isEdit && kind === 'item' && frequentEntries.length > 0 && (
          <div className="field frequent-entry-field">
            <span className="frequent-entry-label">รายการที่ใช้บ่อย</span>
            <div className="frequent-entry-list">
              {frequentEntries.slice(0, 8).map((frequentEntry) => (
                <button
                  key={frequentEntry.name}
                  type="button"
                  className="frequent-entry"
                  onClick={() => selectFrequentEntry(frequentEntry)}
                >
                  {frequentEntry.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label htmlFor="f-name">ชื่อ</label>
          <input
            id="f-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'f-name-err' : undefined}
          />
          {errors.name && (
            <p id="f-name-err" className="field-error">
              {errors.name}
            </p>
          )}
        </div>

        {kind === 'item' && (
          <div className="field">
            <label htmlFor="f-amount">จำนวนเงิน (บาท)</label>
            <input
              id="f-amount"
              ref={amountRef}
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'f-amount-err' : undefined}
            />
            {errors.amount && (
              <p id="f-amount-err" className="field-error">
                {errors.amount}
              </p>
            )}
          </div>
        )}

        {kind === 'item' && groups.length > 0 && (
          <div className="field">
            <label htmlFor="f-parent">อยู่ในกลุ่ม</label>
            <select id="f-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">ไม่อยู่ในกลุ่ม</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label htmlFor="f-category">หมวด</label>
          <select id="f-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{kind === 'item' && parentId ? 'ตามกลุ่ม' : 'ไม่มีหมวด'}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="f-note">บันทึกเพิ่มเติม</label>
          <input id="f-note" value={note} onChange={(e) => setNote(e.target.value)} />
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
