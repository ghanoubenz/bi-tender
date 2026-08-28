import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, EmptyState, type Tone } from '@/components/ui'
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

  return (
    <>
      <Topbar
        title="Capabilities"
        subtitle={`${caps.totalDocs} entries — what your company has, matched against what tenders require`}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Card>
          {caps.docs.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              body="Certifications, services, equipment and past projects live here — entered once, used by every tender."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {['Name', 'Type', 'Category', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caps.docs.map((c) => {
                  const expiring =
                    c.kind === 'certification' && c.validUntil
                      ? (daysUntil(c.validUntil) ?? 999) < 90
                      : false
                  return (
                    <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-raised)]">
                      <td className="px-4 py-2.5 text-[13px] font-medium">{c.name}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={KIND[c.kind as string]?.tone ?? 'neutral'}>{KIND[c.kind as string]?.label ?? c.kind}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{c.category || '—'}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">
                        {c.kind === 'certification' && c.validUntil && (
                          <span className={expiring ? 'font-medium text-[var(--color-caution)]' : ''}>
                            Valid until {formatDate(c.validUntil)}
                            {expiring && ' — renew soon'}
                          </span>
                        )}
                        {c.kind === 'project_reference' && (
                          <span>
                            {c.year ?? ''}{c.value ? ` · ${formatMoney(c.value)}` : ''}{c.country ? ` · ${c.country}` : ''}
                          </span>
                        )}
                        {!['certification', 'project_reference'].includes(c.kind as string) && (c.description || '—')}
                      </td>
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
