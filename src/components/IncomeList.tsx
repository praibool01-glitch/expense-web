import type { Income } from '../types';
import { formatBaht } from '../lib/money';
import { formatDateTime } from '../lib/date-time';

type Props = {
  incomes: Income[];
  isFiltered?: boolean;
  onAdd: () => void;
  onEdit: (income: Income) => void;
};

export function IncomeList({ incomes, isFiltered = false, onAdd, onEdit }: Props) {
  return (
    <section aria-labelledby="income-title">
      <div className="section-head">
        <h2 id="income-title" className="section-title">
          รายรับ
        </h2>
        <button type="button" className="link-btn" onClick={onAdd}>
          + เพิ่มรายรับ
        </button>
      </div>

      {incomes.length === 0 ? (
        <p className="status">
          {isFiltered ? 'ไม่พบรายการรายรับของผู้บันทึกนี้' : 'ยังไม่มีรายรับในเดือนนี้'}
        </p>
      ) : (
        <ul className="entries">
          {incomes.map((i) => (
            <li key={i.id} className="entry">
              <div className="income-row">
                <span className="name">
                  {i.name}
                  <time className="timestamp" dateTime={i.createdAt ?? undefined}>
                    {formatDateTime(i.createdAt)}
                  </time>
                  <span className="timestamp">บันทึกโดย {i.createdByName ?? 'ไม่ทราบชื่อ'}</span>
                </span>
                <span className="amount">{formatBaht(i.amountSatang)}</span>
                <button
                  type="button"
                  className="edit-btn"
                  aria-label={`แก้ไข${i.name}`}
                  onClick={() => onEdit(i)}
                >
                  ✎
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
