import { BRAND } from '@/lib/brand';

const WEBSITE_URL = 'https://deshcommunications.net';

/**
 * JSON-LD structured data for search engines. Emits InternetServiceProvider
 * schema with hours/address/contact so Google can surface the brand in the
 * local knowledge panel.
 */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'InternetServiceProvider',
    name: BRAND.name,
    url: WEBSITE_URL,
    logo: `${WEBSITE_URL}${BRAND.logoUrl}`,
    telephone: BRAND.primaryPhone,
    email: BRAND.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${BRAND.address.line1}, ${BRAND.address.line2}`,
      addressLocality: 'Dhaka',
      postalCode: '1207',
      addressCountry: 'BD',
    },
    sameAs: [BRAND.social.facebook, BRAND.social.youtube].filter(Boolean),
    areaServed: 'Dhaka, Bangladesh',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Saturday',
        ],
        opens: '09:00',
        closes: '21:00',
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export interface ProductJsonLdPkg {
  name: string;
  description?: string;
  imageUrl?: string;
  monthlyPrice: number;
  downloadMbps: number;
}

export function ProductListJsonLd({ packages }: { packages: ProductJsonLdPkg[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: packages.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        description: p.description ?? `${p.downloadMbps} Mbps fiber plan by ${BRAND.name}`,
        image: p.imageUrl,
        offers: {
          '@type': 'Offer',
          price: p.monthlyPrice,
          priceCurrency: 'BDT',
          availability: 'https://schema.org/InStock',
          url: WEBSITE_URL,
        },
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
