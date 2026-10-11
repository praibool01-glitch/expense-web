import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

export const useHousehold = () => useQuery({ queryKey: ['household'], queryFn: api.getHousehold });

export function useRenameHousehold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.renameHousehold(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['household'] }),
  });
}

export const useCreateInvite = () => useMutation({ mutationFn: () => api.createInvite() });

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId }: { userId: string; isMe: boolean }) => api.removeMember(userId),
    // ถ้าออกจากบ้านเอง ข้อมูลทั้งหมดที่เห็นอยู่เป็นของบ้านเดิม ต้องดึงใหม่หมด
    onSuccess: (_data, { isMe }) =>
      isMe ? qc.invalidateQueries() : qc.invalidateQueries({ queryKey: ['household'] }),
  });
}
