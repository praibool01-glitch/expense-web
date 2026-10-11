import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import type { EntryInput, EntryPatch, IncomeInput, IncomePatch } from '../types';

export const useMonth = (month: string) =>
  useQuery({ queryKey: ['month', month], queryFn: () => api.getMonth(month) });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: api.getCategories, staleTime: Infinity });

// ยอดสรุปคำนวณที่ backend จึงดึงทั้งเดือนใหม่หลังแก้ ไม่ต้องบวกเองฝั่งหน้าบ้าน
function useRefreshMonth(month: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['month', month] });
}

export function useTogglePaid(month: string) {
  const refresh = useRefreshMonth(month);
  return useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: boolean }) =>
      api.patchEntry(id, { isPaid }),
    onSuccess: refresh,
  });
}

type SaveVars = { id: null; input: EntryInput } | { id: string; patch: EntryPatch };

export function useSaveEntry(month: string) {
  const refresh = useRefreshMonth(month);
  return useMutation({
    mutationFn: (v: SaveVars) =>
      v.id === null ? api.createEntry(v.input) : api.patchEntry(v.id, v.patch),
    onSuccess: refresh,
  });
}

export function useDeleteEntry(month: string) {
  const refresh = useRefreshMonth(month);
  return useMutation({
    mutationFn: (id: string) => api.deleteEntry(id),
    onSuccess: refresh,
  });
}

type SaveIncomeVars = { id: null; input: IncomeInput } | { id: string; patch: IncomePatch };

export function useSaveIncome(month: string) {
  const refresh = useRefreshMonth(month);
  return useMutation({
    mutationFn: (v: SaveIncomeVars) =>
      v.id === null ? api.createIncome(v.input) : api.patchIncome(v.id, v.patch),
    onSuccess: refresh,
  });
}

export function useDeleteIncome(month: string) {
  const refresh = useRefreshMonth(month);
  return useMutation({
    mutationFn: (id: string) => api.deleteIncome(id),
    onSuccess: refresh,
  });
}
