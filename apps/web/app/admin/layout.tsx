'use client';
import { Providers } from '@/components/Providers';
import { Shell } from '@/components/Shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Shell role="admin">{children}</Shell>
    </Providers>
  );
}
