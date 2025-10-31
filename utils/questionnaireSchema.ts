import { z } from 'zod';

// Schema de validação para questionários usando Zod
export const OptionSchema = z.object({
  label: z.string(),
  score: z.number(),
});

export const SubItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(OptionSchema),
  not_scored: z.boolean().optional(),
  label_left: z.string().optional(),
  label_right: z.string().optional(),
});

export const ItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  domain: z.string(),
  options: z.array(OptionSchema).optional(),
  reverse_scored: z.boolean(),
  subitems: z.array(SubItemSchema).optional(),
  format: z.enum(['table', 'dual_scale']).optional(),
});

export const ScoringSchema = z.object({
  formula: z.string(),
  interpretation: z.string().optional(),
  range: z.object({
    min: z.number(),
    max: z.number(),
  }).optional(),
});

export const InstructionsSchema = z.object({
  text: z.string(),
  reproduction_permitted: z.boolean(),
});

export const TranslationCulturalAdaptationSchema = z.object({
  original_language: z.string(),
  target_language: z.string(),
  adaptation_year: z.number(),
  adaptation_authors: z.string(),
  process: z.string(),
  validation_study: z.string(),
});

export const SupportingLiteratureSchema = z.object({
  type: z.string().optional(),
  citation: z.string(),
});

export const MetadataSchema = z.object({
  about_score: z.string().optional(),
  supporting_literature: z.array(SupportingLiteratureSchema).optional(),
  about_developer: z.string().optional(),
  translation_cultural_adaptation: TranslationCulturalAdaptationSchema.optional(),
});

export const QuestionnaireSchema = z.object({
  id: z.string(),
  name: z.string(),
  acronym: z.string(),
  domain: z.string(),
  instructions: InstructionsSchema,
  items: z.array(ItemSchema),
  scoring: ScoringSchema,
  metadata: MetadataSchema.optional(),
  source: z.object({
    filename: z.string(),
  }),
});

export type QuestionnaireType = z.infer<typeof QuestionnaireSchema>;
export type ItemType = z.infer<typeof ItemSchema>;
export type OptionType = z.infer<typeof OptionSchema>;
export type SubItemType = z.infer<typeof SubItemSchema>;

/**
 * Valida um questionário contra o schema
 * @param questionnaire Questionário a ser validado
 * @returns Resultado da validação
 */
export function validateQuestionnaire(questionnaire: unknown): {
  success: boolean;
  data?: QuestionnaireType;
  error?: z.ZodError;
} {
  try {
    const data = QuestionnaireSchema.parse(questionnaire);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Valida um array de questionários
 * @param questionnaires Array de questionários a ser validado
 * @returns Resultado da validação
 */
export function validateQuestionnaires(questionnaires: unknown[]): {
  success: boolean;
  valid: QuestionnaireType[];
  invalid: Array<{ questionnaire: unknown; error: z.ZodError }>;
} {
  const valid: QuestionnaireType[] = [];
  const invalid: Array<{ questionnaire: unknown; error: z.ZodError }> = [];

  questionnaires.forEach((questionnaire) => {
    const result = validateQuestionnaire(questionnaire);
    if (result.success && result.data) {
      valid.push(result.data);
    } else if (result.error) {
      invalid.push({ questionnaire, error: result.error });
    }
  });

  return {
    success: invalid.length === 0,
    valid,
    invalid,
  };
}

