import { z } from 'zod';

export const createResultSchema = z.object({
  patientId: z.string().min(1, 'ID do paciente é obrigatório'),
  questionnaireId: z.string().min(1, 'ID do questionário é obrigatório'),
  questionnaireName: z.string().min(1, 'Nome do questionário é obrigatório'),
  questionnaireAcronym: z.string().optional(),
  responses: z.record(z.any()), // { "Q1": 1, "Q2": 2, ... }
  scores: z.object({
    total: z.number(),
    isPercent: z.boolean(),
    domains: z.record(z.number()).optional(),
  }),
  interpretation: z.string().optional(),
});

export type CreateResultInput = z.infer<typeof createResultSchema>;

