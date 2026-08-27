import type { CollectionConfig } from 'payload'

/** General uploads: tenant logos, certificates, reference letters. */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'System' },
  upload: { staticDir: 'uploads/media' },
  fields: [{ name: 'alt', type: 'text' }],
}
