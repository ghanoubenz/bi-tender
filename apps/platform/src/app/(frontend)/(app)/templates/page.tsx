import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Card, EmptyState } from '@/components/ui'
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
      <Topbar
        title="Checklist templates"
        subtitle={`${templates.totalDocs} reusable templates — this is how the product is customized per industry`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          {templates.docs.length === 0 ? (
            <EmptyState title="No templates yet" body="Templates capture how your industry bids — build once, apply to every tender." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {['Template', 'Industry', 'Tender type', 'Contents'].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.docs.map((t) => {
                  const sections = (t.sections ?? []) as { items?: unknown[] }[]
                  const items = sections.reduce((n, s) => n + (s.items?.length ?? 0), 0)
                  return (
                    <tr key={t.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-raised)]">
                      <td className="px-4 py-2.5 text-[13px] font-medium">{t.name}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{t.industry || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{t.tenderType || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{sections.length} sections · {items} items</td>
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
