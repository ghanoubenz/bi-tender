import { LogoutButton } from './LogoutButton'

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[14px] font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="truncate text-[11px] leading-tight text-[var(--color-ink-faint)]">{subtitle}</p>
        )}
      </div>
      <LogoutButton />
    </header>
  )
}
