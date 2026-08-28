'use client'

import { useRef, useState } from 'react'
import { createTask } from '@/lib/actions'

const field =
  'rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]'

export function NewTaskForm({ tenders }: { tenders: { id: number; title: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setBusy(true)
        try {
          await createTask(fd)
          formRef.current?.reset()
        } finally {
          setBusy(false)
        }
      }}
      className="flex flex-wrap items-center gap-2 px-4 py-3"
    >
      <input name="title" required placeholder="Add a task…" className={`${field} min-w-[240px] flex-1`} />
      <select name="tender" className={field} defaultValue="">
        <option value="">No tender</option>
        {tenders.map((t) => (
          <option key={t.id} value={t.id}>{t.title}</option>
        ))}
      </select>
      <select name="priority" className={field} defaultValue="normal">
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
      <input name="dueDate" type="date" className={field} />
      <button
        type="submit"
        disabled={busy}
        className="rounded-[7px] bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-60"
      >
        {busy ? 'Adding…' : 'Add task'}
      </button>
    </form>
  )
}
