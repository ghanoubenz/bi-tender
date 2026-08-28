import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, EmptyState, type Tone } from '@/components/ui'
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
      <Topbar title="Companies" subtitle={`${companies.totalDocs} companies`} />
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          {companies.docs.length === 0 ? (
            <EmptyState title="No companies yet" body="Clients, prospects and competitors appear here." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {['Company', 'Type', 'Country', 'Industry', 'Tenders'].map((h, i) => (
                    <th key={h} className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)] ${i === 4 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.docs.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-raised)]">
                    <td className="px-4 py-2.5 text-[13px] font-medium">{c.name}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={KIND[c.kind as string]?.tone ?? 'neutral'}>{KIND[c.kind as string]?.label ?? c.kind}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{c.country || '—'}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{c.industry || '—'}</td>
                    <td className="tnum px-4 py-2.5 text-right text-[13px]">{tenderCount.get(c.id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}
