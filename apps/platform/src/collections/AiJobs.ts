import type { CollectionConfig } from 'payload'

/**
 * Mirror of AI Engine jobs, so the platform can show "AI Processing" activity
 * without querying the engine's database. Empty until Phase 2 — the socket
 * exists so the dashboard panel and progress UI are built once.
 */
export const AiJobs: CollectionConfig = {
  slug: 'ai-jobs',
  admin: { useAsTitle: 'type', group: 'AI', defaultColumns: ['type', 'tender', 'state', 'createdAt'] },
  fields: [
    { name: 'tender', type: 'relationship', relationTo: 'tenders', index: true },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          admin: { width: '50%' },
          options: [
            { label: 'Ingest document', value: 'ingest' },
            { label: 'Extract metadata', value: 'extract_metadata' },
            { label: 'Extract requirements', value: 'extract_requirements' },
            { label: 'Generate checklist', value: 'generate_checklist' },
            { label: 'Analyse compliance', value: 'compliance' },
            { label: 'Score / risk', value: 'score' },
          ],
        },
        {
          name: 'state',
          type: 'select',
          defaultValue: 'queued',
          admin: { width: '50%' },
          options: [
            { label: 'Queued', value: 'queued' },
            { label: 'Running', value: 'running' },
            { label: 'Succeeded', value: 'succeeded' },
            { label: 'Failed', value: 'failed' },
          ],
        },
      ],
    },
    { name: 'engineJobId', type: 'text', index: true },
    { name: 'progress', type: 'number', min: 0, max: 1 },
    { name: 'error', type: 'textarea' },
  ],
}
