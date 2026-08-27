import type { CollectionConfig } from 'payload'

export const Contacts: CollectionConfig = {
  slug: 'contacts',
  admin: {
    useAsTitle: 'fullName',
    group: 'Company Intelligence',
    defaultColumns: ['fullName', 'company', 'jobTitle', 'email'],
  },
  fields: [
    { name: 'fullName', type: 'text', required: true, index: true },
    { name: 'company', type: 'relationship', relationTo: 'companies' },
    {
      type: 'row',
      fields: [
        { name: 'jobTitle', type: 'text', admin: { width: '50%' } },
        { name: 'email', type: 'email', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', admin: { width: '50%' } },
        { name: 'isPrimary', type: 'checkbox', admin: { width: '50%', description: 'Primary contact' } },
      ],
    },
    { name: 'notes', type: 'textarea' },
  ],
}
