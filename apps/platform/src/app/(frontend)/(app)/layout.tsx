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

  /**
   * The application sits in a rounded window floating on a tinted page. It
   * frames the product as a single object rather than a browser page, and
   * gives the chrome (sidebar, header) a surface to sit against.
   */
  return (
    <div className="h-screen overflow-hidden p-3">
      <div className="flex h-full overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-window)]">
        <Sidebar tenantName={tenantName} userName={user.fullName ?? user.email} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  )
}
