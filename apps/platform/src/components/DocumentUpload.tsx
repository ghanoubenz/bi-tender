'use client'

import { useRef, useState } from 'react'
import { uploadTenderDocument } from '@/lib/actions'

export function DocumentUpload({ tenderId }: { tenderId: number }) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.eml"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setBusy(true)
          try {
            const fd = new FormData()
            fd.append('file', file)
            await uploadTenderDocument(tenderId, fd)
          } finally {
            setBusy(false)
            if (inputRef.current) inputRef.current.value = ''
          }
        }}
        className="text-[13px]"
      />
      {busy && <span className="text-[12px] text-[var(--color-ink-faint)]">Uploading…</span>}
      <span className="text-[12px] text-[var(--color-ink-faint)]">
        PDF, Word, Excel, ZIP — analysed automatically once the AI Engine is connected.
      </span>
    </div>
  )
}
