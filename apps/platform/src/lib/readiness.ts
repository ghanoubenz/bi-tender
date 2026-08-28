/**
 * Bid readiness — a plain percentage a non-expert can read.
 *
 * Derived only from requirements a person has actually assessed. It is never
 * invented: if nothing has been checked, there is no score, and we say so.
 * When the AI Engine lands it assesses requirements automatically and this
 * same number simply becomes far more complete.
 */
export type Readiness = {
  score: number | null
  compliant: number
  partial: number
  gaps: number
  unchecked: number
  total: number
  label: string
  tone: 'positive' | 'caution' | 'critical' | 'neutral'
}

type RequirementLike = { complianceStatus?: string | null }

export function readinessOf(requirements: RequirementLike[]): Readiness {
  const count = (status: string) =>
    requirements.filter((r) => r.complianceStatus === status).length

  const compliant = count('compliant')
  const partial = count('partial')
  const gaps = count('gap')
  const unchecked = count('unknown')
  const total = requirements.length
  const assessed = compliant + partial + gaps

  if (assessed === 0) {
    return {
      score: null,
      compliant,
      partial,
      gaps,
      unchecked,
      total,
      label: 'Not checked yet',
      tone: 'neutral',
    }
  }

  // Partial counts as half — it is real but incomplete coverage.
  const score = Math.round(((compliant + partial * 0.5) / assessed) * 100)
  const tone = gaps > 0 ? 'critical' : score >= 85 ? 'positive' : 'caution'
  const label = gaps > 0 ? `${gaps} thing${gaps > 1 ? 's' : ''} missing` : score >= 85 ? 'Looking good' : 'Some work needed'

  return { score, compliant, partial, gaps, unchecked, total, label, tone }
}
