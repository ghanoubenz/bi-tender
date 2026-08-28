import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Card, Cell, DataTable, EmptyState, PageHeading, Row, StatusDot, type Tone } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { daysUntil, formatDate, formatMoney } from '@/lib/format'

const KIND: Record<string, { label: string; tone: Tone }> = {
  capability: { label: 'Capability', tone: 'accent' },
  certification: { label: 'Certification', tone: 'positive' },
  project_reference: { label: 'Project reference', tone: 'neutral' },
  product: { label: 'Product', tone: 'neutral' },
  equipment: { label: 'Equipment', tone: 'neutral' },
}

export default async function CapabilitiesPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()

  const caps = await payload.find({
    collection: 'capabilities',
    where: (tenant ? { tenant: { equals: tenant } } : {}) as Where,
    sort: 'kind',
    limit: 300,
    depth: 0,
  })

  const expiringSoon = caps.docs.filter(
    (c) => c.kind === 'certification' && c.validUntil && (daysUntil(c.validUntil) ?? 999) < 120,
  )

  return (
    <>
      <Topbar title="Capabilities" subtitle="What we have — matched against what tenders require" />
      <div className="flex-1 overflow-y-auto p-5">
        <PageHeading
          title="Company capabilities"
          count={`${caps.totalDocs} entries${expiringSoon.length ? ` · ${expiringSoon.length} certification${expiringSoon.length > 1 ? 's' : ''} expiring within 4 months` : ''}`}
        />
        <Card>
          {caps.docs.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              body="Certifications, services, equipment and past projects live here — entered once, used by every tender."
            />
          ) : (
            <DataTable columns={[{ label: 'Name' }, { label: 'Type' }, { label: 'Category' }, { label: 'Details' }]}>
              {caps.docs.map((c) => {
                const expiring =
                  c.kind === 'certification' && c.validUntil ? (daysUntil(c.validUntil) ?? 999) < 120 : false
                return (
                  <Row key={c.id}>
                    <Cell strong>{c.name}</Cell>
                    <Cell>
                      <StatusDot tone={KIND[c.kind as string]?.tone ?? 'neutral'}>
                        {KIND[c.kind as string]?.label ?? c.kind}
                      </StatusDot>
                    </Cell>
                    <Cell>{c.category || '—'}</Cell>
                    <Cell>
                      {c.kind === 'certification' && c.validUntil && (
                        <span className={expiring ? 'font-medium text-[var(--color-caution)]' : ''}>
                          Valid until {formatDate(c.validUntil)}
                          {expiring && ' — renew soon'}
                        </span>
                      )}
                      {c.kind === 'project_reference' && (
                        <span>
                          {c.year ?? ''}
                          {c.value ? ` · ${formatMoney(c.value)}` : ''}
                          {c.country ? ` · ${c.country}` : ''}
                        </span>
                      )}
                      {!['certification', 'project_reference'].includes(c.kind as string) && (c.description || '—')}
                    </Cell>
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
