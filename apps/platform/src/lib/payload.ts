import { headers as nextHeaders } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'

/** Payload instance for server components — direct database access, no HTTP hop. */
export const getClient = async () => getPayload({ config })

/** The signed-in user, or null. Reads Payload's auth cookie. */
export async function getCurrentUser() {
  const payload = await getClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  return user
}

/** The tenant the signed-in user belongs to. Every query is scoped by this. */
export function tenantIdOf(user: { tenants?: unknown } | null): number | null {
  const tenants = (user?.tenants ?? []) as { tenant: number | { id: number } }[]
  const first = tenants[0]?.tenant
  if (!first) return null
  return typeof first === 'object' ? first.id : first
}
