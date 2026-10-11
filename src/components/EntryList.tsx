import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Category, Entry } from '../types';
import { formatBaht } from '../lib/money';

type Handlers = {
  onTogglePaid: (id: string, isPaid: boolean) => void;
  onEdit: (entry: Entry) => void;
  onAddChild: (parentId: string) => void;
};
type ColorOf = (categoryId: string | null) => string;

type Props = Handlers & { entries: Entry[]; categories: Category[] };

export function EntryList({ entries, categories, ...handlers }: Props) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const colorOf: ColorOf = (id) => (id ? catById.get(id)?.color : undefined) ?? '#9AA5A1';

  return (
    <ul className="entries">
      {entries.map((e) => (
        <Group key={e.id} entry={e} colorOf={colorOf} {...handlers} />
      ))}
    </ul>
  );
}

type GroupProps = Handlers & { entry: Entry; colorOf: ColorOf };

// แถวระดับบนสุด: แถวที่ไม่มียอด (amountSatang เป็น null) คือ "กลุ่ม" กดขยายดูรายการย่อยได้
function Group({ entry, colorOf, onTogglePaid, onEdit, onAddChild }: GroupProps) {
  const [open, setOpen] = useState(false);

  if (entry.amountSatang !== null) {
    return (
      <li className="entry">
        <Leaf
          entry={entry}
          color={colorOf(entry.categoryId)}
          onTogglePaid={onTogglePaid}
          onEdit={onEdit}
        />
      </li>
    );
  }

  const kids = entry.children ?? [];
  const paidCount = kids.filter((k) => k.isPaid).length;
  const style = { '--cat': colorOf(entry.categoryId) } as CSSProperties;

  return (
    <li className="entry">
      <div className="entry-head-row">
        <button
          type="button"
          className="entry-head"
          style={style}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="chevron" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span className="name">
            {entry.name}
            <span className="note">
              {kids.length === 0
                ? 'ยังไม่มีรายการย่อย'
                : `จ่ายแล้ว ${paidCount} จาก ${kids.length} รายการ`}
            </span>
          </span>
          <span className="amount">{formatBaht(entry.totalSatang)}</span>
        </button>
        <button
          type="button"
          className="edit-btn"
          aria-label={`แก้ไข${entry.name}`}
          onClick={() => onEdit(entry)}
        >
          ✎
        </button>
      </div>
      {open && (
        <ul className="children">
          {kids.map((k) => (
            <li key={k.id}>
              <Leaf
                entry={k}
                color={colorOf(k.categoryId ?? entry.categoryId)}
                onTogglePaid={onTogglePaid}
                onEdit={onEdit}
              />
            </li>
          ))}
          <li>
            <button type="button" className="add-child" onClick={() => onAddChild(entry.id)}>
              + เพิ่มรายการในกลุ่มนี้
            </button>
          </li>
        </ul>
      )}
    </li>
  );
}

type LeafProps = {
  entry: Entry;
  color: string;
  onTogglePaid: Handlers['onTogglePaid'];
  onEdit: Handlers['onEdit'];
};

function Leaf({ entry, color, onTogglePaid, onEdit }: LeafProps) {
  const style = { '--cat': color } as CSSProperties;
  return (
    <div className={`leaf${entry.isPaid ? ' is-paid' : ''}`} style={style}>
      <input
        type="checkbox"
        checked={entry.isPaid}
        onChange={(e) => onTogglePaid(entry.id, e.target.checked)}
        aria-label={`จ่าย${entry.name}แล้ว`}
      />
      <span className="name">
        {entry.name}
        {entry.note && <span className="note">{entry.note}</span>}
      </span>
      <span className="amount">{formatBaht(entry.totalSatang)}</span>
      <button
        type="button"
        className="edit-btn"
        aria-label={`แก้ไข${entry.name}`}
        onClick={() => onEdit(entry)}
      >
        ✎
      </button>
    </div>
  );
}
