'use client'

import { useRef, useState } from 'react'
import { addRequirement } from '@/lib/actions'
import { CATEGORY_LABELS } from '@/lib/format'

const field =
  'w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]'
const label = 'mb-1 block text-[12px] font-medium'

/**
 * Manual requirement capture — the Phase-1 way of doing what the AI Engine
 * will later do automatically. The citation fields are not optional extras:
 * they ARE the product discipline. Same shape either way.
 */
export function AddRequirementForm({
  tenderId,
  documents,
}: {
  tenderId: number
  documents: { id: number; filename: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-[7px] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
      >
        Add requirement
      </button>
    )
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setBusy(true)
        try {
          await addRequirement(tenderId, fd)
          formRef.current?.reset()
          setOpen(false)
        } finally {
          setBusy(false)
        }
      }}
      className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <div className="mb-3 text-[13px] font-semibold">New requirement</div>
      <div className="space-y-3">
        <div>
          <label className={label}>What does the tender require? *</label>
          <textarea name="text" required rows={2} placeholder="e.g. The Contractor shall hold a valid ADNOC ICV certificate." className={field} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Category</label>
            <select name="category" className={field} defaultValue="other">
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Mandatory?</label>
            <select name="mandatory" className={field} defaultValue="yes">
              <option value="yes">Mandatory (shall / must)</option>
              <option value="no">Optional (should / may)</option>
              <option value="unclear">Unclear</option>
            </select>
          </div>
          <div>
            <label className={label}>Do we comply?</label>
            <select name="complianceStatus" className={field} defaultValue="unknown">
              <option value="unknown">Not assessed yet</option>
              <option value="compliant">Yes, compliant</option>
              <option value="partial">Partially</option>
              <option value="gap">No — gap</option>
            </select>
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-raised)] p-3">
          <div className="mb-2 text-[12px] font-semibold">Where does this come from?</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={label}>Document</label>
              <select name="document" className={field} defaultValue="">
                <option value="">—</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.filename}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Page</label>
              <input name="page" type="number" min="1" className={field} />
            </div>
            <div>
              <label className={label}>Clause</label>
              <input name="clause" placeholder="7.3.2" className={field} />
            </div>
          </div>
          <div className="mt-3">
            <label className={label}>Exact words from the document</label>
            <textarea name="quote" rows={2} placeholder="Copy the sentence from the tender here — every requirement keeps its source." className={field} />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="rounded-[7px] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60">
            {busy ? 'Saving…' : 'Save requirement'}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-[7px] border border-[var(--color-border)] px-4 py-2 text-[13px] text-[var(--color-ink-soft)] hover:bg-[var(--color-canvas)]">
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
