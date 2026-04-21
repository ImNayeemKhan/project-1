'use client';
import { Providers } from '@/components/Providers';
import { Shell } from '@/components/Shell';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Shell role="customer">{children}</Shell>
    </Providers>
  );
}
