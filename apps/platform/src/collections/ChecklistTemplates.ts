import type { CollectionConfig } from 'payload'

/**
 * Reusable checklist per industry / tender type.
 *
 * Phase 1: built and edited by people. Phase 2: the engine proposes one from a
 * new tender's structure and a person edits and saves it back here. The agent
 * configures DATA in this collection — it never rewrites code or schema.
 */
export const ChecklistTemplates: CollectionConfig = {
  slug: 'checklist-templates',
  admin: { useAsTitle: 'name', group: 'Templates', defaultColumns: ['name', 'industry', 'tenderType'] },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'industry', type: 'text', admin: { width: '50%', description: 'e.g. Oil & Gas' } },
        { name: 'tenderType', type: 'text', admin: { width: '50%', description: 'e.g. ILI inspection' } },
      ],
    },
    { name: 'description', type: 'textarea' },
    {
      name: 'sections',
      type: 'array',
      required: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            {
              type: 'row',
              fields: [
                {
                  name: 'category',
                  type: 'select',
                  admin: { width: '50%' },
                  options: [
                    { label: 'Technical', value: 'technical' },
                    { label: 'Commercial', value: 'commercial' },
                    { label: 'Legal', value: 'legal' },
                    { label: 'Qualification', value: 'qualification' },
                    { label: 'Certification', value: 'certification' },
                    { label: 'Documentation', value: 'documentation' },
                    { label: 'Submission', value: 'submission' },
                  ],
                },
                { name: 'required', type: 'checkbox', defaultValue: true, admin: { width: '50%' } },
              ],
            },
            { name: 'guidance', type: 'textarea' },
          ],
        },
      ],
    },
  ],
}
