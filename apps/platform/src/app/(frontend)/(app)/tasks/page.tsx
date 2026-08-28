import type { Where } from 'payload'
import { Topbar } from '@/components/Topbar'
import { Badge, Card, Cell, DataTable, EmptyState, PageHeading, Row, StatusDot, type Tone } from '@/components/ui'
import { NewTaskForm } from '@/components/NewTaskForm'
import { getClient, getCurrentUser, tenantIdOf } from '@/lib/payload'
import { formatDeadline } from '@/lib/format'

const STATUS: Record<string, { label: string; tone: Tone }> = {
  todo: { label: 'To do', tone: 'neutral' },
  in_progress: { label: 'In progress', tone: 'accent' },
  blocked: { label: 'Blocked', tone: 'critical' },
  done: { label: 'Done', tone: 'positive' },
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
      <Topbar title="Tasks" subtitle="Everything the bid team owes this week" />
      <div className="flex-1 overflow-y-auto p-5">
        <PageHeading title="Tasks" count={`${open.length} open · ${done.length} done`} />

        <Card className="mb-4">
          <NewTaskForm tenders={tenders.docs.map((t) => ({ id: t.id, title: t.title }))} />
        </Card>

        <Card>
          {tasks.docs.length === 0 ? (
            <EmptyState title="No tasks yet" body="Add the first one above — it will show on the dashboard too." />
          ) : (
            <DataTable
              columns={[
                { label: 'Task' },
                { label: 'Tender' },
                { label: 'Status' },
                { label: 'Priority' },
                { label: 'Due', align: 'right' },
              ]}
            >
              {[...open, ...done].map((t) => {
                const d = formatDeadline(t.dueDate)
                const tender = typeof t.tender === 'object' ? t.tender?.title : null
                const s = STATUS[t.status as string] ?? { label: t.status, tone: 'neutral' as Tone }
                return (
                  <Row key={t.id} muted={t.status === 'done'}>
                    <Cell strong>{t.title}</Cell>
                    <Cell>{tender ?? '—'}</Cell>
                    <Cell><StatusDot tone={s.tone}>{s.label}</StatusDot></Cell>
                    <Cell>
                      {t.priority === 'high'
                        ? <Badge tone="critical">High</Badge>
                        : <span className="text-[13px] capitalize">{t.priority}</span>}
                    </Cell>
                    <Cell align="right">
                      <Badge tone={t.status === 'done' ? 'neutral' : d.tone}>{d.text}</Badge>
                    </Cell>
                  </Row>
                )
              })}
            </DataTable>
          )}
        </Card>
      </div>
    </>
  )
}
