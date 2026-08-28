import { IconSearch } from './icons'
import { LogoutButton } from './LogoutButton'

export function Topbar({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{title}</h1>
        {subtitle && (
          <p className="truncate text-[11.5px] leading-tight text-[var(--color-ink-faint)]">{subtitle}</p>
        )}
      </div>
      <div className="hidden items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-canvas)] px-2.5 py-1.5 text-[var(--color-ink-faint)] lg:flex">
        <IconSearch size={14} />
        <span className="text-[12.5px]">Search…</span>
        <kbd className="ml-6 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10.5px] font-medium">⌘K</kbd>
      </div>
      {action}
      <LogoutButton />
    </header>
  )
}
