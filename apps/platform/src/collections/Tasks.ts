import type { CollectionConfig } from 'payload'

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: { useAsTitle: 'title', group: 'Manage', defaultColumns: ['title', 'tender', 'assignee', 'dueDate', 'status'] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'tender', type: 'relationship', relationTo: 'tenders', admin: { width: '50%' } },
        { name: 'assignee', type: 'relationship', relationTo: 'users', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          defaultValue: 'todo',
          admin: { width: '33%' },
          options: [
            { label: 'To do', value: 'todo' },
            { label: 'In progress', value: 'in_progress' },
            { label: 'Blocked', value: 'blocked' },
            { label: 'Done', value: 'done' },
          ],
        },
        {
          name: 'priority',
          type: 'select',
          defaultValue: 'normal',
          admin: { width: '33%' },
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Normal', value: 'normal' },
            { label: 'High', value: 'high' },
          ],
        },
        { name: 'dueDate', type: 'date', admin: { width: '34%' } },
      ],
    },
    { name: 'description', type: 'textarea' },
  ],
}
