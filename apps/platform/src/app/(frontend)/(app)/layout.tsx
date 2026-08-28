import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { getCurrentUser, getClient, tenantIdOf } from '@/lib/payload'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const tenantId = tenantIdOf(user)
  let tenantName = 'Workspace'
  if (tenantId) {
    const payload = await getClient()
    const tenant = await payload.findByID({ collection: 'tenants', id: tenantId, depth: 0 })
    tenantName = tenant?.name ?? tenantName
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar tenantName={tenantName} userName={user.fullName ?? user.email} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
