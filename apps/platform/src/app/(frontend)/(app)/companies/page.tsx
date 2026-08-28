import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Card, Cell, DataTable, EmptyState, PageHeading, Row, StatusDot, type Tone } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'

const KIND: Record<string, { label: string; tone: Tone }> = {
  client: { label: 'Client', tone: 'accent' },
  prospect: { label: 'Prospect', tone: 'neutral' },
  competitor: { label: 'Competitor', tone: 'caution' },
  partner: { label: 'Partner', tone: 'positive' },
}

export default async function CompaniesPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()
  const scope: Where = tenant ? { tenant: { equals: tenant } } : {}

  const [companies, tenders] = await Promise.all([
    payload.find({ collection: 'companies', where: scope, sort: 'name', limit: 200, depth: 0 }),
    payload.find({ collection: 'tenders', where: scope, limit: 500, depth: 0 }),
  ])

  const tenderCount = new Map<number, number>()
  for (const t of tenders.docs) {
    const id = typeof t.client === 'object' ? t.client?.id : (t.client as number | null)
    if (id) tenderCount.set(id, (tenderCount.get(id) ?? 0) + 1)
  }

  return (
    <>
      <Topbar title="Companies" subtitle="Clients, prospects, partners and competitors" />
      <div className="flex-1 overflow-y-auto p-5">
        <PageHeading title="Companies" count={`${companies.totalDocs} in this workspace`} />
        <Card>
          {companies.docs.length === 0 ? (
            <EmptyState
              title="No companies yet"
              body="The organisations you bid to — and compete against — live here."
            />
          ) : (
            <DataTable
              columns={[
                { label: 'Company' },
                { label: 'Relationship' },
                { label: 'Country' },
                { label: 'Tenders', align: 'right' },
              ]}
            >
              {companies.docs.map((c) => (
                <Row key={c.id}>
                  <Cell strong sub={c.industry || undefined}>{c.name}</Cell>
                  <Cell>
                    <StatusDot tone={KIND[c.kind as string]?.tone ?? 'neutral'}>
                      {KIND[c.kind as string]?.label ?? c.kind}
                    </StatusDot>
                  </Cell>
                  <Cell>{c.country || '—'}</Cell>
                  <Cell align="right"><span className="tnum">{tenderCount.get(c.id) ?? 0}</span></Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  )
}
