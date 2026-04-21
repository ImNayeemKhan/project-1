'use client';
import { SWRConfig } from 'swr';
import { api } from '@/lib/api';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => api.get(url).then((r) => r.data),
        revalidateOnFocus: false,
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </SWRConfig>
  );
}
