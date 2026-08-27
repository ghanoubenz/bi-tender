import type { CollectionConfig } from 'payload'

/** The tender package: ITT, drawings, BoQ, addenda. Upload-enabled collection. */
export const TenderDocuments: CollectionConfig = {
  slug: 'tender-documents',
  upload: {
    staticDir: 'uploads/tender-documents',
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-excel',
      'application/zip',
      'message/rfc822',
    ],
  },
  admin: { group: 'Tenders', defaultColumns: ['filename', 'tender', 'documentType', 'ingestionStatus'] },
  fields: [
    { name: 'tender', type: 'relationship', relationTo: 'tenders', required: true, index: true },
    {
      name: 'documentType',
      type: 'select',
      defaultValue: 'other',
      options: [
        { label: 'Invitation to Tender', value: 'itt' },
        { label: 'Technical specification', value: 'specification' },
        { label: 'Bill of Quantities', value: 'boq' },
        { label: 'Contract / conditions', value: 'contract' },
        { label: 'Drawing', value: 'drawing' },
        { label: 'Addendum', value: 'addendum' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      label: 'AI Engine',
      type: 'collapsible',
      admin: { description: 'Set by the engine in Phase 2.' },
      fields: [
        {
          name: 'ingestionStatus',
          type: 'select',
          defaultValue: 'not_processed',
          options: [
            { label: 'Not processed', value: 'not_processed' },
            { label: 'Processing', value: 'processing' },
            { label: 'Ingested', value: 'ingested' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        { name: 'engineDocumentId', type: 'text', index: true },
        { name: 'engineJobId', type: 'text' },
        { name: 'ingestionError', type: 'textarea' },
        { name: 'pageCount', type: 'number' },
      ],
    },
  ],
}
