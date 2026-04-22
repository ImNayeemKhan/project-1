export interface FtpServerRow {
  _id: string;
  name: string;
  code: string;
  category: 'entertainment' | 'carrier' | 'business' | 'partnership';
  tagline?: string;
  description?: string;
  host: string;
  webUrl?: string;
  port: number;
  protocol: 'ftp' | 'http' | 'https' | 'smb';
  accessLevel: 'public' | 'customer' | 'business' | 'partner';
  capacityTB: number;
  maxSpeedMbps: number;
  contentTypes: string[];
  features: string[];
  imageUrl?: string;
}

export interface AddonRow {
  _id: string;
  name: string;
  code: string;
  category: string;
  tagline?: string;
  description?: string;
  monthlyPrice: number;
  setupFee: number;
  features: string[];
  imageUrl?: string;
}

const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function fetchFtpServers(category?: string): Promise<FtpServerRow[]> {
  try {
    const url = category
      ? `${apiBase}/api/public/ftp-servers?category=${encodeURIComponent(category)}`
      : `${apiBase}/api/public/ftp-servers`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items as FtpServerRow[];
  } catch {
    return [];
  }
}

export async function fetchAddons(): Promise<AddonRow[]> {
  try {
    const res = await fetch(`${apiBase}/api/public/addons`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items as AddonRow[];
  } catch {
    return [];
  }
}
