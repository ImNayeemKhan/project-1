import { MarketingShell } from '@/components/MarketingShell';
import { PromoBar } from '@/components/PromoBar';
import { ExitIntentModal } from '@/components/ExitIntentModal';
import { LiveChatWidget } from '@/components/LiveChatWidget';
import { OrganizationJsonLd } from '@/components/StructuredData';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationJsonLd />
      <PromoBar />
      <MarketingShell>{children}</MarketingShell>
      <ExitIntentModal />
      <LiveChatWidget />
    </>
  );
}
