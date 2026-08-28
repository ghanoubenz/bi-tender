import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Card } from '@/components/ui'
import { createTender } from '@/lib/actions'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'

const field =
  'w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[13px] outline-none focus:border-[var(--color-accent)]'
const label = 'mb-1 block text-[12px] font-medium'

export default async function NewTenderPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()
  const companies = await payload.find({
    collection: 'companies',
    where: (tenant ? { tenant: { equals: tenant } } : {}) as Where,
    sort: 'name',
    limit: 200,
    depth: 0,
  })

  return (
    <>
      <Topbar title="New tender" subtitle="Later, tenders will also arrive here automatically by email" />
      <div className="flex-1 overflow-y-auto p-5">
        <Card className="max-w-[660px] p-5">
          <form action={createTender} className="space-y-4">
            <div>
              <label className={label}>Tender title *</label>
              <input name="title" required placeholder="e.g. Pipeline ILI Campaign 2027 — ADNOC Onshore" className={field} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label}>Reference</label>
                <input name="reference" placeholder="ITT-2026-…" className={field} />
              </div>
              <div>
                <label className={label}>Client</label>
                <select name="client" className={field} defaultValue="">
                  <option value="">Select later</option>
                  {companies.docs.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label}>Country</label>
                <input name="country" placeholder="UAE" className={field} />
              </div>
              <div>
                <label className={label}>Submission deadline</label>
                <input name="submissionDeadline" type="date" className={field} />
              </div>
              <div>
                <label className={label}>Estimated value (USD)</label>
                <input name="estimatedValue" type="number" min="0" className={field} />
              </div>
            </div>
            <div>
              <label className={label}>Scope</label>
              <textarea name="scope" rows={3} placeholder="What is this tender for?" className={field} />
            </div>
            <button
              type="submit"
              className="rounded-[7px] bg-[var(--color-accent)] px-5 py-2 text-[13px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              Create tender
            </button>
          </form>
        </Card>
      </div>
    </>
  )
}
