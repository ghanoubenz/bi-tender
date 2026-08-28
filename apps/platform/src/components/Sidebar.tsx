'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * The full product vision is visible from day one. Sections that are not built
 * yet are shown but muted — never hidden, never a broken link. Investors and
 * users can both see where the product is going.
 */
type NavItem = { href: string; label: string; soon?: boolean }
type NavGroup = { section: string | null; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    section: null,
    items: [{ href: '/', label: 'Dashboard' }],
  },
  {
    section: 'Tenders',
    items: [
      { href: '/tenders', label: 'All tenders' },
      { href: '/tenders?mine=1', label: 'My tenders' },
      { href: '/feed', label: 'Tender feed', soon: true },
    ],
  },
  {
    section: 'Company',
    items: [
      { href: '/companies', label: 'Companies' },
      { href: '/contacts', label: 'Contacts' },
      { href: '/capabilities', label: 'Capabilities' },
    ],
  },
  {
    section: 'AI',
    items: [
      { href: '/assistant', label: 'Tender assistant', soon: true },
      { href: '/ai-jobs', label: 'Analysis jobs', soon: true },
    ],
  },
  {
    section: 'Manage',
    items: [
      { href: '/tasks', label: 'Tasks' },
      { href: '/templates', label: 'Checklist templates' },
      { href: '/analytics', label: 'Analytics', soon: true },
    ],
  },
]

export function Sidebar({ tenantName }: { tenantName: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-[228px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-[52px] items-center gap-2 border-b border-[var(--color-border)] px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-[var(--color-accent)] text-[12px] font-bold text-white">
          T
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight">TenderIQ</div>
          <div className="truncate text-[11px] leading-tight text-[var(--color-ink-faint)]">
            {tenantName}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((group, i) => (
          <div key={i} className={i > 0 ? 'mt-5' : ''}>
            {group.section && (
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-faint)]">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href.split('?')[0])
              if (item.soon) {
                return (
                  <div
                    key={item.href}
                    className="flex cursor-default items-center justify-between rounded-[6px] px-2 py-[6px] text-[13px] text-[var(--color-ink-faint)]"
                    title="Planned — not built yet"
                  >
                    {item.label}
                    <span className="text-[10px] uppercase tracking-wide">soon</span>
                  </div>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-[6px] px-2 py-[6px] text-[13px] transition-colors ${
                    active
                      ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
