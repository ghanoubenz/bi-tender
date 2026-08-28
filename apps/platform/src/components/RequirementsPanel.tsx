'use client'

import { useMemo, useState } from 'react'
import { Badge, Card, CardHeader, EmptyState, type Tone } from './ui'
import { CATEGORY_LABELS, COMPLIANCE_LABELS } from '@/lib/format'

type Evidence = {
  page?: number | null
  clause?: string | null
  sectionPath?: string | null
  quote: string
  method?: string | null
  confidence?: number | null
  verified?: boolean | null
  document?: { filename?: string } | number | null
}

type Requirement = {
  id: number
  text: string
  category: string
  mandatory?: string | null
  complianceStatus?: string | null
  needsReview?: boolean | null
  evidence?: Evidence[] | null
  matchedCapabilities?: { name?: string }[] | null
}

const COMPLIANCE_TONE: Record<string, Tone> = {
  compliant: 'positive',
  partial: 'caution',
  gap: 'critical',
  unknown: 'neutral',
}

/**
 * Requirements with their evidence.
 *
 * Selecting a requirement opens its source: the exact quote, the page and the
 * clause it came from. Today those citations are typed by a person; in Phase 2
 * the engine produces them. The panel does not change either way — which is
 * the whole point of holding the evidence shape constant.
 */
export function RequirementsPanel({ requirements }: { requirements: Requirement[] }) {
  const [category, setCategory] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(requirements[0]?.id ?? null)

  const categories = useMemo(
    () => Array.from(new Set(requirements.map((r) => r.category))).sort(),
    [requirements],
  )
  const visible = category ? requirements.filter((r) => r.category === category) : requirements
  const selected = requirements.find((r) => r.id === selectedId) ?? null
  const evidence = selected?.evidence?.[0]

  if (requirements.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No requirements captured yet"
          body="Add requirements as you read the tender, citing the clause each came from."
        />
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader
          title={`${visible.length} requirement${visible.length === 1 ? '' : 's'}`}
          action={
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[12px] outline-none"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c] ?? c} ({requirements.filter((r) => r.category === c).length})
                </option>
              ))}
            </select>
          }
        />
        <table className="w-full">
          <tbody>
            {visible.map((r) => {
              const ev = r.evidence?.[0]
              const active = r.id === selectedId
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`cursor-pointer border-b border-[var(--color-border)] transition-colors last:border-0 ${
                    active ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-raised)]'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="text-[13px]">{r.text}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge>{CATEGORY_LABELS[r.category] ?? r.category}</Badge>
                      {r.mandatory === 'yes' && <Badge tone="critical">Mandatory</Badge>}
                      {r.complianceStatus && (
                        <Badge tone={COMPLIANCE_TONE[r.complianceStatus] ?? 'neutral'}>
                          {COMPLIANCE_LABELS[r.complianceStatus] ?? r.complianceStatus}
                        </Badge>
                      )}
                      {ev?.clause && (
                        <span className="text-[11px] text-[var(--color-ink-faint)]">
                          Clause {ev.clause}
                          {ev.page ? ` · p.${ev.page}` : ''}
                        </span>
                      )}
                      {r.needsReview && <Badge tone="caution">Needs review</Badge>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      <Card className="h-fit xl:sticky xl:top-0">
        <CardHeader title="Evidence" />
        {!selected || !evidence ? (
          <EmptyState
            title="No source recorded"
            body="Select a requirement that has a citation to see where it came from."
          />
        ) : (
          <div className="px-4 py-4">
            <p className="text-[13px] font-medium">{selected.text}</p>

            <blockquote className="mt-3 border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-3 py-2.5 text-[13px] italic">
              “{evidence.quote}”
            </blockquote>

            <dl className="mt-3 space-y-1.5 text-[12px]">
              <Row label="Document" value={documentName(evidence)} />
              <Row label="Page" value={evidence.page ? String(evidence.page) : '—'} />
              <Row label="Clause" value={evidence.clause ?? '—'} />
              <Row
                label="Source"
                value={evidence.method === 'human' ? 'Entered by a person' : (evidence.method ?? '—')}
              />
              <Row
                label="Confidence"
                value={
                  evidence.confidence != null
                    ? `${Math.round(evidence.confidence * 100)}%`
                    : '—'
                }
              />
            </dl>

            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              {evidence.verified ? (
                <span className="text-[12px] font-medium text-[var(--color-positive)]">
                  Quote confirmed against the source document
                </span>
              ) : (
                <span className="text-[12px] font-medium text-[var(--color-caution)]">
                  Quote not yet confirmed against the source — flagged for review
                </span>
              )}
            </div>

            {selected.matchedCapabilities && selected.matchedCapabilities.length > 0 && (
              <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                <div className="text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Satisfied by
                </div>
                <p className="mt-1 text-[12px]">
                  {selected.matchedCapabilities.map((c) => c?.name).filter(Boolean).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[var(--color-ink-faint)]">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function documentName(ev: Evidence) {
  if (ev.document && typeof ev.document === 'object' && ev.document.filename) {
    return ev.document.filename
  }
  return 'Tender document'
}
