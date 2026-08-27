import type { CollectionConfig } from 'payload'

/**
 * Company Intelligence — what the bidding company actually has.
 *
 * One collection with a `kind` discriminator rather than three near-identical
 * ones. This is the other half of the match engine: Tender Requirements +
 * Company Capabilities => compliance, gaps, fit score.
 */
export const Capabilities: CollectionConfig = {
  slug: 'capabilities',
  admin: {
    useAsTitle: 'name',
    group: 'Company Intelligence',
    defaultColumns: ['name', 'kind', 'category', 'validUntil'],
  },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          defaultValue: 'capability',
          admin: { width: '50%' },
          options: [
            { label: 'Capability / service', value: 'capability' },
            { label: 'Certification', value: 'certification' },
            { label: 'Project reference', value: 'project_reference' },
            { label: 'Product', value: 'product' },
            { label: 'Equipment', value: 'equipment' },
          ],
        },
        { name: 'category', type: 'text', admin: { width: '50%' } },
      ],
    },
    { name: 'description', type: 'textarea' },
    {
      label: 'Certification details',
      type: 'collapsible',
      admin: { condition: (data) => data?.kind === 'certification' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'issuer', type: 'text', admin: { width: '50%' } },
            { name: 'validUntil', type: 'date', admin: { width: '50%' } },
          ],
        },
        { name: 'certificateNumber', type: 'text' },
      ],
    },
    {
      label: 'Project reference details',
      type: 'collapsible',
      admin: { condition: (data) => data?.kind === 'project_reference' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'client', type: 'relationship', relationTo: 'companies', admin: { width: '50%' } },
            { name: 'year', type: 'number', admin: { width: '25%' } },
            { name: 'value', type: 'number', admin: { width: '25%' } },
          ],
        },
        { name: 'country', type: 'text' },
      ],
    },
    { name: 'evidenceDocument', type: 'upload', relationTo: 'media', admin: { description: 'Certificate, datasheet or reference letter' } },
  ],
}
