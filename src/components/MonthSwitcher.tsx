import { monthLabel, shiftMonth } from '../lib/month';

type Props = { month: string; onChange: (month: string) => void };

export function MonthSwitcher({ month, onChange }: Props) {
  return (
    <div className="month-switcher">
      <button type="button" aria-label="เดือนก่อนหน้า" onClick={() => onChange(shiftMonth(month, -1))}>
        ‹
      </button>
      <h1>{monthLabel(month)}</h1>
      <button type="button" aria-label="เดือนถัดไป" onClick={() => onChange(shiftMonth(month, 1))}>
        ›
      </button>
    </div>
  );
}
