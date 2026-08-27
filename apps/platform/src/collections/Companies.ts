import type { CollectionConfig } from 'payload'

/** Clients, prospective clients and competitors. The CRM backbone. */
export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: { useAsTitle: 'name', group: 'Company Intelligence', defaultColumns: ['name', 'kind', 'country'] },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          defaultValue: 'client',
          options: [
            { label: 'Client', value: 'client' },
            { label: 'Prospect', value: 'prospect' },
            { label: 'Competitor', value: 'competitor' },
            { label: 'Partner', value: 'partner' },
          ],
          admin: { width: '50%' },
        },
        { name: 'country', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'industry', type: 'text' },
    { name: 'website', type: 'text' },
    { name: 'notes', type: 'textarea' },
  ],
}
