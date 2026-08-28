import Link from 'next/link'
import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, EmptyState } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { STAGE_LABELS, formatDeadline, formatMoney } from '@/lib/format'

const STAGE_TONE: Record<string, 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'> = {
  identified: 'neutral',
  qualifying: 'accent',
  preparing: 'accent',
  submitted: 'caution',
  won: 'positive',
  lost: 'critical',
  abandoned: 'neutral',
}

export default async function TendersPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()

  const { docs, totalDocs } = await payload.find({
    collection: 'tenders',
    where: (tenant ? { tenant: { equals: tenant } } : {}) as Where,
    sort: 'submissionDeadline',
    limit: 100,
    depth: 1,
  })

  return (
    <>
      <Topbar title="Tenders" subtitle={`${totalDocs} in this workspace`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex justify-end">
          <Link
            href="/tenders/new"
            className="rounded-[7px] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            New tender
          </Link>
        </div>
        <Card>
          {docs.length === 0 ? (
            <EmptyState title="No tenders yet" body="Tenders you create will be listed here." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {['Tender', 'Client', 'Stage', 'Value', 'Deadline'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)] ${
                        i >= 3 ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((t) => {
                  const d = formatDeadline(t.submissionDeadline)
                  const client = typeof t.client === 'object' ? t.client?.name : null
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-raised)]"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/tenders/${t.id}`}
                          className="text-[13px] font-medium hover:text-[var(--color-accent)]"
                        >
                          {t.title}
                        </Link>
                        <div className="text-[12px] text-[var(--color-ink-faint)]">
                          {t.reference || 'No reference'}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">
                        {client ?? '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STAGE_TONE[t.stage as string] ?? 'neutral'}>
                          {STAGE_LABELS[t.stage as string] ?? t.stage}
                        </Badge>
                      </td>
                      <td className="tnum px-4 py-2.5 text-right text-[13px] text-[var(--color-ink-soft)]">
                        {formatMoney(t.estimatedValue)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge tone={d.tone}>{d.text}</Badge>
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
