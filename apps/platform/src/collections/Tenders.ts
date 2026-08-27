import type { CollectionConfig } from 'payload'

/**
 * The Tender — the centre of the product. Everything else hangs off this.
 *
 * Phase 1: people fill these fields in by hand and run the whole workflow.
 * Phase 2: the AI Engine populates `aiMetadata` and the related Requirements,
 * and `processingStatus` drives the live progress UI. The shape does not change.
 */
export const Tenders: CollectionConfig = {
  slug: 'tenders',
  admin: {
    useAsTitle: 'title',
    group: 'Tenders',
    defaultColumns: ['title', 'client', 'stage', 'submissionDeadline', 'decision'],
  },
  versions: { drafts: false }, // full change history for audit
  fields: [
    { name: 'title', type: 'text', required: true, index: true },
    {
      type: 'row',
      fields: [
        { name: 'reference', type: 'text', admin: { width: '50%', description: 'e.g. ITT-2026-0042' } },
        { name: 'client', type: 'relationship', relationTo: 'companies', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'country', type: 'text', admin: { width: '33%' } },
        { name: 'submissionDeadline', type: 'date', admin: { width: '33%' } },
        { name: 'estimatedValue', type: 'number', admin: { width: '34%' } },
      ],
    },
    {
      name: 'stage',
      type: 'select',
      defaultValue: 'identified',
      index: true,
      options: [
        { label: 'Identified', value: 'identified' },
        { label: 'Qualifying', value: 'qualifying' },
        { label: 'Preparing bid', value: 'preparing' },
        { label: 'Submitted', value: 'submitted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Abandoned', value: 'abandoned' },
      ],
    },
    { name: 'scope', type: 'textarea' },
    { name: 'owner', type: 'relationship', relationTo: 'users' },
    {
      label: 'Bid / No-Bid decision',
      type: 'collapsible',
      admin: { description: 'Always made by a person, never by the AI (PRODUCT_CONTRACT rule 5).' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'decision',
              type: 'select',
              options: [
                { label: 'Bid', value: 'bid' },
                { label: 'No-Bid', value: 'no_bid' },
                { label: 'Hold', value: 'hold' },
              ],
              admin: { width: '50%' },
            },
            { name: 'decidedAt', type: 'date', admin: { width: '50%' } },
          ],
        },
        { name: 'decisionReason', type: 'textarea' },
        { name: 'decidedBy', type: 'relationship', relationTo: 'users' },
      ],
    },
    {
      label: 'AI Engine',
      type: 'collapsible',
      admin: { description: 'Populated by the Tender AI Engine in Phase 2. Empty until then.' },
      fields: [
        {
          name: 'processingStatus',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'Not started', value: 'none' },
            { label: 'Processing', value: 'processing' },
            { label: 'Ready', value: 'ready' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        {
          name: 'aiMetadata',
          type: 'json',
          admin: { description: 'TenderMetadata contract payload, evidence included' },
        },
        { name: 'engineJobId', type: 'text' },
      ],
    },
  ],
}
