import type { Category, MonthSummary } from '../types';
import { formatBaht } from '../lib/money';

type Props = { summary: MonthSummary; categories: Category[] };

const NO_CATEGORY = { name: 'ไม่มีหมวด', color: '#9AA5A1' };

export function SummaryCard({ summary, categories }: Props) {
  const catById = new Map(categories.map((c) => [c.id, c]));
  const over = summary.remainingSatang < 0;
  // ความกว้างของแถบอ้างอิงจากรายรับหรือรายจ่าย แล้วแต่อันไหนมากกว่า
  const scale = Math.max(summary.totalIncomeSatang, summary.totalExpenseSatang) || 1;

  return (
    <section className="summary" aria-label="สรุปเดือนนี้">
      <p className="summary-label">{over ? 'จ่ายเกินรายรับ' : 'เหลือใช้'}</p>
      <p className={`summary-figure${over ? ' is-over' : ''}`}>
        {formatBaht(Math.abs(summary.remainingSatang))}
      </p>

      <div className="bar" role="img" aria-label="สัดส่วนรายจ่ายต่อรายรับ แยกตามหมวด">
        {summary.byCategory.map((c) => {
          const cat = c.categoryId ? catById.get(c.categoryId) : undefined;
          return (
            <span
              key={c.categoryId ?? 'none'}
              className="bar-seg"
              style={{
                width: `${(c.totalSatang / scale) * 100}%`,
                background: (cat ?? NO_CATEGORY).color,
              }}
            />
          );
        })}
        {!over && <span className="bar-rest" />}
      </div>

      <dl className="summary-totals">
        <div>
          <dt>รายรับ</dt>
          <dd>{formatBaht(summary.totalIncomeSatang)}</dd>
        </div>
        <div>
          <dt>รายจ่าย</dt>
          <dd>{formatBaht(summary.totalExpenseSatang)}</dd>
        </div>
        <div>
          <dt>จ่ายแล้ว</dt>
          <dd>{formatBaht(summary.totalPaidSatang)}</dd>
        </div>
      </dl>

      <ul className="legend">
        {summary.byCategory.map((c) => {
          const cat = (c.categoryId ? catById.get(c.categoryId) : undefined) ?? NO_CATEGORY;
          return (
            <li key={c.categoryId ?? 'none'}>
              <span className="dot" style={{ background: cat.color }} />
              <span className="legend-name">{cat.name}</span>
              <span className="legend-amount">{formatBaht(c.totalSatang)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
