import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, EmptyState } from '@/components/ui'
import { NewTaskForm } from '@/components/NewTaskForm'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { formatDeadline } from '@/lib/format'

const STATUS: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}

export default async function TasksPage() {
  const user = await getCurrentUser()
  const tenant = tenantIdOf(user)
  const payload = await getClient()
  const scope: Where = tenant ? { tenant: { equals: tenant } } : {}

  const [tasks, tenders] = await Promise.all([
    payload.find({ collection: 'tasks', where: scope, sort: 'dueDate', limit: 200, depth: 1 }),
    payload.find({ collection: 'tenders', where: scope, sort: 'title', limit: 200, depth: 0 }),
  ])

  const open = tasks.docs.filter((t) => t.status !== 'done')
  const done = tasks.docs.filter((t) => t.status === 'done')

  return (
    <>
      <Topbar title="Tasks" subtitle={`${open.length} open · ${done.length} done`} />
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="mb-4">
          <NewTaskForm tenders={tenders.docs.map((t) => ({ id: t.id, title: t.title }))} />
        </Card>
        <Card>
          {tasks.docs.length === 0 ? (
            <EmptyState title="No tasks yet" body="Work for the team lives here — add the first one above." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-left">
                  {['Task', 'Tender', 'Status', 'Priority', 'Due'].map((h, i) => (
                    <th key={h} className={`px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-ink-faint)] ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...open, ...done].map((t) => {
                  const d = formatDeadline(t.dueDate)
                  const tender = typeof t.tender === 'object' ? t.tender?.title : null
                  return (
                    <tr key={t.id} className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-raised)] ${t.status === 'done' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5 text-[13px] font-medium">{t.title}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[var(--color-ink-soft)]">{tender ?? '—'}</td>
                      <td className="px-4 py-2.5"><Badge tone={t.status === 'blocked' ? 'critical' : t.status === 'done' ? 'positive' : 'neutral'}>{STATUS[t.status as string] ?? t.status}</Badge></td>
                      <td className="px-4 py-2.5"><Badge tone={t.priority === 'high' ? 'critical' : 'neutral'}>{t.priority}</Badge></td>
                      <td className="px-4 py-2.5 text-right"><Badge tone={t.status === 'done' ? 'neutral' : d.tone}>{d.text}</Badge></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  )
}
