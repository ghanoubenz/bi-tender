import type { CollectionConfig } from 'payload'
import { evidenceField, reviewFields } from '../fields/evidence'

/**
 * A single obligation placed on the bidder.
 *
 * Phase 1: a bid manager reads the ITT and adds these by hand, citing the
 * clause they came from. Phase 2: the engine produces the identical records in
 * seconds. Because the shape is the same, no screen is rebuilt.
 */
export const Requirements: CollectionConfig = {
  slug: 'requirements',
  admin: {
    useAsTitle: 'text',
    group: 'Tenders',
    defaultColumns: ['text', 'tender', 'category', 'mandatory', 'complianceStatus'],
  },
  fields: [
    { name: 'tender', type: 'relationship', relationTo: 'tenders', required: true, index: true },
    { name: 'text', type: 'textarea', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          defaultValue: 'other',
          admin: { width: '50%' },
          options: [
            { label: 'Technical', value: 'technical' },
            { label: 'Commercial', value: 'commercial' },
            { label: 'Contractual', value: 'contractual' },
            { label: 'Qualification', value: 'qualification' },
            { label: 'Certification', value: 'certification' },
            { label: 'Documentation', value: 'documentation' },
            { label: 'Submission', value: 'submission' },
            { label: 'Schedule', value: 'schedule' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'mandatory',
          type: 'select',
          admin: { width: '50%' },
          options: [
            { label: 'Mandatory (shall / must)', value: 'yes' },
            { label: 'Optional (should / may)', value: 'no' },
            { label: 'Unclear', value: 'unclear' },
          ],
        },
      ],
    },
    evidenceField,
    {
      label: 'Compliance',
      type: 'collapsible',
      fields: [
        {
          name: 'complianceStatus',
          type: 'select',
          defaultValue: 'unknown',
          options: [
            { label: 'Compliant', value: 'compliant' },
            { label: 'Partially compliant', value: 'partial' },
            { label: 'Gap', value: 'gap' },
            { label: 'Not assessed', value: 'unknown' },
          ],
        },
        {
          name: 'matchedCapabilities',
          type: 'relationship',
          relationTo: 'capabilities',
          hasMany: true,
          admin: { description: 'What we have that satisfies this requirement' },
        },
        { name: 'complianceRationale', type: 'textarea' },
        { name: 'assignee', type: 'relationship', relationTo: 'users' },
      ],
    },
    ...reviewFields,
    { name: 'engineRequirementId', type: 'text', index: true, admin: { readOnly: true } },
  ],
}
