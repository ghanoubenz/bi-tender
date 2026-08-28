'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  return (
    <button
      onClick={async () => {
        await fetch('/api/users/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
      }}
      className="rounded-[6px] border border-[var(--color-border)] px-2.5 py-1 text-[12px] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-canvas)]"
    >
      Sign out
    </button>
  )
}
