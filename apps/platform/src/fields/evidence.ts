import type { Field } from 'payload'

/**
 * Evidence — the product's core guarantee (PRODUCT_CONTRACT rule 2).
 *
 * Every extracted or entered fact points back at a real place in a real
 * document. In Phase 1 a human types these while reading the tender
 * (`method: 'human'`). In Phase 2 the AI Engine fills the identical shape
 * (`method: 'llm' | 'rule'`). Same structure, same UI, same audit trail —
 * this is what makes the engine additive rather than a rewrite.
 */
export const evidenceField: Field = {
  name: 'evidence',
  type: 'array',
  label: 'Evidence',
  admin: { description: 'Where this came from. Never leave a fact unsourced.' },
  fields: [
    {
      name: 'document',
      type: 'relationship',
      relationTo: 'tender-documents',
      admin: { description: 'Source document' },
    },
    {
      type: 'row',
      fields: [
        { name: 'page', type: 'number', min: 1, admin: { width: '33%' } },
        { name: 'clause', type: 'text', admin: { width: '33%', description: 'e.g. 7.3.2' } },
        { name: 'sectionPath', type: 'text', admin: { width: '34%', description: 'Heading trail' } },
      ],
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      admin: { description: 'Verbatim text from the source that supports this fact' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'method',
          type: 'select',
          defaultValue: 'human',
          options: [
            { label: 'Entered by a person', value: 'human' },
            { label: 'AI extraction', value: 'llm' },
            { label: 'Rule-based extraction', value: 'rule' },
            { label: 'OCR + AI', value: 'ocr_llm' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'confidence',
          type: 'number',
          min: 0,
          max: 1,
          admin: { width: '25%', description: '0-1' },
        },
        {
          name: 'verified',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '25%', description: 'Quote confirmed against source' },
        },
      ],
    },
  ],
}

/** Shared review-state fields: exist in Phase 1, used heavily once AI fills data. */
export const reviewFields: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'reviewStatus',
        type: 'select',
        defaultValue: 'pending',
        options: [
          { label: 'Pending review', value: 'pending' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
        ],
        admin: { width: '50%' },
      },
      {
        name: 'needsReview',
        type: 'checkbox',
        defaultValue: false,
        admin: { width: '50%', description: 'Flagged because it could not be verified' },
      },
    ],
  },
  { name: 'note', type: 'textarea' },
]
