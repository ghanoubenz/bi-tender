import { STAGE_LABELS } from '@/lib/format'

/**
 * Pipeline by stage — one series (tender count), so a single hue and no
 * legend; the title names it. Stages are an ordered sequence, so bars stay in
 * pipeline order and are never re-sorted by size. Values are direct-labelled,
 * which removes the need for an axis.
 *
 * Deliberately not a chart: win rate. With a handful of decided tenders a
 * donut would dramatise noise — it ships as a stat tile instead.
 */
export function PipelineChart({
  counts,
  values,
}: {
  counts: Record<string, number>
  values: Record<string, number>
}) {
  const stages = Object.keys(STAGE_LABELS).filter((s) => s !== 'abandoned')
  const max = Math.max(1, ...stages.map((s) => counts[s] ?? 0))
  const money = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n > 0 ? `$${Math.round(n / 1000)}K` : '—'

  return (
    <div className="px-4 py-3">
      <div className="space-y-2.5">
        {stages.map((stage) => {
          const count = counts[stage] ?? 0
          const pct = (count / max) * 100
          const terminal = stage === 'won' || stage === 'lost'
          return (
            <div key={stage} className="group grid grid-cols-[112px_1fr_auto] items-center gap-3">
              <span className="truncate text-[12.5px] text-[var(--color-ink-soft)]">
                {STAGE_LABELS[stage]}
              </span>
              <div className="relative h-[22px] overflow-hidden rounded-[5px] bg-[var(--color-canvas)]">
                {count > 0 && (
                  <div
                    className="transition-ui absolute inset-y-0 left-0 rounded-[5px]"
                    style={{
                      width: `${Math.max(pct, 6)}%`,
                      background: terminal
                        ? stage === 'won'
                          ? 'var(--color-positive)'
                          : 'var(--color-border-strong)'
                        : 'var(--color-accent)',
                      opacity: terminal ? 0.9 : 1,
                    }}
                  />
                )}
                <span
                  className={`tnum absolute inset-y-0 left-2 flex items-center text-[11.5px] font-semibold ${
                    count > 0 ? 'text-white' : 'text-[var(--color-ink-faint)]'
                  }`}
                >
                  {count}
                </span>
              </div>
              <span className="tnum w-[58px] text-right text-[12px] text-[var(--color-ink-faint)]">
                {money(values[stage] ?? 0)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
