/**
 * Seed a realistic demo workspace.
 *
 * Everything here is data a person could have entered by hand — no AI involved.
 * That is the point: the platform is a working product before the engine
 * exists, and the engine later fills the same structures automatically.
 *
 * Run with:  npm run seed
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config.js'

const DEMO_PASSWORD = 'demo1234'

async function seed() {
  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'tenants', where: { slug: { equals: 'demo' } } })
  if (existing.docs.length > 0) {
    payload.logger.info('Demo tenant already exists — nothing to do.')
    process.exit(0)
  }

  const tenant = await payload.create({
    collection: 'tenants',
    data: { name: 'Demo Contracting LLC', slug: 'demo', accentColor: '#2f5fe0' },
  })
  const tenantRef = { tenants: [{ tenant: tenant.id }] }

  await payload.create({
    collection: 'users',
    data: {
      email: 'demo@tenderiq.test',
      password: DEMO_PASSWORD,
      fullName: 'Dana Reyes',
      role: 'bid_manager',
      ...tenantRef,
    },
  })
  await payload.create({
    collection: 'users',
    data: {
      email: 'viewer@tenderiq.test',
      password: DEMO_PASSWORD,
      fullName: 'Sam Okafor',
      role: 'viewer',
      ...tenantRef,
    },
  })

  const ministry = await payload.create({
    collection: 'companies',
    data: { name: 'Ministry of Water Resources', kind: 'client', country: 'Oman', tenant: tenant.id },
  })
  const petro = await payload.create({
    collection: 'companies',
    data: { name: 'Gulf Petro Services', kind: 'client', country: 'UAE', tenant: tenant.id },
  })
  await payload.create({
    collection: 'companies',
    data: { name: 'Delta Industrial', kind: 'competitor', country: 'Oman', tenant: tenant.id },
  })

  await payload.create({
    collection: 'contacts',
    data: {
      fullName: 'Khalid Al-Balushi',
      company: ministry.id,
      jobTitle: 'Head of Procurement',
      email: 'k.albalushi@mwr.example',
      isPrimary: true,
      tenant: tenant.id,
    },
  })
  await payload.create({
    collection: 'contacts',
    data: {
      fullName: 'Maria Santos',
      company: petro.id,
      jobTitle: 'Contracts Manager',
      email: 'm.santos@gulfpetro.example',
      tenant: tenant.id,
    },
  })

  // Company Intelligence — the other half of the future match engine.
  const capabilities = [
    { name: 'ISO 9001:2015', kind: 'certification', issuer: 'BSI', validUntil: '2027-06-30' },
    { name: 'ISO 45001:2018', kind: 'certification', issuer: 'BSI', validUntil: '2027-03-31' },
    { name: 'Water treatment plant construction', kind: 'capability', category: 'Civil' },
    { name: 'Pipeline inspection (ILI)', kind: 'capability', category: 'Inspection' },
    { name: 'Sohar Desalination Phase II', kind: 'project_reference', year: 2024, value: 14500000 },
    { name: 'Duqm Water Network Upgrade', kind: 'project_reference', year: 2023, value: 8200000 },
  ]
  for (const c of capabilities) {
    await payload.create({ collection: 'capabilities', data: { ...c, tenant: tenant.id } as never })
  }

  const template = await payload.create({
    collection: 'checklist-templates',
    data: {
      name: 'Standard Infrastructure Tender',
      industry: 'Water & Infrastructure',
      tenderType: 'Construction ITT',
      description: 'Baseline checklist for public infrastructure invitations to tender.',
      tenant: tenant.id,
      sections: [
        {
          title: 'Qualification',
          items: [
            { label: 'Confirm similar project experience', category: 'qualification', required: true },
            { label: 'Verify annual turnover threshold', category: 'qualification', required: true },
          ],
        },
        {
          title: 'Certifications',
          items: [
            { label: 'ISO 9001 valid at submission date', category: 'certification', required: true },
            { label: 'ISO 45001 / HSE certification', category: 'certification', required: true },
          ],
        },
        {
          title: 'Submission',
          items: [
            { label: 'Bid bond arranged', category: 'submission', required: true },
            { label: 'Technical and commercial envelopes separated', category: 'submission', required: true },
          ],
        },
      ],
    },
  })

  const deadline = (days: number) =>
    new Date(Date.now() + days * 86400000).toISOString()

  const tenders = [
    { title: 'Water Treatment Plant — Sohar', reference: 'ITT-2026-0042', client: ministry.id, country: 'Oman', stage: 'preparing', submissionDeadline: deadline(12), estimatedValue: 12500000 },
    { title: 'Pipeline Integrity Survey — Fujairah', reference: 'RFQ-2026-0117', client: petro.id, country: 'UAE', stage: 'qualifying', submissionDeadline: deadline(5), estimatedValue: 3400000 },
    { title: 'Duqm Pump Station Refurbishment', reference: 'ITT-2026-0088', client: ministry.id, country: 'Oman', stage: 'identified', submissionDeadline: deadline(28), estimatedValue: 6100000 },
    { title: 'Coastal Reservoir Expansion', reference: 'ITT-2025-0431', client: ministry.id, country: 'Oman', stage: 'submitted', submissionDeadline: deadline(-9), estimatedValue: 9800000 },
    { title: 'Refinery Utilities Upgrade', reference: 'RFP-2025-0902', client: petro.id, country: 'UAE', stage: 'won', submissionDeadline: deadline(-64), estimatedValue: 15200000 },
    { title: 'Industrial Wastewater Package', reference: 'ITT-2025-0377', client: petro.id, country: 'UAE', stage: 'lost', submissionDeadline: deadline(-88), estimatedValue: 4300000 },
  ]

  const created = []
  for (const t of tenders) {
    created.push(await payload.create({ collection: 'tenders', data: { ...t, tenant: tenant.id } as never }))
  }
  const lead = created[0]

  // Requirements entered by hand, each citing its clause — exactly the shape
  // the AI Engine will later produce automatically.
  const requirements = [
    {
      text: 'The Bidder shall have completed 3 similar water treatment projects in the last 5 years.',
      category: 'qualification',
      mandatory: 'yes',
      clause: '7.3.2',
      page: 42,
      complianceStatus: 'compliant',
    },
    {
      text: 'The Contractor must hold a valid ISO 9001 certification at the time of submission.',
      category: 'certification',
      mandatory: 'yes',
      clause: '7.4.1',
      page: 43,
      complianceStatus: 'compliant',
    },
    {
      text: 'The Contractor must hold ISO 14001 environmental certification.',
      category: 'certification',
      mandatory: 'yes',
      clause: '7.4.2',
      page: 43,
      complianceStatus: 'gap',
    },
    {
      text: 'Mobilization shall be completed within 21 calendar days of contract award.',
      category: 'schedule',
      mandatory: 'yes',
      clause: '9.1',
      page: 55,
      complianceStatus: 'partial',
    },
    {
      text: 'Bids shall remain valid for a period of 120 days from the submission date.',
      category: 'commercial',
      mandatory: 'yes',
      clause: '4.2',
      page: 18,
      complianceStatus: 'compliant',
    },
    {
      text: 'A tender security of OMR 50,000 must accompany the bid.',
      category: 'commercial',
      mandatory: 'yes',
      clause: '4.5',
      page: 19,
      complianceStatus: 'unknown',
    },
  ]
  for (const r of requirements) {
    const { clause, page, ...rest } = r
    await payload.create({
      collection: 'requirements',
      data: {
        ...rest,
        tender: lead.id,
        tenant: tenant.id,
        evidence: [
          {
            page,
            clause,
            quote: r.text,
            method: 'human',
            confidence: 1,
            verified: true,
          },
        ],
      } as never,
    })
  }

  await payload.create({
    collection: 'tender-checklists',
    data: {
      name: 'Sohar WTP — bid checklist',
      tender: lead.id,
      sourceTemplate: template.id,
      tenant: tenant.id,
      sections: [
        {
          title: 'Qualification',
          items: [
            { label: 'Confirm similar project experience', status: 'done', required: true },
            { label: 'Verify annual turnover threshold', status: 'in_progress', required: true },
          ],
        },
        {
          title: 'Certifications',
          items: [
            { label: 'ISO 9001 valid at submission date', status: 'done', required: true },
            { label: 'ISO 45001 / HSE certification', status: 'todo', required: true },
          ],
        },
      ],
    },
  })

  const tasks = [
    { title: 'Obtain ISO 14001 certification quote', status: 'in_progress', priority: 'high', dueDate: deadline(3) },
    { title: 'Confirm bid bond with bank', status: 'todo', priority: 'high', dueDate: deadline(6) },
    { title: 'Draft technical method statement', status: 'todo', priority: 'normal', dueDate: deadline(9) },
  ]
  for (const t of tasks) {
    await payload.create({
      collection: 'tasks',
      data: { ...t, tender: lead.id, tenant: tenant.id } as never,
    })
  }

  payload.logger.info('---------------------------------------------')
  payload.logger.info('Seed complete.')
  payload.logger.info('  Login: demo@tenderiq.test / ' + DEMO_PASSWORD)
  payload.logger.info('  Viewer: viewer@tenderiq.test / ' + DEMO_PASSWORD)
  payload.logger.info('---------------------------------------------')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
