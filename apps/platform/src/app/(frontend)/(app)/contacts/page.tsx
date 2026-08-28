import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, Cell, DataTable, EmptyState, PageHeading, Row } from '@/components/ui'
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
      <Topbar title="Contacts" subtitle="The people behind each tender" />
      <div className="flex-1 overflow-y-auto p-5">
        <PageHeading title="Contacts" count={`${contacts.totalDocs} people`} />
        <Card>
          {contacts.docs.length === 0 ? (
            <EmptyState
              title="No contacts yet"
              body="Procurement leads and contract engineers you deal with appear here."
            />
          ) : (
            <DataTable
              columns={[{ label: 'Name' }, { label: 'Company' }, { label: 'Email' }, { label: 'Phone' }]}
            >
              {contacts.docs.map((c) => {
                const company = typeof c.company === 'object' ? c.company?.name : null
                return (
                  <Row key={c.id}>
                    <Cell strong sub={c.jobTitle || undefined}>
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[10.5px] font-semibold text-[var(--color-accent-ink)]">
                          {c.fullName.split(' ').slice(0, 2).map((n) => n[0]).join('')}
                        </span>
                        {c.fullName}
                        {c.isPrimary && <Badge tone="accent">Primary</Badge>}
                      </span>
                    </Cell>
                    <Cell>{company ?? '—'}</Cell>
                    <Cell>{c.email || '—'}</Cell>
                    <Cell>{c.phone || '—'}</Cell>
                  </Row>
                )
              })}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  )
}
