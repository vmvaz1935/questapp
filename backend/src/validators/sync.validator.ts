import { z } from 'zod';

export const syncChangeSchema = z.object({
  entityType: z.enum(['PATIENT', 'RESULT', 'CONSENT']),
  entityId: z.string().min(1),
  operation: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  localTimestamp: z.string().datetime(), // ISO 8601
  data: z.record(z.any()),
});

export const syncSchema = z.object({
  changes: z.array(syncChangeSchema).min(1, 'Pelo menos uma mudança é necessária'),
});

export type SyncChangeInput = z.infer<typeof syncChangeSchema>;
export type SyncInput = z.infer<typeof syncSchema>;

