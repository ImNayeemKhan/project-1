import type { Metadata } from 'next';
import './globals.css';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${BRAND.name} — Fiber broadband, gaming, and corporate internet in Dhaka`,
  description:
    `${BRAND.name} delivers fiber-optic home, gaming, and corporate internet across Dhaka ` +
    `with 24/7 local support, online bill payment, and BDIX entertainment mirrors. ${BRAND.tagline}.`,
  icons: {
    icon: BRAND.faviconUrl,
    apple: BRAND.logoSquareUrl,
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    images: [BRAND.ogImageUrl],
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
