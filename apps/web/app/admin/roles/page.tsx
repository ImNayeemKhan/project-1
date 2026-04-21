'use client';

/**
 * Role / permission matrix — read-only reference page.
 *
 * Matches the enforcement in apps/api/src/middleware/auth.ts. If you
 * change a role's capabilities in the API, mirror the change here so the
 * team has one source of truth they can screenshot and hand to auditors.
 */

type Role = 'admin' | 'reseller' | 'support' | 'noc' | 'finance' | 'customer';

interface Row {
  area: string;
  items: { label: string; perms: Partial<Record<Role, '✓' | 'own' | '—'>> }[];
}

const matrix: Row[] = [
  {
    area: 'Customers',
    items: [
      { label: 'View any customer', perms: { admin: '✓', reseller: 'own', support: '✓', noc: '—', finance: '✓' } },
      { label: 'Create / update customer', perms: { admin: '✓', reseller: 'own', support: '✓' } },
      { label: 'Impersonate customer', perms: { admin: '✓' } },
    ],
  },
  {
    area: 'Subscriptions',
    items: [
      { label: 'Provision new PPPoE', perms: { admin: '✓', reseller: 'own', noc: '✓' } },
      { label: 'Suspend / reactivate', perms: { admin: '✓', reseller: 'own', noc: '✓' } },
      { label: 'Change package', perms: { admin: '✓', reseller: 'own', customer: 'own' } },
      { label: 'Pause / resume', perms: { admin: '✓', reseller: 'own', customer: 'own' } },
    ],
  },
  {
    area: 'Billing',
    items: [
      { label: 'View invoices', perms: { admin: '✓', reseller: 'own', finance: '✓', customer: 'own' } },
      { label: 'Void invoice', perms: { admin: '✓', finance: '✓' } },
      { label: 'Record manual payment', perms: { admin: '✓', finance: '✓' } },
      { label: 'Download invoice PDF', perms: { admin: '✓', reseller: 'own', finance: '✓', customer: 'own' } },
    ],
  },
  {
    area: 'Network / NOC',
    items: [
      { label: 'MikroTik routers CRUD', perms: { admin: '✓', noc: '✓' } },
      { label: 'Router health dashboard', perms: { admin: '✓', noc: '✓' } },
      { label: 'FTP / BDIX server CRUD', perms: { admin: '✓', noc: '✓' } },
    ],
  },
  {
    area: 'Support',
    items: [
      { label: 'Tickets — view all', perms: { admin: '✓', support: '✓', reseller: 'own' } },
      { label: 'Tickets — reply', perms: { admin: '✓', support: '✓' } },
      { label: 'Tickets — close', perms: { admin: '✓', support: '✓' } },
    ],
  },
  {
    area: 'Ops & system',
    items: [
      { label: 'Audit log', perms: { admin: '✓' } },
      { label: 'Feature flags', perms: { admin: '✓' } },
      { label: 'Bulk import', perms: { admin: '✓' } },
      { label: 'Webhooks', perms: { admin: '✓' } },
      { label: 'Health dashboard', perms: { admin: '✓', noc: '✓' } },
    ],
  },
];

const roles: Role[] = ['admin', 'reseller', 'support', 'noc', 'finance', 'customer'];

export default function RolesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Role & permission matrix</h1>
      <p className="text-sm text-slate-600">
        ✓ = full access. <span className="font-semibold">own</span> = limited to records they own
        (a reseller&apos;s customers, a customer&apos;s own account). — = no access.
      </p>
      {matrix.map((section) => (
        <div key={section.area} className="card overflow-x-auto p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-900">
            {section.area}
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="table-th">Capability</th>
                {roles.map((r) => (
                  <th key={r} className="table-th capitalize">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {section.items.map((it) => (
                <tr key={it.label}>
                  <td className="table-td">{it.label}</td>
                  {roles.map((r) => {
                    const v = it.perms[r] ?? '—';
                    return (
                      <td
                        key={r}
                        className={
                          v === '✓'
                            ? 'table-td text-center font-semibold text-emerald-600'
                            : v === 'own'
                            ? 'table-td text-center text-xs font-semibold text-amber-600'
                            : 'table-td text-center text-slate-300'
                        }
                      >
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
