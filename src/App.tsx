import { useState } from 'react';
import type { Entry, Income } from './types';
import { toMonthKey } from './lib/month';
import { useCategories, useMonth, useTogglePaid } from './hooks/useMonth';
import { useHousehold } from './hooks/useHousehold';
import { MonthSwitcher } from './components/MonthSwitcher';
import { SummaryCard } from './components/SummaryCard';
import { IncomeList } from './components/IncomeList';
import { IncomeForm } from './components/IncomeForm';
import { EntryList } from './components/EntryList';
import { EntryForm } from './components/EntryForm';
import { HouseholdSheet } from './components/HouseholdSheet';

// null = ฟอร์มปิดอยู่
type EntryFormTarget = { entry: Entry | null; parentId: string | null };
type IncomeFormTarget = { income: Income | null };

export default function App() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [entryForm, setEntryForm] = useState<EntryFormTarget | null>(null);
  const [incomeForm, setIncomeForm] = useState<IncomeFormTarget | null>(null);
  const [showHousehold, setShowHousehold] = useState(false);
  const monthQ = useMonth(month);
  const catsQ = useCategories();
  const householdQ = useHousehold();
  const togglePaid = useTogglePaid(month);

  const data = monthQ.data;
  const categories = catsQ.data ?? [];
  const household = householdQ.data;

  return (
    <main className="page">
      <div className="topbar">
        <button type="button" className="link-btn" onClick={() => setShowHousehold(true)}>
          {household ? `${household.name} (${household.members.length} คน)` : 'ครอบครัว'}
        </button>
      </div>

      <MonthSwitcher month={month} onChange={setMonth} />

      {monthQ.isPending && <p className="status">กำลังโหลด…</p>}

      {monthQ.isError && (
        <div className="status">
          <p>โหลดข้อมูลไม่สำเร็จ</p>
          <button type="button" onClick={() => monthQ.refetch()}>
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {data && (
        <>
          <SummaryCard summary={data.summary} categories={categories} />

          <IncomeList
            incomes={data.incomes}
            onAdd={() => setIncomeForm({ income: null })}
            onEdit={(income) => setIncomeForm({ income })}
          />

          <h2 className="section-title section-gap">รายจ่าย</h2>
          {data.entries.length === 0 ? (
            <p className="status">ยังไม่มีรายการในเดือนนี้</p>
          ) : (
            <EntryList
              entries={data.entries}
              categories={categories}
              onTogglePaid={(id, isPaid) => togglePaid.mutate({ id, isPaid })}
              onEdit={(entry) => setEntryForm({ entry, parentId: null })}
              onAddChild={(parentId) => setEntryForm({ entry: null, parentId })}
            />
          )}

          <button
            type="button"
            className="fab"
            onClick={() => setEntryForm({ entry: null, parentId: null })}
          >
            + เพิ่มรายการ
          </button>

          {entryForm && (
            <EntryForm
              // key ต่างกัน = React สร้างฟอร์มใหม่ ค่าในช่องจึงรีเซ็ตทุกครั้งที่เปิด
              key={`${household?.id ?? 'loading'}-${entryForm.entry?.id ?? `new-${entryForm.parentId ?? ''}`}`}
              month={month}
              entry={entryForm.entry}
              defaultParentId={entryForm.parentId}
              entries={data.entries}
              categories={categories}
              householdId={household?.id ?? null}
              onClose={() => setEntryForm(null)}
            />
          )}

          {incomeForm && (
            <IncomeForm
              key={incomeForm.income?.id ?? 'new'}
              month={month}
              income={incomeForm.income}
              onClose={() => setIncomeForm(null)}
            />
          )}
        </>
      )}

      {showHousehold && <HouseholdSheet onClose={() => setShowHousehold(false)} />}
    </main>
  );
}
