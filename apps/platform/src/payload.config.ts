import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Companies } from './collections/Companies'
import { Contacts } from './collections/Contacts'
import { Tenders } from './collections/Tenders'
import { TenderDocuments } from './collections/TenderDocuments'
import { Requirements } from './collections/Requirements'
import { Capabilities } from './collections/Capabilities'
import { ChecklistTemplates } from './collections/ChecklistTemplates'
import { TenderChecklists } from './collections/TenderChecklists'
import { Tasks } from './collections/Tasks'
import { AiJobs } from './collections/AiJobs'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseURI = process.env.DATABASE_URI || 'file:./tender-platform.db'

/**
 * One database adapter, chosen by the connection string.
 * Local development uses SQLite (no Docker required); staging and production
 * use managed Postgres. Nothing else in the app changes.
 */
const db = databaseURI.startsWith('postgres')
  ? postgresAdapter({ pool: { connectionString: databaseURI } })
  : sqliteAdapter({ client: { url: databaseURI } })

export default buildConfig({
  admin: {
    // Internal operations tool only. Customers never see this — they use our
    // own UI under (frontend). Never link to /admin from the customer app.
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: '— Tender Intelligence (internal)' },
  },
  collections: [
    Tenants,
    Users,
    Media,
    Companies,
    Contacts,
    Tenders,
    TenderDocuments,
    Requirements,
    Capabilities,
    ChecklistTemplates,
    TenderChecklists,
    Tasks,
    AiJobs,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db,
  plugins: [
    /**
     * Tenant isolation (PRODUCT_CONTRACT rule 4). Adds a tenant relationship to
     * every business collection and filters every read/write by the current
     * user's tenant. Our own staff (isPlatformAdmin) can see across tenants;
     * no customer ever can.
     */
    multiTenantPlugin({
      collections: {
        companies: {},
        contacts: {},
        tenders: {},
        'tender-documents': {},
        requirements: {},
        capabilities: {},
        'checklist-templates': {},
        'tender-checklists': {},
        tasks: {},
        'ai-jobs': {},
      },
      tenantsSlug: 'tenants',
      userHasAccessToAllTenants: (user) => Boolean(user?.isPlatformAdmin),
    }),
  ],
})
