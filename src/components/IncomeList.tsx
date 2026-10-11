import type { Income } from '../types';
import { formatBaht } from '../lib/money';

type Props = {
  incomes: Income[];
  onAdd: () => void;
  onEdit: (income: Income) => void;
};

export function IncomeList({ incomes, onAdd, onEdit }: Props) {
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
        <p className="status">ยังไม่มีรายรับในเดือนนี้</p>
      ) : (
        <ul className="entries">
          {incomes.map((i) => (
            <li key={i.id} className="entry">
              <div className="income-row">
                <span className="name">{i.name}</span>
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
