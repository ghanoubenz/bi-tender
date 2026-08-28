/** Display helpers. Kept in one place so tables read consistently. */

export const STAGE_LABELS: Record<string, string> = {
  identified: 'Identified',
  qualifying: 'Qualifying',
  preparing: 'Preparing bid',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
  abandoned: 'Abandoned',
}

export const CATEGORY_LABELS: Record<string, string> = {
  technical: 'Technical',
  commercial: 'Commercial',
  contractual: 'Contractual',
  qualification: 'Qualification',
  certification: 'Certification',
  documentation: 'Documentation',
  submission: 'Submission',
  schedule: 'Schedule',
  other: 'Other',
}

export const COMPLIANCE_LABELS: Record<string, string> = {
  compliant: 'Compliant',
  partial: 'Partial',
  gap: 'Gap',
  unknown: 'Not assessed',
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Days until a deadline. Negative means it has passed. */
export function daysUntil(value?: string | null): number | null {
  if (!value) return null
  const diff = new Date(value).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

export function formatDeadline(value?: string | null) {
  const days = daysUntil(value)
  if (days === null) return { text: 'No deadline', tone: 'neutral' as const }
  if (days < 0) return { text: `${Math.abs(days)}d ago`, tone: 'neutral' as const }
  if (days === 0) return { text: 'Today', tone: 'critical' as const }
  if (days <= 7) return { text: `${days}d left`, tone: 'critical' as const }
  if (days <= 21) return { text: `${days}d left`, tone: 'caution' as const }
  return { text: `${days}d left`, tone: 'neutral' as const }
}

export function formatMoney(value?: number | null) {
  if (value == null) return '—'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}
