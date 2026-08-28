import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Card, Cell, DataTable, EmptyState, PageHeading, Row } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'

export default async function TemplatesPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()

  const templates = await payload.find({
    collection: 'checklist-templates',
    where: (tenant ? { tenant: { equals: tenant } } : {}) as Where,
    sort: 'name',
    limit: 100,
    depth: 0,
  })

  return (
    <>
      <Topbar title="Checklist templates" subtitle="How your industry bids — built once, applied to every tender" />
      <div className="flex-1 overflow-y-auto p-5">
        <PageHeading title="Checklist templates" count={`${templates.totalDocs} templates`} />
        <Card>
          {templates.docs.length === 0 ? (
            <EmptyState
              title="No templates yet"
              body="A template captures what a tender in your industry always needs, so nothing is missed twice."
            />
          ) : (
            <DataTable
              columns={[{ label: 'Template' }, { label: 'Industry' }, { label: 'Tender type' }, { label: 'Contents', align: 'right' }]}
            >
              {templates.docs.map((t) => {
                const sections = (t.sections ?? []) as { items?: unknown[] }[]
                const items = sections.reduce((n, s) => n + (s.items?.length ?? 0), 0)
                return (
                  <Row key={t.id}>
                    <Cell strong sub={t.description || undefined}>{t.name}</Cell>
                    <Cell>{t.industry || '—'}</Cell>
                    <Cell>{t.tenderType || '—'}</Cell>
                    <Cell align="right">
                      <span className="tnum">{sections.length}</span> sections ·{' '}
                      <span className="tnum">{items}</span> items
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
