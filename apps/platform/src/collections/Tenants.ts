import type { CollectionConfig } from 'payload'

/** One customer company. Every business record hangs off a tenant. */
export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: { useAsTitle: 'name', group: 'System' },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      label: 'Branding',
      type: 'collapsible',
      fields: [
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'accentColor', type: 'text', admin: { description: 'Hex, e.g. #2f5fe0' } },
      ],
    },
    {
      label: 'AI settings',
      type: 'collapsible',
      admin: { description: 'Inert until the AI Engine is connected (Phase 2).' },
      fields: [
        {
          name: 'privateProcessing',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Never send this tenant’s documents to external AI providers.' },
        },
        {
          name: 'modelTier',
          type: 'select',
          defaultValue: 'standard',
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'High accuracy', value: 'high' },
          ],
        },
      ],
    },
    { name: 'terminology', type: 'json', admin: { description: 'Per-tenant wording overrides' } },
  ],
}
