import Link from 'next/link'
import type { ReactNode } from 'react'

/** Primitives. Everything visual in the app is assembled from these. */

const TONES = {
  neutral: 'bg-[var(--color-canvas)] text-[var(--color-ink-soft)] border-[var(--color-border)]',
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-transparent',
  positive: 'bg-[var(--color-positive-soft)] text-[var(--color-positive)] border-transparent',
  caution: 'bg-[var(--color-caution-soft)] text-[var(--color-caution)] border-transparent',
  critical: 'bg-[var(--color-critical-soft)] text-[var(--color-critical)] border-transparent',
} as const

export type Tone = keyof typeof TONES

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
      <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
      {action}
    </header>
  )
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  href,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: Tone
  href?: string
}) {
  const body = (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 transition-colors hover:border-[var(--color-border-strong)]">
      <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="tnum text-[26px] font-semibold leading-none tracking-tight">{value}</span>
        {hint && <Badge tone={tone}>{hint}</Badge>}
      </div>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-[13px] font-medium">{title}</p>
      <p className="mt-1 text-[13px] text-[var(--color-ink-faint)]">{body}</p>
    </div>
  )
}

/** A tab that is designed but not built yet — honest, not a broken link. */
export function ComingSoon({ feature, phase }: { feature: string; phase: string }) {
  return (
    <Card className="px-6 py-12 text-center">
      <p className="text-[13px] font-medium">{feature}</p>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-[var(--color-ink-faint)]">
        Planned for {phase}. The workspace is laid out for it now so nothing has to be rebuilt when
        it arrives.
      </p>
    </Card>
  )
}
