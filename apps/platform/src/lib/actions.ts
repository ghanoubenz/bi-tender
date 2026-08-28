'use server'

/**
 * Server actions — every write the product UI makes.
 *
 * All writes resolve the tenant server-side from the signed-in user; the
 * browser never chooses a tenant. Payload's Local API is used directly (no
 * HTTP hop), with tenant set explicitly on every create.
 */
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getClient, getCurrentUser, tenantIdOf } from './payload'

async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not signed in')
  const tenant = tenantIdOf(user)
  if (!tenant) throw new Error('No company on this account')
  return { user, tenant }
}

export async function createTender(formData: FormData) {
  const { user, tenant } = await requireUser()
  const payload = await getClient()

  const str = (k: string) => (formData.get(k) as string)?.trim() || undefined
  const num = (k: string) => {
    const v = str(k)
    return v ? Number(v) : undefined
  }

  const tender = await payload.create({
    collection: 'tenders',
    data: {
      tenant,
      title: str('title') ?? 'Untitled tender',
      reference: str('reference'),
      client: num('client'),
      country: str('country'),
      submissionDeadline: str('submissionDeadline'),
      estimatedValue: num('estimatedValue'),
      scope: str('scope'),
      stage: 'identified',
      owner: user.id,
    },
  })
  revalidatePath('/tenders')
  redirect(`/tenders/${tender.id}`)
}

export async function addRequirement(tenderId: number, formData: FormData) {
  const { tenant } = await requireUser()
  const payload = await getClient()
  const str = (k: string) => (formData.get(k) as string)?.trim() || undefined

  const page = str('page')
  await payload.create({
    collection: 'requirements',
    data: {
      tenant,
      tender: tenderId,
      text: str('text') ?? '',
      category: (str('category') ?? 'other') as never,
      mandatory: (str('mandatory') ?? 'unclear') as never,
      complianceStatus: (str('complianceStatus') ?? 'unknown') as never,
      evidence: str('quote')
        ? [
            {
              document: str('document') ? Number(str('document')) : undefined,
              page: page ? Number(page) : undefined,
              clause: str('clause'),
              quote: str('quote')!,
              method: 'human',
              confidence: 1,
              verified: true,
            },
          ]
        : [],
    },
  })
  revalidatePath(`/tenders/${tenderId}`)
}

export async function uploadTenderDocument(tenderId: number, formData: FormData) {
  const { tenant } = await requireUser()
  const payload = await getClient()
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return

  await payload.create({
    collection: 'tender-documents',
    data: {
      tenant,
      tender: tenderId,
      documentType: ((formData.get('documentType') as string) || 'other') as never,
    },
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      name: file.name,
      mimetype: file.type || 'application/octet-stream',
      size: file.size,
    },
  })
  revalidatePath(`/tenders/${tenderId}`)
}

export async function decideTender(
  tenderId: number,
  decision: 'bid' | 'no_bid' | 'hold',
  reason: string,
) {
  const { user, tenant } = await requireUser()
  const payload = await getClient()

  // Verify the tender belongs to this user's company before writing.
  const tender = await payload.findByID({ collection: 'tenders', id: tenderId, depth: 0 })
  const tenderTenant = typeof tender.tenant === 'object' ? tender.tenant?.id : tender.tenant
  if (tenderTenant !== tenant) throw new Error('Not found')

  await payload.update({
    collection: 'tenders',
    id: tenderId,
    data: {
      decision,
      decisionReason: reason,
      decidedBy: user.id,
      decidedAt: new Date().toISOString(),
      stage: decision === 'bid' ? 'preparing' : tender.stage,
    },
  })
  revalidatePath(`/tenders/${tenderId}`)
  revalidatePath('/')
}

export async function createTask(formData: FormData) {
  const { tenant } = await requireUser()
  const payload = await getClient()
  const str = (k: string) => (formData.get(k) as string)?.trim() || undefined

  await payload.create({
    collection: 'tasks',
    data: {
      tenant,
      title: str('title') ?? '',
      tender: str('tender') ? Number(str('tender')) : undefined,
      priority: (str('priority') ?? 'normal') as never,
      dueDate: str('dueDate'),
      status: 'todo',
    },
  })
  revalidatePath('/tasks')
}

export async function createCompany(formData: FormData) {
  const { tenant } = await requireUser()
  const payload = await getClient()
  const str = (k: string) => (formData.get(k) as string)?.trim() || undefined

  await payload.create({
    collection: 'companies',
    data: {
      tenant,
      name: str('name') ?? '',
      kind: (str('kind') ?? 'client') as never,
      country: str('country'),
      industry: str('industry'),
    },
  })
  revalidatePath('/companies')
}
