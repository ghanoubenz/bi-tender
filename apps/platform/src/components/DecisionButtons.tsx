'use client'

import { useState } from 'react'
import { decideTender } from '@/lib/actions'

/** The human decision — always with a reason, always recorded. */
export function DecisionButtons({ tenderId }: { tenderId: number }) {
  const [busy, setBusy] = useState(false)

  async function decide(decision: 'bid' | 'no_bid' | 'hold', promptText: string) {
    const reason = window.prompt(promptText)
    if (!reason?.trim()) return
    setBusy(true)
    try {
      await decideTender(tenderId, decision, reason.trim())
    } finally {
      setBusy(false)
    }
  }

  const base = 'rounded-[7px] px-4 py-2 text-[13px] font-medium disabled:opacity-60'
  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={busy} onClick={() => decide('bid', 'Why are we bidding?')} className={`${base} bg-[var(--color-positive)] text-white`}>
        Bid
      </button>
      <button disabled={busy} onClick={() => decide('hold', 'Why are we holding?')} className={`${base} border border-[var(--color-border)] text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]`}>
        Hold
      </button>
      <button disabled={busy} onClick={() => decide('no_bid', 'Why are we not bidding?')} className={`${base} border border-[var(--color-border)] text-[var(--color-critical)] hover:bg-[var(--color-critical-soft)]`}>
        No-Bid
      </button>
    </div>
  )
}
