'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('demo@tenderiq.test')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    setBusy(false)
    if (!res.ok) {
      setError('Those credentials were not accepted.')
      return
    }
    router.push('/')
    router.refresh()
  }

  const field =
    'w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]'

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[var(--color-accent)] text-[14px] font-bold text-white">
            T
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight tracking-tight">TenderIQ</div>
            <div className="text-[12px] leading-tight text-[var(--color-ink-faint)]">
              Tender Intelligence
            </div>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-window)]"
        >
          <label className="mb-1 block text-[12px] font-medium">Email</label>
          <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} />
          <label className="mb-1 mt-3.5 block text-[12px] font-medium">Password</label>
          <input
            type="password"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="mt-3 text-[12px] text-[var(--color-critical)]">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-[7px] bg-[var(--color-accent)] py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-3 text-center text-[12px] text-[var(--color-ink-faint)]">
          Demo workspace — credentials are pre-filled.
        </p>
      </div>
    </main>
  )
}
