import type { Metadata } from 'next';
import { Inter, Hind_Siliguri } from 'next/font/google';
import './globals.css';
import { BRAND } from '@/lib/brand';

// Variable Inter — our primary face. Tabular numerals are enabled in
// globals.css so prices and counters never shift when updating.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Bengali fallback — applied automatically to any text tagged `lang="bn"`
// or with the `.font-bn` utility, so mixed-script copy stays legible.
const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bn',
  display: 'swap',
});

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
    <html lang="en" className={`${inter.variable} ${hind.variable}`} suppressHydrationWarning>
      <body className="bg-canvas text-primary antialiased">{children}</body>
    </html>
  );
}
