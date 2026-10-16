export type FrequentEntry = {
  name: string;
  categoryName: string | null;
  count: number;
  lastUsed: number;
};

const STORAGE_PREFIX = 'expense.frequent-entries.v1';
const MAX_STORED_ENTRIES = 40;
const memoryEntries = new Map<string, FrequentEntry[]>();

function storageKey(householdId: string | null) {
  return `${STORAGE_PREFIX}.${householdId ?? 'default'}`;
}

function isFrequentEntry(value: unknown): value is FrequentEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.name === 'string' &&
    (typeof entry.categoryName === 'string' || entry.categoryName === null) &&
    typeof entry.count === 'number' &&
    typeof entry.lastUsed === 'number'
  );
}

export function getFrequentEntries(householdId: string | null): FrequentEntry[] {
  const key = storageKey(householdId);
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return memoryEntries.get(key) ?? [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return memoryEntries.get(key) ?? [];
    return parsed.filter(isFrequentEntry);
  } catch {
    return memoryEntries.get(key) ?? [];
  }
}

export function rememberFrequentEntry(
  name: string,
  categoryName: string | null,
  householdId: string | null,
): FrequentEntry[] {
  const key = storageKey(householdId);
  const entries = getFrequentEntries(householdId);
  const normalizedName = name.trim().toLocaleLowerCase();
  const existing = entries.find((entry) => entry.name.toLocaleLowerCase() === normalizedName);
  const now = Date.now();
  const next = [
    ...entries.filter((entry) => entry.name.toLocaleLowerCase() !== normalizedName),
    {
      name: existing?.name ?? name.trim(),
      categoryName,
      count: (existing?.count ?? 0) + 1,
      lastUsed: now,
    },
  ]
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .slice(0, MAX_STORED_ENTRIES);

  memoryEntries.set(key, next);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Keep the shortcuts available for the current page when browser storage is unavailable.
  }
  return next;
}
