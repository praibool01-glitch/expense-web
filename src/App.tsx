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
const UNKNOWN_CREATOR = '__unknown__';

export default function App() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [creatorFilter, setCreatorFilter] = useState('');
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
  const creatorOptions = new Map<string, string>();

  const addCreator = (createdBy: string | null, createdByName: string | null) => {
    if (createdBy !== null && !creatorOptions.has(createdBy)) {
      creatorOptions.set(createdBy, createdByName || 'สมาชิกที่ไม่ทราบชื่อ');
    }
  };

  if (data) {
    const visitEntry = (entry: Entry) => {
      addCreator(entry.createdBy, entry.createdByName);
      entry.children?.forEach(visitEntry);
    };
    data.entries.forEach(visitEntry);
    data.incomes.forEach((income) => addCreator(income.createdBy, income.createdByName));
  }

  const matchesCreator = (createdBy: string | null) =>
    !creatorFilter ||
    (creatorFilter === UNKNOWN_CREATOR ? createdBy === null : createdBy === creatorFilter);

  const visibleEntries =
    data && creatorFilter
      ? data.entries.flatMap((entry) => {
          if (entry.amountSatang !== null) return matchesCreator(entry.createdBy) ? [entry] : [];
          const children = (entry.children ?? []).filter((child) => matchesCreator(child.createdBy));
          return matchesCreator(entry.createdBy) || children.length > 0 ? [{ ...entry, children }] : [];
        })
      : (data?.entries ?? []);
  const visibleIncomes = data?.incomes.filter((income) => matchesCreator(income.createdBy)) ?? [];
  const hasUnknownCreator =
    data?.incomes.some((income) => income.createdBy === null) ||
    data?.entries.some((entry) => {
      const hasUnknown = (item: Entry): boolean =>
        item.createdBy === null || (item.children?.some(hasUnknown) ?? false);
      return hasUnknown(entry);
    }) ||
    false;
  const changeMonth = (nextMonth: string) => {
    setMonth(nextMonth);
    setCreatorFilter('');
  };

  return (
    <main className="page">
      <div className="topbar">
        <button type="button" className="link-btn" onClick={() => setShowHousehold(true)}>
          {household ? `${household.name} (${household.members.length} คน)` : 'ครอบครัว'}
        </button>
      </div>

      <MonthSwitcher month={month} onChange={changeMonth} />

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

          <div className="field creator-filter">
            <label htmlFor="creator-filter">กรองรายการตามผู้บันทึก</label>
            <select
              id="creator-filter"
              value={creatorFilter}
              onChange={(event) => setCreatorFilter(event.target.value)}
            >
              <option value="">ทุกคน</option>
              {[...creatorOptions].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
              {hasUnknownCreator && <option value={UNKNOWN_CREATOR}>ไม่ทราบชื่อผู้บันทึก</option>}
            </select>
            {creatorFilter && (
              <span className="note">ยอดสรุปยังแสดงยอดรวมทั้งเดือน</span>
            )}
          </div>

          <IncomeList
            incomes={visibleIncomes}
            isFiltered={Boolean(creatorFilter)}
            onAdd={() => setIncomeForm({ income: null })}
            onEdit={(income) => setIncomeForm({ income })}
          />

          <h2 className="section-title section-gap">รายจ่าย</h2>
          {visibleEntries.length === 0 ? (
            <p className="status">
              {creatorFilter ? 'ไม่พบรายการรายจ่ายของผู้บันทึกนี้' : 'ยังไม่มีรายการในเดือนนี้'}
            </p>
          ) : (
            <EntryList
              entries={visibleEntries}
              categories={categories}
              isFiltered={Boolean(creatorFilter)}
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
