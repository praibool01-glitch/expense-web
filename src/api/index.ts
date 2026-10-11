// จุดเดียวที่เลือกว่าจะใช้ mock หรือ API จริง
// ตั้ง VITE_USE_MOCK=true ใน .env.local เพื่อกลับไปใช้ข้อมูลปลอม (ไม่ต้องรัน backend)
import * as http from './http';
import * as mock from './mock';

export const isMock = import.meta.env.VITE_USE_MOCK === 'true';

const impl = isMock ? mock : http;

export const getCategories = impl.getCategories;
export const getMonth = impl.getMonth;
export const createEntry = impl.createEntry;
export const patchEntry = impl.patchEntry;
export const deleteEntry = impl.deleteEntry;
export const createIncome = impl.createIncome;
export const patchIncome = impl.patchIncome;
export const deleteIncome = impl.deleteIncome;
export const getHousehold = impl.getHousehold;
export const renameHousehold = impl.renameHousehold;
export const createInvite = impl.createInvite;
export const acceptInvite = impl.acceptInvite;
export const removeMember = impl.removeMember;
