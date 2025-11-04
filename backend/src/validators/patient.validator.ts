import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  age: z.number().int().min(0).max(150, 'Idade inválida'),
  gender: z.enum(['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'], {
    errorMap: () => ({ message: 'Gênero inválido' }),
  }),
  diagnosis: z.string().min(2, 'Diagnóstico deve ter pelo menos 2 caracteres'),
  sidedAffected: z
    .enum(['Direito', 'Esquerdo', 'Bilateral', 'Não se aplica'])
    .optional(),
  referringDoctor: z.string().optional(),
  physiotherapist: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

