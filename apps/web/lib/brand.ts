/**
 * Central brand + contact constants. One source of truth so every page,
 * footer, metadata tag, and support card stays in sync when details change.
 *
 * Values captured from deshcommunications.net (Desh Communications).
 */
export const BRAND = {
  name: 'Desh Communications',
  shortName: 'Desh',
  tagline: 'Internet deals — backed by 99.9% reliability',
  mission:
    'We exist to seamlessly connect people and organizations, enriching their lives and ' +
    'opening doors to a world of possibilities.',
  about:
    'Desh Communications is a leader in providing integrated corporate solutions. We ' +
    'prioritize our customers by offering unmatched quality and service through our highly ' +
    'skilled team of professionals. Our approach centers on innovation and accountability, ' +
    'aiming to simplify and enhance the digital experience for both individuals and ' +
    'organizations.',
  logoUrl: 'https://deshcommunications.net/logo/logo.png',
  footerLogoUrl: 'https://deshcommunications.net/logo/footer-logo.png',
  phones: [
    { label: 'Sales & connection', value: '+88-01941335760', href: 'tel:+8801941335760' },
    { label: 'Sales & connection', value: '+88-01941335761', href: 'tel:+8801941335761' },
    { label: 'Call centre', value: '09643 111 444', href: 'tel:09643111444' },
  ],
  primaryPhone: '09643 111 444',
  primaryPhoneHref: 'tel:09643111444',
  email: 'info@deshcommunications.net',
  emailHref: 'mailto:info@deshcommunications.net',
  address: {
    line1: 'SHOPNO CHURA, House# 135/A, Road# 01',
    line2: 'Mohammadia Housing Society',
    line3: 'Mohammadpur, Dhaka-1207',
    short: 'Mohammadpur, Dhaka',
  },
  supportHours: 'Sales: Sat–Thu, 9:00–21:00  ·  NOC & technical support: 24/7',
} as const;
