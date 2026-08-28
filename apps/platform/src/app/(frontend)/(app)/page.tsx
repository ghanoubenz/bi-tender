import Link from 'next/link'
import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { readinessOf } from '@/lib/readiness'
import { STAGE_LABELS, daysUntil, formatDate, formatDeadline, formatMoney } from '@/lib/format'

const WORKING_ON = ['identified', 'qualifying', 'preparing']

/**
 * The dashboard answers four questions in plain language, in the order a
 * person actually asks them:
 *   1. What needs me today?
 *   2. What are we working on?
 *   3. How are we doing?
 *   4. What just arrived?
 * Every number is a link straight to the screen that answers it — no hunting.
 */
export default async function DashboardPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()
  const scope: Where = tenant ? { tenant: { equals: tenant } } : {}

  const [tenders, requirements, tasks] = await Promise.all([
    payload.find({ collection: 'tenders', where: scope, limit: 200, depth: 1, sort: 'submissionDeadline' }),
    payload.find({ collection: 'requirements', where: scope, limit: 500, depth: 0 }),
    payload.find({
      collection: 'tasks',
      where: { ...scope, status: { not_equals: 'done' } },
      sort: 'dueDate',
      limit: 6,
      depth: 0,
    }),
  ])

  const all = tenders.docs
  const working = all.filter((t) => WORKING_ON.includes(t.stage as string))
  const submitted = all.filter((t) => t.stage === 'submitted')
  const won = all.filter((t) => t.stage === 'won')
  const lost = all.filter((t) => t.stage === 'lost')

  const sum = (list: typeof all) =>
    list.reduce((n, t) => n + (t.estimatedValue ?? 0), 0)

  const closingThisWeek = working.filter((t) => {
    const d = daysUntil(t.submissionDeadline)
    return d !== null && d >= 0 && d <= 7
  })

  const requirementsByTender = new Map<number, typeof requirements.docs>()
  for (const r of requirements.docs) {
    const id = typeof r.tender === 'object' ? r.tender?.id : (r.tender as number)
    if (!id) continue
    requirementsByTender.set(id, [...(requirementsByTender.get(id) ?? []), r])
  }

  const missingThings = requirements.docs.filter((r) => r.complianceStatus === 'gap')
  const notChecked = requirements.docs.filter((r) => r.complianceStatus === 'unknown')
  const undecided = working.filter((t) => !t.decision)
  const decided = won.length + lost.length
  const winRate = decided > 0 ? Math.round((won.length / decided) * 100) : null

  const attention = [
    closingThisWeek.length && {
      href: '/tenders',
      text: `${closingThisWeek.length} tender${closingThisWeek.length > 1 ? 's close' : ' closes'} within 7 days`,
      tone: 'critical' as const,
    },
    missingThings.length && {
      href: `/tenders/${firstTenderWithGap(requirements.docs)}?tab=compliance`,
      text: `${missingThings.length} thing${missingThings.length > 1 ? 's we' : ' we'} don't have yet`,
      tone: 'critical' as const,
    },
    notChecked.length && {
      href: `/tenders/${firstTenderWithUnknown(requirements.docs)}?tab=requirements`,
      text: `${notChecked.length} requirement${notChecked.length > 1 ? 's' : ''} nobody has checked`,
      tone: 'caution' as const,
    },
    undecided.length && {
      href: '/tenders',
      text: `${undecided.length} tender${undecided.length > 1 ? 's need' : ' needs'} a bid / no-bid decision`,
      tone: 'caution' as const,
    },
  ].filter(Boolean) as { href: string; text: string; tone: 'critical' | 'caution' }[]

  return (
    <>
      <Topbar title="Dashboard" subtitle={`Welcome back, ${firstName(user)}`} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* 1. What needs me today */}
        <Card className="mb-4">
          <CardHeader title="Needs your attention" />
          {attention.length === 0 ? (
            <EmptyState title="Nothing urgent" body="No deadlines this week and nothing waiting on a decision." />
          ) : (
            <ul>
              {attention.map((a, i) => (
                <li key={i} className="border-b border-[var(--color-border)] last:border-0">
                  <Link
                    href={a.href}
                    className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--color-raised)]"
                  >
                    <span className="flex items-center gap-2.5 text-[13px]">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          a.tone === 'critical'
                            ? 'bg-[var(--color-critical)]'
                            : 'bg-[var(--color-caution)]'
                        }`}
                      />
                      {a.text}
                    </span>
                    <span className="text-[12px] text-[var(--color-accent)]">Open →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* 2 & 3. What we're working on, and how we're doing */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PlainTile
            label="Working on now"
            value={working.length}
            sub={formatMoney(sum(working))}
            href="/tenders"
          />
          <PlainTile
            label="Sent in, waiting to hear"
            value={submitted.length}
            sub={formatMoney(sum(submitted))}
            href="/tenders"
          />
          <PlainTile
            label="Won"
            value={won.length}
            sub={formatMoney(sum(won))}
            href="/tenders"
            tone="positive"
          />
          <PlainTile
            label="Win rate"
            value={winRate === null ? '—' : `${winRate}%`}
            sub={decided ? `${won.length} won of ${decided} decided` : 'No results yet'}
            href="/tenders"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Tenders we're working on"
              action={
                <Link href="/tenders" className="text-[12px] text-[var(--color-accent)]">
                  See all
                </Link>
              }
            />
            {working.length === 0 ? (
              <EmptyState title="Nothing in progress" body="Tenders you are preparing appear here." />
            ) : (
              <ul>
                {working.map((t) => {
                  const d = formatDeadline(t.submissionDeadline)
                  const ready = readinessOf(requirementsByTender.get(t.id) ?? [])
                  const client = typeof t.client === 'object' ? t.client?.name : null
                  return (
                    <li key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <Link
                        href={`/tenders/${t.id}`}
                        className="block px-4 py-3 transition-colors hover:bg-[var(--color-raised)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium">{t.title}</div>
                            <div className="text-[12px] text-[var(--color-ink-faint)]">
                              {client ?? 'No client'} · {formatMoney(t.estimatedValue)} · due{' '}
                              {formatDate(t.submissionDeadline)}
                            </div>
                          </div>
                          <Badge tone={d.tone}>{d.text}</Badge>
                        </div>

                        <div className="mt-2.5 flex items-center gap-3">
                          <ReadinessBar readiness={ready} />
                          <span className="w-[168px] shrink-0 text-right text-[12px] text-[var(--color-ink-soft)]">
                            {ready.score === null ? ready.label : `${ready.score}% ready · ${ready.label}`}
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Your to-do list"
                action={<Link href="/tasks" className="text-[12px] text-[var(--color-accent)]">All</Link>}
              />
              {tasks.docs.length === 0 ? (
                <EmptyState title="Nothing to do" body="Work assigned to you shows up here." />
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
                        <Badge tone={d.tone}>{d.text}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>

            {/* 4. What just arrived */}
            <Card>
              <CardHeader title="New tenders arriving" />
              <div className="px-4 py-4">
                <p className="text-[13px] text-[var(--color-ink-soft)]">
                  Nothing new today.
                </p>
                <p className="mt-1.5 text-[12px] text-[var(--color-ink-faint)]">
                  Connecting your email and tender portals so new invitations land here
                  automatically — and get scored for fit before anyone opens them — is the next
                  major step.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function PlainTile({
  label,
  value,
  sub,
  href,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  sub?: string
  href: string
  tone?: 'neutral' | 'positive'
}) {
  return (
    <Link
      href={href}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-colors hover:border-[var(--color-border-strong)]"
    >
      <div className="text-[12px] text-[var(--color-ink-soft)]">{label}</div>
      <div
        className={`tnum mt-1 text-[26px] font-semibold leading-none tracking-tight ${
          tone === 'positive' ? 'text-[var(--color-positive)]' : ''
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[12px] text-[var(--color-ink-faint)]">{sub}</div>}
    </Link>
  )
}

function ReadinessBar({ readiness }: { readiness: ReturnType<typeof readinessOf> }) {
  const pct = readiness.score ?? 0
  const colour =
    readiness.tone === 'positive'
      ? 'var(--color-positive)'
      : readiness.tone === 'critical'
        ? 'var(--color-critical)'
        : readiness.tone === 'caution'
          ? 'var(--color-caution)'
          : 'var(--color-border-strong)'
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-canvas)]">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
    </div>
  )
}

function firstName(user: { fullName?: string | null; email?: string } | null) {
  const name = user?.fullName?.split(' ')[0]
  return name || user?.email?.split('@')[0] || 'there'
}

function firstTenderWithGap(reqs: { tender?: unknown; complianceStatus?: string | null }[]) {
  const hit = reqs.find((r) => r.complianceStatus === 'gap')
  return tenderIdOf(hit?.tender) ?? ''
}
function firstTenderWithUnknown(reqs: { tender?: unknown; complianceStatus?: string | null }[]) {
  const hit = reqs.find((r) => r.complianceStatus === 'unknown')
  return tenderIdOf(hit?.tender) ?? ''
}
function tenderIdOf(t: unknown): number | null {
  if (typeof t === 'number') return t
  if (t && typeof t === 'object' && 'id' in t) return (t as { id: number }).id
  return null
}
