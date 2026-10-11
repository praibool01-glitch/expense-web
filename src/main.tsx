import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './api/http';
import App from './App';
import { AuthGate } from './components/AuthGate';
import { captureInviteFromUrl } from './auth/invite';
import './index.css';

// ถ้าเปิดมาจากลิงก์เชิญ (?invite=...) ให้จำรหัสไว้ก่อน แล้วค่อยรับคำเชิญหลังล็อกอิน
captureInviteFromUrl();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ข้อผิดพลาดที่ลองซ้ำก็ไม่หาย (ข้อมูลผิด/ไม่มีสิทธิ์/ไม่พบ) ไม่ต้อง retry
      retry: (count, error) =>
        !(error instanceof ApiError && [400, 401, 403, 404].includes(error.status)) && count < 2,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <App />
      </AuthGate>
    </QueryClientProvider>
  </StrictMode>,
);
