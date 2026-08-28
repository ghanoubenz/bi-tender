import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, EmptyState } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'

export default async function ContactsPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()

  const contacts = await payload.find({
    collection: 'contacts',
    where: (tenant ? { tenant: { equals: tenant } } : {}) as Where,
    sort: 'fullName',
    limit: 200,
    depth: 1,
  })

  return (
    <>
      <Topbar title="Contacts" subtitle={`${contacts.totalDocs} people`} />
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          {contacts.docs.length === 0 ? (
            <EmptyState title="No contacts yet" body="People at your clients and partners appear here." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {['Name', 'Company', 'Role', 'Email', 'Phone'].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.docs.map((c) => {
                  const company = typeof c.company === 'object' ? c.company?.name : null
                  return (
                    <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-raised)]">
                      <td className="px-4 py-2.5 text-[13px] font-medium">
                        {c.fullName}
                        {c.isPrimary && <Badge tone="accent">Primary</Badge>}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{company ?? '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{c.jobTitle || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{c.email || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{c.phone || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}
