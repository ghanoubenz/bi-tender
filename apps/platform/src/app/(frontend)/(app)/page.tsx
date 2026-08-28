import Link from 'next/link'
import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, CardHeader, EmptyState, StatTile } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { STAGE_LABELS, formatDate, formatDeadline, formatMoney } from '@/lib/format'

const ACTIVE_STAGES = ['identified', 'qualifying', 'preparing']

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()
  const scope: Where = tenant ? { tenant: { equals: tenant } } : {}

  const [active, requirements, tasks] = await Promise.all([
    payload.find({
      collection: 'tenders',
      where: { ...scope, stage: { in: ACTIVE_STAGES } },
      sort: 'submissionDeadline',
      limit: 50,
      depth: 1,
    }),
    payload.find({ collection: 'requirements', where: scope, limit: 200, depth: 0 }),
    payload.find({
      collection: 'tasks',
      where: { ...scope, status: { not_equals: 'done' } },
      sort: 'dueDate',
      limit: 6,
      depth: 0,
    }),
  ])

  const dueSoon = active.docs.filter((t) => {
    const d = t.submissionDeadline ? formatDeadline(t.submissionDeadline) : null
    return d?.tone === 'critical' || d?.tone === 'caution'
  })
  const gaps = requirements.docs.filter((r) => r.complianceStatus === 'gap')
  const unassessed = requirements.docs.filter((r) => r.complianceStatus === 'unknown')

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Signed in as ${user?.fullName ?? user?.email}`} />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Active tenders" value={active.totalDocs} href="/tenders" />
          <StatTile
            label="Due soon"
            value={dueSoon.length}
            hint={dueSoon.length ? 'within 21 days' : undefined}
            tone="caution"
            href="/tenders"
          />
          <StatTile
            label="Compliance gaps"
            value={gaps.length}
            hint={gaps.length ? 'action needed' : undefined}
            tone="critical"
          />
          <StatTile
            label="Not yet assessed"
            value={unassessed.length}
            hint={unassessed.length ? 'needs review' : undefined}
            tone="caution"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Upcoming deadlines"
              action={
                <Link href="/tenders" className="text-[12px] text-[var(--color-accent)]">
                  All tenders
                </Link>
              }
            />
            {active.docs.length === 0 ? (
              <EmptyState title="No active tenders" body="Tenders you are working on appear here." />
            ) : (
              <table className="w-full">
                <tbody>
                  {active.docs.slice(0, 7).map((t) => {
                    const d = formatDeadline(t.submissionDeadline)
                    const client = typeof t.client === 'object' ? t.client?.name : null
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-[var(--color-border)] last:border-0"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            href={`/tenders/${t.id}`}
                            className="text-[13px] font-medium hover:text-[var(--color-accent)]"
                          >
                            {t.title}
                          </Link>
                          <div className="text-[12px] text-[var(--color-ink-faint)]">
                            {client ?? 'No client'} · {t.reference || 'No reference'}
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          <Badge>{STAGE_LABELS[t.stage as string] ?? t.stage}</Badge>
                        </td>
                        <td className="tnum px-2 py-2.5 text-right text-[13px] text-[var(--color-ink-soft)]">
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

          <div className="space-y-4">
            <Card>
              <CardHeader title="Open tasks" />
              {tasks.docs.length === 0 ? (
                <EmptyState title="Nothing outstanding" body="Assigned work shows up here." />
              ) : (
                <ul>
                  {tasks.docs.map((task) => {
                    const d = formatDeadline(task.dueDate)
                    return (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-2.5 last:border-0"
                      >
                        <span className="min-w-0 truncate text-[13px]">{task.title}</span>
                        <Badge tone={task.priority === 'high' ? 'critical' : d.tone}>{d.text}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="AI processing" />
              <div className="px-4 py-5">
                <p className="text-[13px] text-[var(--color-ink-soft)]">
                  No documents being analysed.
                </p>
                <p className="mt-1 text-[12px] text-[var(--color-ink-faint)]">
                  The Tender AI Engine connects in Phase 2. Requirements entered by hand today use
                  the same structure it will produce, so nothing here has to change.
                </p>
              </div>
            </Card>
          </div>
        </div>

        <Card className="mt-4">
          <CardHeader title="Pipeline" />
          <div className="grid grid-cols-2 divide-y divide-[var(--color-border)] sm:grid-cols-4 sm:divide-y-0 lg:grid-cols-7">
            {Object.entries(STAGE_LABELS).map(([stage, label]) => (
              <StageCell key={stage} stage={stage} label={label} tenantWhere={scope} />
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

async function StageCell({
  stage,
  label,
  tenantWhere,
}: {
  stage: string
  label: string
  tenantWhere: Where
}) {
  const payload = await getClient()
  const { totalDocs } = await payload.find({
    collection: 'tenders',
    where: { ...tenantWhere, stage: { equals: stage } },
    limit: 0,
    depth: 0,
  })
  return (
    <div className="border-r border-[var(--color-border)] px-4 py-3 last:border-r-0">
      <div className="text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
        {label}
      </div>
      <div className="tnum mt-0.5 text-[20px] font-semibold">{totalDocs}</div>
    </div>
  )
}
