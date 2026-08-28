import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, CardHeader, ComingSoon, EmptyState, Tone } from '@/components/ui'
import { RequirementsPanel } from '@/components/RequirementsPanel'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import {
  COMPLIANCE_LABELS,
  STAGE_LABELS,
  formatDate,
  formatDeadline,
  formatMoney,
} from '@/lib/format'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'documents', label: 'Documents' },
  { key: 'requirements', label: 'Requirements' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'pricing', label: 'Pricing', phase: 'Phase B6' },
  { key: 'legal', label: 'Legal', phase: 'Phase B7' },
  { key: 'risks', label: 'Risks', phase: 'Phase B5' },
  { key: 'proposal', label: 'Proposal', phase: 'Phase B8' },
]

const COMPLIANCE_TONE: Record<string, Tone> = {
  compliant: 'positive',
  partial: 'caution',
  gap: 'critical',
  unknown: 'neutral',
}

export default async function TenderWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams

  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()

  const tender = await payload.findByID({ collection: 'tenders', id, depth: 1 }).catch(() => null)
  // Tenant check belongs here too: never serve another workspace's tender.
  const tenderTenant =
    typeof tender?.tenant === 'object' ? tender?.tenant?.id : (tender?.tenant as number | undefined)
  if (!tender || (tenant && tenderTenant !== tenant)) notFound()

  const [requirements, documents, checklists, tasks] = await Promise.all([
    payload.find({
      collection: 'requirements',
      where: { tender: { equals: id } },
      limit: 200,
      depth: 1,
      sort: 'category',
    }),
    payload.find({ collection: 'tender-documents', where: { tender: { equals: id } }, limit: 50 }),
    payload.find({ collection: 'tender-checklists', where: { tender: { equals: id } }, limit: 10 }),
    payload.find({ collection: 'tasks', where: { tender: { equals: id } }, limit: 50, depth: 0 }),
  ])

  const deadline = formatDeadline(tender.submissionDeadline)
  const client = typeof tender.client === 'object' ? tender.client?.name : null
  const gaps = requirements.docs.filter((r) => r.complianceStatus === 'gap').length

  return (
    <>
      <Topbar
        title={tender.title}
        subtitle={`${client ?? 'No client'} · ${tender.reference || 'No reference'}`}
      />

      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
        <div className="flex flex-wrap items-center gap-2 pb-3">
          <Badge tone="accent">{STAGE_LABELS[tender.stage as string] ?? tender.stage}</Badge>
          <Badge tone={deadline.tone}>{deadline.text}</Badge>
          <span className="text-[12px] text-[var(--color-ink-faint)]">
            Due {formatDate(tender.submissionDeadline)} · {formatMoney(tender.estimatedValue)}
            {tender.country ? ` · ${tender.country}` : ''}
          </span>
          {tender.decision && (
            <Badge tone={tender.decision === 'no_bid' ? 'critical' : 'positive'}>
              {tender.decision === 'no_bid' ? 'No-Bid' : tender.decision === 'bid' ? 'Bid' : 'Hold'}
            </Badge>
          )}
          {gaps > 0 && <Badge tone="critical">{gaps} compliance gap{gaps > 1 ? 's' : ''}</Badge>}
        </div>

        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <Link
                key={t.key}
                href={`/tenders/${id}?tab=${t.key}`}
                className={`whitespace-nowrap border-b-2 px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? 'border-[var(--color-accent)] font-medium text-[var(--color-accent)]'
                    : 'border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
                }`}
              >
                {t.label}
                {t.phase && (
                  <span className="ml-1.5 text-[10px] uppercase text-[var(--color-ink-faint)]">
                    soon
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader title="Tender details" />
              <dl className="grid grid-cols-2 gap-px bg-[var(--color-border)]">
                {[
                  ['Client', client ?? '—'],
                  ['Reference', tender.reference || '—'],
                  ['Country', tender.country || '—'],
                  ['Submission deadline', formatDate(tender.submissionDeadline)],
                  ['Estimated value', formatMoney(tender.estimatedValue)],
                  ['Stage', STAGE_LABELS[tender.stage as string] ?? '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-[var(--color-surface)] px-4 py-3">
                    <dt className="text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                      {k}
                    </dt>
                    <dd className="mt-0.5 text-[13px] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              {tender.scope && (
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                  <div className="text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                    Scope
                  </div>
                  <p className="mt-1 text-[13px]">{tender.scope}</p>
                </div>
              )}
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader title="Bid / No-Bid decision" />
                <div className="px-4 py-4">
                  {tender.decision ? (
                    <>
                      <Badge tone={tender.decision === 'no_bid' ? 'critical' : 'positive'}>
                        {tender.decision === 'no_bid' ? 'No-Bid' : 'Bid'}
                      </Badge>
                      <p className="mt-2 text-[13px]">{tender.decisionReason}</p>
                    </>
                  ) : (
                    <p className="text-[13px] text-[var(--color-ink-soft)]">
                      Not yet decided. The decision is always made by a person and recorded with a
                      reason.
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="AI analysis" />
                <div className="px-4 py-4">
                  <p className="text-[13px] text-[var(--color-ink-soft)]">
                    {tender.processingStatus === 'ready'
                      ? 'Analysis complete.'
                      : 'No AI analysis yet.'}
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--color-ink-faint)]">
                    Requirements below were entered by a person. When the Tender AI Engine connects,
                    it fills the same fields automatically — with the same citations.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'requirements' && <RequirementsPanel requirements={requirements.docs as never} />}

        {tab === 'compliance' && (
          <Card>
            <CardHeader title={`Compliance matrix — ${requirements.totalDocs} requirements`} />
            {requirements.docs.length === 0 ? (
              <EmptyState title="No requirements yet" body="Add requirements to build the matrix." />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left">
                    {['Requirement', 'Category', 'Status', 'Satisfied by'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requirements.docs.map((r) => {
                    const matched = (r.matchedCapabilities ?? []) as { name?: string }[]
                    return (
                      <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                        <td className="max-w-[420px] px-4 py-2.5 text-[13px]">{r.text}</td>
                        <td className="px-4 py-2.5 text-[12px] text-[var(--color-ink-soft)]">
                          {r.category}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={COMPLIANCE_TONE[r.complianceStatus as string] ?? 'neutral'}>
                            {COMPLIANCE_LABELS[r.complianceStatus as string] ?? r.complianceStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[var(--color-ink-soft)]">
                          {matched.length
                            ? matched.map((m) => m?.name).filter(Boolean).join(', ')
                            : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )}

        {tab === 'documents' && (
          <Card>
            <CardHeader title="Tender package" />
            {documents.docs.length === 0 ? (
              <EmptyState
                title="No documents uploaded"
                body="Upload the ITT, specifications and BoQ here. In Phase 2 these are parsed automatically."
              />
            ) : (
              <ul>
                {documents.docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5 last:border-0"
                  >
                    <span className="text-[13px]">{d.filename}</span>
                    <Badge>{d.ingestionStatus ?? 'not processed'}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === 'checklist' && (
          <div className="space-y-4">
            {checklists.docs.length === 0 ? (
              <Card>
                <EmptyState
                  title="No checklist applied"
                  body="Apply a template to track everything this tender requires."
                />
              </Card>
            ) : (
              checklists.docs.map((c) => (
                <Card key={c.id}>
                  <CardHeader title={c.name} />
                  {(c.sections ?? []).map((section, i: number) => {
                    return (
                      <div key={i} className="border-b border-[var(--color-border)] last:border-0">
                        <div className="bg-[var(--color-raised)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                          {section.title}
                        </div>
                        {(section.items ?? []).map((item, j: number) => (
                          <div
                            key={j}
                            className="flex items-center justify-between px-4 py-2 text-[13px]"
                          >
                            <span>{item.label}</span>
                            <Badge
                              tone={
                                item.status === 'done'
                                  ? 'positive'
                                  : item.status === 'in_progress'
                                    ? 'caution'
                                    : 'neutral'
                              }
                            >
                              {item.status?.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </Card>
              ))
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <Card>
            <CardHeader title="Tasks" />
            {tasks.docs.length === 0 ? (
              <EmptyState title="No tasks" body="Work assigned for this tender appears here." />
            ) : (
              <ul>
                {tasks.docs.map((t) => {
                  const d = formatDeadline(t.dueDate)
                  return (
                    <li
                      key={t.id}
                      className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5 last:border-0"
                    >
                      <span className="text-[13px]">{t.title}</span>
                      <span className="flex gap-2">
                        <Badge tone={t.priority === 'high' ? 'critical' : 'neutral'}>
                          {t.status?.replace('_', ' ')}
                        </Badge>
                        <Badge tone={d.tone}>{d.text}</Badge>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        )}

        {['pricing', 'legal', 'risks', 'proposal'].includes(tab) && (
          <ComingSoon
            feature={TABS.find((t) => t.key === tab)?.label ?? ''}
            phase={TABS.find((t) => t.key === tab)?.phase ?? 'a later phase'}
          />
        )}
      </div>
    </>
  )
}
