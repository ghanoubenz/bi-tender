/**
 * Seed a realistic OIL & GAS demo workspace (GCC market — the product's
 * first industry, per QUESTIONS.md Q1/Q3).
 *
 * Everything here is data a person could have entered by hand — no AI
 * involved. The AI Engine later fills the same structures automatically.
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
    data: { name: 'Falcon Energy Services LLC', slug: 'demo', accentColor: '#2f5fe0' },
  })
  const tenantRef = { tenants: [{ tenant: tenant.id }] }

  await payload.create({
    collection: 'users',
    data: { email: 'demo@tenderiq.test', password: DEMO_PASSWORD, fullName: 'Dana Reyes', role: 'bid_manager', ...tenantRef },
  })
  await payload.create({
    collection: 'users',
    data: { email: 'viewer@tenderiq.test', password: DEMO_PASSWORD, fullName: 'Sam Okafor', role: 'viewer', ...tenantRef },
  })

  // --- Companies: GCC oil & gas operators + one competitor -----------------
  const mk = (data: Record<string, unknown>) =>
    payload.create({ collection: 'companies', data: { ...data, tenant: tenant.id } as never })

  const adnoc = await mk({ name: 'ADNOC Onshore', kind: 'client', country: 'UAE', industry: 'Oil & Gas — Operator' })
  const pdo = await mk({ name: 'Petroleum Development Oman', kind: 'client', country: 'Oman', industry: 'Oil & Gas — Operator' })
  const koc = await mk({ name: 'Kuwait Oil Company', kind: 'prospect', country: 'Kuwait', industry: 'Oil & Gas — Operator' })
  const qe = await mk({ name: 'QatarEnergy', kind: 'prospect', country: 'Qatar', industry: 'Oil & Gas — Operator' })
  await mk({ name: 'Gulf Integrity Solutions', kind: 'competitor', country: 'UAE', industry: 'Pipeline inspection' })

  await payload.create({
    collection: 'contacts',
    data: { fullName: 'Khalid Al Mazrouei', company: adnoc.id, jobTitle: 'Senior Procurement Lead', email: 'k.almazrouei@adnoc.example', phone: '+971 2 555 0142', isPrimary: true, tenant: tenant.id },
  })
  await payload.create({
    collection: 'contacts',
    data: { fullName: 'Fatma Al Habsi', company: pdo.id, jobTitle: 'Contracts Engineer', email: 'f.alhabsi@pdo.example', phone: '+968 24 555 388', tenant: tenant.id },
  })
  await payload.create({
    collection: 'contacts',
    data: { fullName: 'Yousef Al Sabah', company: koc.id, jobTitle: 'C&P Team Leader', email: 'y.alsabah@koc.example', tenant: tenant.id },
  })

  // --- Company Intelligence: what Falcon Energy actually has ----------------
  const caps: Record<string, unknown>[] = [
    { name: 'ISO 9001:2015 Quality Management', kind: 'certification', issuer: 'DNV', validUntil: '2027-09-30', certificateNumber: 'DNV-Q-88412' },
    { name: 'ISO 45001:2018 Occupational H&S', kind: 'certification', issuer: 'DNV', validUntil: '2027-04-30' },
    { name: 'API Q1 (Monogram) — Spec Q1 9th Ed.', kind: 'certification', issuer: 'API', validUntil: '2026-11-30' },
    { name: 'In-Line Inspection (ILI) — MFL & UT', kind: 'capability', category: 'Pipeline integrity' },
    { name: 'Pipeline pigging & cleaning campaigns', kind: 'capability', category: 'Pipeline integrity' },
    { name: 'Corrosion mapping & fitness-for-service', kind: 'capability', category: 'Asset integrity' },
    { name: 'MFL tool fleet 6"–48"', kind: 'equipment', category: 'ILI tools', description: 'High-resolution magnetic flux leakage tools, 6 to 48 inch' },
    { name: 'Buraimi–Fahud 32" crude line ILI', kind: 'project_reference', year: 2025, value: 4200000, country: 'Oman' },
    { name: 'Habshan gathering network integrity survey', kind: 'project_reference', year: 2024, value: 7800000, country: 'UAE' },
  ]
  for (const c of caps) {
    await payload.create({ collection: 'capabilities', data: { ...c, tenant: tenant.id } as never })
  }

  // --- Checklist template: the industry customization story -----------------
  const template = await payload.create({
    collection: 'checklist-templates',
    data: {
      name: 'Oil & Gas — Pipeline Integrity ITT',
      industry: 'Oil & Gas',
      tenderType: 'ILI / Integrity services',
      description: 'Baseline checklist for GCC operator pipeline-integrity invitations to tender.',
      tenant: tenant.id,
      sections: [
        { title: 'Qualification', items: [
          { label: 'Similar ILI projects in last 5 years (references ready)', category: 'qualification', required: true },
          { label: 'Operator pre-qualification / vendor registration current', category: 'qualification', required: true },
        ]},
        { title: 'Certifications & HSE', items: [
          { label: 'ISO 9001 valid at submission date', category: 'certification', required: true },
          { label: 'ISO 45001 / HSE management system evidence', category: 'certification', required: true },
          { label: 'ICV / local content certificate where required', category: 'certification', required: true },
        ]},
        { title: 'Technical', items: [
          { label: 'Tool fleet matches line sizes in scope', category: 'technical', required: true },
          { label: 'Dig verification & reporting procedure attached', category: 'technical', required: true },
        ]},
        { title: 'Submission', items: [
          { label: 'Bid bond arranged', category: 'submission', required: true },
          { label: 'Technical & commercial envelopes separated per ITT', category: 'submission', required: true },
        ]},
      ],
    },
  })

  const deadline = (days: number) => new Date(Date.now() + days * 86400000).toISOString()

  // --- Tenders across the pipeline ------------------------------------------
  const tenders: Record<string, unknown>[] = [
    { title: 'ILI Campaign 2027 — Onshore Crude Network', reference: 'ADNOC-ITT-70311', client: adnoc.id, country: 'UAE', stage: 'preparing', submissionDeadline: deadline(12), estimatedValue: 9600000,
      scope: 'In-line inspection of 14 crude pipelines (16"–36"), MFL + deformation, incl. dig verification support.' },
    { title: 'Gas Network Integrity Assessment — North Cluster', reference: 'PDO-RFP-2026-118', client: pdo.id, country: 'Oman', stage: 'qualifying', submissionDeadline: deadline(5), estimatedValue: 4300000,
      scope: 'Integrity assessment and corrosion mapping of gas gathering network, north cluster.' },
    { title: 'Export Line Pigging & Baseline ILI', reference: 'KOC-ITT-44902', client: koc.id, country: 'Kuwait', stage: 'identified', submissionDeadline: deadline(26), estimatedValue: 6100000,
      scope: 'Cleaning pigging programme and baseline ILI for 42" export line.' },
    { title: 'Offshore Flowline Inspection Framework', reference: 'QE-RFQ-2026-771', client: qe.id, country: 'Qatar', stage: 'submitted', submissionDeadline: deadline(-8), estimatedValue: 12400000 },
    { title: 'Condensate Line ILI & FFS Study', reference: 'ADNOC-ITT-69054', client: adnoc.id, country: 'UAE', stage: 'won', submissionDeadline: deadline(-60), estimatedValue: 5200000 },
    { title: 'Water Injection Network Survey', reference: 'PDO-RFP-2025-402', client: pdo.id, country: 'Oman', stage: 'lost', submissionDeadline: deadline(-95), estimatedValue: 2900000 },
  ]
  const created = []
  for (const t of tenders) {
    created.push(await payload.create({ collection: 'tenders', data: { ...t, tenant: tenant.id } as never }))
  }
  const lead = created[0] // the ADNOC ILI campaign is the demo tender

  // --- Requirements on the lead tender, hand-entered with citations ---------
  const reqs = [
    { text: 'The Contractor shall have completed a minimum of three (3) comparable in-line inspection campaigns for onshore crude pipelines within the last five (5) years.', category: 'qualification', mandatory: 'yes', clause: '5.2.1', page: 34, complianceStatus: 'compliant' },
    { text: 'The Contractor shall hold a valid ISO 9001:2015 certificate at the time of bid submission.', category: 'certification', mandatory: 'yes', clause: '5.3.1', page: 35, complianceStatus: 'compliant' },
    { text: 'The Contractor shall provide a valid In-Country Value (ICV) certificate issued in accordance with the ADNOC ICV programme.', category: 'certification', mandatory: 'yes', clause: '5.3.4', page: 36, complianceStatus: 'gap' },
    { text: 'ILI tools shall be capable of inspecting pipeline diameters from 16" to 36" with high-resolution MFL and geometry measurement in a single run where practicable.', category: 'technical', mandatory: 'yes', clause: '7.1.2', page: 52, complianceStatus: 'compliant' },
    { text: 'Mobilization to first pipeline shall be completed within thirty (30) calendar days of contract award.', category: 'schedule', mandatory: 'yes', clause: '9.4', page: 61, complianceStatus: 'partial' },
    { text: 'A bid bond of AED 500,000 shall accompany the technical submission.', category: 'commercial', mandatory: 'yes', clause: '3.6', page: 14, complianceStatus: 'unknown' },
    { text: 'Preliminary inspection reports should be issued within fourteen (14) days of each tool run.', category: 'documentation', mandatory: 'no', clause: '8.2.3', page: 57, complianceStatus: 'compliant' },
  ]
  for (const r of reqs) {
    const { clause, page, ...rest } = r
    await payload.create({
      collection: 'requirements',
      data: {
        ...rest,
        tender: lead.id,
        tenant: tenant.id,
        evidence: [{ page, clause, quote: r.text, method: 'human', confidence: 1, verified: true }],
      } as never,
    })
  }

  await payload.create({
    collection: 'tender-checklists',
    data: {
      name: 'ADNOC ILI Campaign — bid checklist',
      tender: lead.id,
      sourceTemplate: template.id,
      tenant: tenant.id,
      sections: [
        { title: 'Qualification', items: [
          { label: 'Similar ILI projects in last 5 years (references ready)', status: 'done', required: true },
          { label: 'ADNOC vendor registration current', status: 'done', required: true },
        ]},
        { title: 'Certifications & HSE', items: [
          { label: 'ISO 9001 valid at submission date', status: 'done', required: true },
          { label: 'ICV certificate obtained', status: 'in_progress', required: true },
        ]},
        { title: 'Submission', items: [
          { label: 'Bid bond AED 500,000 arranged', status: 'todo', required: true },
          { label: 'Envelopes separated per ITT', status: 'todo', required: true },
        ]},
      ],
    },
  })

  const tasks = [
    { title: 'Apply for ICV certificate — ADNOC programme', status: 'in_progress', priority: 'high', dueDate: deadline(4) },
    { title: 'Confirm AED 500,000 bid bond with bank', status: 'todo', priority: 'high', dueDate: deadline(6) },
    { title: 'Match tool fleet to line list in Appendix C', status: 'todo', priority: 'normal', dueDate: deadline(8) },
    { title: 'Draft mobilization plan (30-day requirement)', status: 'todo', priority: 'normal', dueDate: deadline(9) },
  ]
  for (const t of tasks) {
    await payload.create({ collection: 'tasks', data: { ...t, tender: lead.id, tenant: tenant.id } as never })
  }

  payload.logger.info('---------------------------------------------')
  payload.logger.info('Seed complete — Falcon Energy Services (oil & gas, GCC).')
  payload.logger.info('  Login: demo@tenderiq.test / ' + DEMO_PASSWORD)
  payload.logger.info('  Viewer: viewer@tenderiq.test / ' + DEMO_PASSWORD)
  payload.logger.info('---------------------------------------------')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
