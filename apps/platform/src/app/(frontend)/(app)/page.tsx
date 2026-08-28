import Link from 'next/link'
import type { Where } from 'payload'
import { Sidebar } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui'
import { PipelineChart } from '@/components/PipelineChart'
import { IconAlert, IconArrowRight, IconClock, IconPlus } from '@/components/icons'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { readinessOf } from '@/lib/readiness'
import { STAGE_LABELS, daysUntil, formatDate, formatDeadline, formatMoney } from '@/lib/format'

const WORKING_ON = ['identified', 'qualifying', 'preparing']

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()
  const scope: Where = tenant ? { tenant: { equals: tenant } } : {}

  const [tenders, requirements, tasks] = await Promise.all([
    payload.find({ collection: 'tenders', where: scope, limit: 200, depth: 1, sort: 'submissionDeadline' }),
    payload.find({ collection: 'requirements', where: scope, limit: 500, depth: 0 }),
    payload.find({ collection: 'tasks', where: { ...scope, status: { not_equals: 'done' } }, sort: 'dueDate', limit: 5, depth: 0 }),
  ])

  const all = tenders.docs
  const working = all.filter((t) => WORKING_ON.includes(t.stage as string))
  const submitted = all.filter((t) => t.stage === 'submitted')
  const won = all.filter((t) => t.stage === 'won')
  const lost = all.filter((t) => t.stage === 'lost')
  const sum = (l: typeof all) => l.reduce((n, t) => n + (t.estimatedValue ?? 0), 0)

  const counts: Record<string, number> = {}
  const values: Record<string, number> = {}
  for (const stage of Object.keys(STAGE_LABELS)) {
    const inStage = all.filter((t) => t.stage === stage)
    counts[stage] = inStage.length
    values[stage] = sum(inStage)
  }

  const reqsByTender = new Map<number, typeof requirements.docs>()
  for (const r of requirements.docs) {
    const id = typeof r.tender === 'object' ? r.tender?.id : (r.tender as number)
    if (id) reqsByTender.set(id, [...(reqsByTender.get(id) ?? []), r])
  }

  const gaps = requirements.docs.filter((r) => r.complianceStatus === 'gap')
  const unchecked = requirements.docs.filter((r) => r.complianceStatus === 'unknown')
  const undecided = working.filter((t) => !t.decision)
  const decided = won.length + lost.length
  const winRate = decided > 0 ? Math.round((won.length / decided) * 100) : null

  // The single most urgent tender anchors the page.
  const urgent = working
    .filter((t) => (daysUntil(t.submissionDeadline) ?? 999) >= 0)
    .sort((a, b) => (daysUntil(a.submissionDeadline) ?? 999) - (daysUntil(b.submissionDeadline) ?? 999))[0]
    ?? working[0]
  const urgentReady = urgent ? readinessOf(reqsByTender.get(urgent.id) ?? []) : null
  const urgentClient = urgent && typeof urgent.client === 'object' ? urgent.client?.name : null

  const attention = [
    gaps.length && { href: `/tenders/${tenderIdOf(gaps[0].tender)}?tab=compliance`, text: `${gaps.length} thing${gaps.length > 1 ? 's' : ''} we don't have yet`, tone: 'critical' as const },
    unchecked.length && { href: `/tenders/${tenderIdOf(unchecked[0].tender)}?tab=requirements`, text: `${unchecked.length} requirement${unchecked.length > 1 ? 's' : ''} nobody has checked`, tone: 'caution' as const },
    undecided.length && { href: '/tenders', text: `${undecided.length} tender${undecided.length > 1 ? 's need' : ' needs'} a bid / no-bid decision`, tone: 'caution' as const },
  ].filter(Boolean) as { href: string; text: string; tone: 'critical' | 'caution' }[]

  return (
    <>
      <Topbar
        title={greeting() + (user?.fullName ? `, ${user.fullName.split(' ')[0]}` : '')}
        subtitle={today()}
        action={
          <Link
            href="/tenders/new"
            className="transition-ui flex items-center gap-1.5 rounded-[8px] bg-[var(--color-accent)] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            <IconPlus size={14} /> New tender
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {/* Hero — the one committed surface on the page */}
          {urgent ? (
            <Link
              href={`/tenders/${urgent.id}`}
              className="transition-ui group relative overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-accent)] p-5 text-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-raised)] xl:col-span-2"
            >
              <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-white/75">
                <IconClock size={13} /> Closest deadline
              </div>
              <div className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.015em]">
                {urgent.title}
              </div>
              <div className="mt-1 text-[13px] text-white/80">
                {urgentClient ?? 'No client'} · {formatMoney(urgent.estimatedValue)} · due{' '}
                {formatDate(urgent.submissionDeadline)}
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-8">
                <div>
                  <div className="text-[11.5px] text-white/70">Time left</div>
                  <div className="tnum text-[28px] font-semibold leading-none">
                    {formatDeadline(urgent.submissionDeadline).text}
                  </div>
                </div>
                {urgentReady?.score === null ? (
                  <div className="flex-1">
                    <div className="text-[11.5px] text-white/70">Bid readiness</div>
                    <div className="text-[15px] font-medium leading-tight">
                      Nothing checked yet — add the requirements to see how ready we are
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-[11.5px] text-white/70">Bid readiness</div>
                      <div className="tnum text-[28px] font-semibold leading-none">{urgentReady?.score}%</div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1.5 text-[11.5px] text-white/70">{urgentReady?.label}</div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
                        <div className="h-full rounded-full bg-white" style={{ width: `${urgentReady?.score}%` }} />
                      </div>
                    </div>
                  </>
                )}
                <span className="transition-ui flex items-center gap-1.5 text-[12.5px] font-medium text-white/90 group-hover:text-white">
                  Open <IconArrowRight size={14} />
                </span>
              </div>
            </Link>
          ) : (
            <Card className="xl:col-span-2">
              <EmptyState title="No tenders in progress" body="Create a tender to start tracking it here." />
            </Card>
          )}

          {/* Needs your attention */}
          <Card>
            <CardHeader title="Needs your attention" />
            {attention.length === 0 ? (
              <EmptyState title="Nothing urgent" body="No gaps and nothing waiting on a decision." />
            ) : (
              <ul>
                {attention.map((a, i) => (
                  <li key={i} className="border-b border-[var(--color-border)] last:border-0">
                    <Link href={a.href} className="transition-ui flex items-center gap-2.5 px-4 py-3 hover:bg-[var(--color-raised)]">
                      <IconAlert
                        size={15}
                        className={a.tone === 'critical' ? 'text-[var(--color-critical)]' : 'text-[var(--color-caution)]'}
                      />
                      <span className="flex-1 text-[12.5px]">{a.text}</span>
                      <IconArrowRight size={14} className="text-[var(--color-ink-faint)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Headline numbers */}
        <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Working on now" value={working.length} sub={formatMoney(sum(working))} href="/tenders" />
          <Stat label="Sent in, waiting" value={submitted.length} sub={formatMoney(sum(submitted))} href="/tenders" />
          <Stat label="Won" value={won.length} sub={formatMoney(sum(won))} href="/tenders" positive />
          <Stat
            label="Win rate"
            value={winRate === null ? '—' : `${winRate}%`}
            sub={decided ? `${won.length} of ${decided} decided` : 'No results yet'}
            href="/tenders"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Tenders we're working on"
              action={<Link href="/tenders" className="text-[12px] font-medium text-[var(--color-accent)]">See all</Link>}
            />
            {working.length === 0 ? (
              <EmptyState title="Nothing in progress" body="Tenders you are preparing appear here." />
            ) : (
              <ul>
                {working.map((t) => {
                  const d = formatDeadline(t.submissionDeadline)
                  const ready = readinessOf(reqsByTender.get(t.id) ?? [])
                  const client = typeof t.client === 'object' ? t.client?.name : null
                  return (
                    <li key={t.id} className="border-b border-[var(--color-border)] last:border-0">
                      <Link href={`/tenders/${t.id}`} className="transition-ui block px-4 py-3 hover:bg-[var(--color-raised)]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium">{t.title}</div>
                            <div className="text-[12px] text-[var(--color-ink-faint)]">
                              {client ?? 'No client'} · {formatMoney(t.estimatedValue)}
                            </div>
                          </div>
                          <Badge tone={d.tone}>{d.text}</Badge>
                        </div>
                        {ready.score === null ? (
                          <div className="mt-2 text-[12px] text-[var(--color-ink-faint)]">
                            No requirements captured yet —{' '}
                            <span className="font-medium text-[var(--color-accent)]">add them to see readiness</span>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex items-center gap-3">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-canvas)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${ready.score}%`,
                                  background:
                                    ready.tone === 'positive' ? 'var(--color-positive)'
                                    : ready.tone === 'critical' ? 'var(--color-critical)'
                                    : 'var(--color-caution)',
                                }}
                              />
                            </div>
                            <span className="w-[164px] shrink-0 text-right text-[12px] text-[var(--color-ink-faint)]">
                              {ready.score}% ready · {ready.label}
                            </span>
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Pipeline" />
              <PipelineChart counts={counts} values={values} />
            </Card>

            <Card>
              <CardHeader
                title="Your to-do list"
                action={<Link href="/tasks" className="text-[12px] font-medium text-[var(--color-accent)]">All</Link>}
              />
              {tasks.docs.length === 0 ? (
                <EmptyState title="Nothing to do" body="Work assigned to you shows up here." />
              ) : (
                <ul>
                  {tasks.docs.map((task) => {
                    const d = formatDeadline(task.dueDate)
                    return (
                      <li key={task.id} className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-2.5 last:border-0">
                        <span className="min-w-0 truncate text-[12.5px]">{task.title}</span>
                        <Badge tone={d.tone}>{d.text}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function Stat({
  label, value, sub, href, positive,
}: {
  label: string; value: string | number; sub?: string; href: string; positive?: boolean
}) {
  return (
    <Link
      href={href}
      className="transition-ui rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-[var(--shadow-card)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-raised)]"
    >
      <div className="text-[12px] text-[var(--color-ink-soft)]">{label}</div>
      <div className={`tnum mt-1.5 text-[27px] font-semibold leading-none tracking-[-0.02em] ${positive ? 'text-[var(--color-positive)]' : ''}`}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[12px] text-[var(--color-ink-faint)]">{sub}</div>}
    </Link>
  )
}

function tenderIdOf(t: unknown): number | string {
  if (typeof t === 'number') return t
  if (t && typeof t === 'object' && 'id' in t) return (t as { id: number }).id
  return ''
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
function today() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
