import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { useAsTitle: 'email', group: 'System' },
  fields: [
    { name: 'fullName', type: 'text' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'contributor',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Bid manager', value: 'bid_manager' },
        { label: 'Contributor', value: 'contributor' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    {
      name: 'isPlatformAdmin',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Our staff. Can see every tenant. Never grant to a customer.' },
    },
  ],
}
