'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'
import {
  IconBadge, IconBuilding, IconChart, IconCheckList, IconDoc, IconGrid,
  IconInbox, IconSparkle, IconTemplate, IconUsers,
} from './icons'
import { BUILD } from '@/lib/version'

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
type NavItem = { href: string; label: string; icon: Icon; soon?: boolean }
type NavGroup = { section: string | null; items: NavItem[] }

const NAV: NavGroup[] = [
  { section: null, items: [{ href: '/', label: 'Dashboard', icon: IconGrid }] },
  {
    section: 'Tenders',
    items: [
      { href: '/tenders', label: 'All tenders', icon: IconDoc },
      { href: '/feed', label: 'Tender feed', icon: IconInbox, soon: true },
    ],
  },
  {
    section: 'Company',
    items: [
      { href: '/companies', label: 'Companies', icon: IconBuilding },
      { href: '/contacts', label: 'Contacts', icon: IconUsers },
      { href: '/capabilities', label: 'Capabilities', icon: IconBadge },
    ],
  },
  {
    section: 'AI',
    items: [
      { href: '/assistant', label: 'Tender assistant', icon: IconSparkle, soon: true },
      { href: '/ai-jobs', label: 'Analysis jobs', icon: IconChart, soon: true },
    ],
  },
  {
    section: 'Manage',
    items: [
      { href: '/tasks', label: 'Tasks', icon: IconCheckList },
      { href: '/templates', label: 'Templates', icon: IconTemplate },
    ],
  },
]

export function Sidebar({ tenantName, userName }: { tenantName: string; userName: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-chrome)]">
      <div className="flex h-[60px] items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[var(--color-accent)] text-[13px] font-bold text-white">
          T
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13.5px] font-semibold leading-tight tracking-[-0.01em]">TenderIQ</div>
          <div className="truncate text-[11.5px] leading-tight text-[var(--color-ink-faint)]">{tenantName}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
        {NAV.map((group, i) => (
          <div key={i} className={i > 0 ? 'mt-5' : ''}>
            {group.section && (
              <div className="px-2 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-faint)]">
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              if (item.soon) {
                return (
                  <div
                    key={item.href}
                    title="Planned — not built yet"
                    className="flex cursor-default items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-[13px] text-[var(--color-ink-faint)]"
                  >
                    <Icon size={16} className="shrink-0 opacity-60" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[9.5px] font-semibold uppercase tracking-[0.06em]">soon</span>
                  </div>
                )
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`transition-ui flex items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-[13px] ${
                    active
                      ? 'bg-[var(--color-surface)] font-medium text-[var(--color-accent)] shadow-[var(--shadow-card)]'
                      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  <Icon size={16} className="shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-[var(--color-border)] px-4 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[11.5px] font-semibold text-[var(--color-accent-ink)]">
          {initials(userName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium leading-tight">{userName}</div>
          <div className="truncate text-[10.5px] leading-tight text-[var(--color-ink-faint)]">{BUILD}</div>
        </div>
      </div>
    </aside>
  )
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('')
}
