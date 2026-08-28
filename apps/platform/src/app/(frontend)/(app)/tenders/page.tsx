import Link from 'next/link'
import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, Cell, DataTable, EmptyState, PageHeading, Row, StatusDot, type Tone } from '@/components/ui'
import { IconPlus } from '@/components/icons'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { STAGE_LABELS, formatDeadline, formatMoney } from '@/lib/format'
import { readinessOf } from '@/lib/readiness'

const STAGE_TONE: Record<string, Tone> = {
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
  const scope: Where = tenant ? { tenant: { equals: tenant } } : {}

  const [tenders, requirements] = await Promise.all([
    payload.find({ collection: 'tenders', where: scope, sort: 'submissionDeadline', limit: 100, depth: 1 }),
    payload.find({ collection: 'requirements', where: scope, limit: 500, depth: 0 }),
  ])

  const byTender = new Map<number, typeof requirements.docs>()
  for (const r of requirements.docs) {
    const id = typeof r.tender === 'object' ? r.tender?.id : (r.tender as number)
    if (id) byTender.set(id, [...(byTender.get(id) ?? []), r])
  }

  return (
    <>
      <Topbar title="Tenders" subtitle="Every opportunity in this workspace" />
      <div className="flex-1 overflow-y-auto p-5">
        <PageHeading
          title="Tenders"
          count={`${tenders.totalDocs} total`}
          action={
            <Link
              href="/tenders/new"
              className="transition-ui flex items-center gap-1.5 rounded-[8px] bg-[var(--color-accent)] px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              <IconPlus size={14} /> New tender
            </Link>
          }
        />
        <Card>
          {tenders.docs.length === 0 ? (
            <EmptyState title="No tenders yet" body="Create the first one — later they will also arrive here by email." />
          ) : (
            <DataTable
              columns={[
                { label: 'Tender' },
                { label: 'Client' },
                { label: 'Stage' },
                { label: 'Readiness' },
                { label: 'Value', align: 'right' },
                { label: 'Deadline', align: 'right' },
              ]}
            >
              {tenders.docs.map((t) => {
                const d = formatDeadline(t.submissionDeadline)
                const client = typeof t.client === 'object' ? t.client?.name : null
                const ready = readinessOf(byTender.get(t.id) ?? [])
                return (
                  <Row key={t.id}>
                    <Cell strong sub={t.reference || undefined}>
                      <Link href={`/tenders/${t.id}`} className="transition-ui hover:text-[var(--color-accent)]">
                        {t.title}
                      </Link>
                    </Cell>
                    <Cell>{client ?? '—'}</Cell>
                    <Cell>
                      <StatusDot tone={STAGE_TONE[t.stage as string] ?? 'neutral'}>
                        {STAGE_LABELS[t.stage as string] ?? t.stage}
                      </StatusDot>
                    </Cell>
                    <Cell>
                      {ready.score === null ? (
                        <span className="text-[12.5px] text-[var(--color-ink-faint)]">Not checked</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-canvas)]">
                            <span
                              className="block h-full rounded-full"
                              style={{
                                width: `${ready.score}%`,
                                background:
                                  ready.tone === 'positive' ? 'var(--color-positive)'
                                  : ready.tone === 'critical' ? 'var(--color-critical)'
                                  : 'var(--color-caution)',
                              }}
                            />
                          </span>
                          <span className="tnum text-[12.5px]">{ready.score}%</span>
                        </span>
                      )}
                    </Cell>
                    <Cell align="right"><span className="tnum">{formatMoney(t.estimatedValue)}</span></Cell>
                    <Cell align="right"><Badge tone={d.tone}>{d.text}</Badge></Cell>
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
