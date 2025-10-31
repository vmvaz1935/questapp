
export interface Option {
  label: string;
  score: number;
}

export interface SubItem {
  id: string;
  text: string;
  options: Option[];
  not_scored?: boolean;
  label_left?: string;
  label_right?: string;
}

export interface Item {
  id: string;
  text: string;
  domain: string;
  options: Option[];
  reverse_scored: boolean;
  subitems?: SubItem[];
  format?: 'table' | 'dual_scale';
}

export interface ScoringDomain {
  name: string;
  items: string[];
  formula: string;
}

export interface Scoring {
  domains: ScoringDomain[];
  total_formula: string;
  missing_data_rule: string;
  range: {
    min: number;
    max: number;
  };
  interpretation: string;
}

export interface QuestionnaireMetadata {
  about_score?: string;
  supporting_literature?: Array<{ type?: string; citation: string }>;
  about_developer?: string;
  translation_cultural_adaptation?: {
    original_language: string;
    target_language: string;
    adaptation_year: number;
    adaptation_authors: string;
    process: string;
    validation_study: string;
  };
}

export interface Questionnaire {
  id: string; // Added for unique identification
  name: string;
  acronym: string;
  domain: string;
  instructions: {
    text: string;
    reproduction_permitted: boolean;
  };
  items: Item[];
  scoring: Scoring;
  metadata?: QuestionnaireMetadata;
  source: {
    filename: string;
  };
}

export interface Patient {
  id: string;
  nome: string;
  idade: number;
  sexo: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar';
  diagnostico: string;
  ladoAcometido?: 'Direito' | 'Esquerdo' | 'Bilateral' | 'Não se aplica';
  fisioterapeuta?: string;
  medico?: string;
}

export type AppView = 'user' | 'admin';

export type PlanType = 'free' | 'pro';

export interface UserPlan {
  type: PlanType;
  subscribedAt?: string;
  expiresAt?: string;
  limitPatients: number | null; // null = ilimitado
  limitQuestionnaires: number | null; // null = ilimitado
}
