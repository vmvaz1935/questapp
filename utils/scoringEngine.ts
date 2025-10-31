/**
 * Engine centralizado de scoring para questionários
 * Valida e calcula pontuações de forma consistente
 */

import { Questionnaire, Item } from '../types';
import { validateQuestionnaire } from './questionnaireSchema';

export interface ScoringResult {
  totalScore: number;
  isPercent: boolean;
  domainScores?: Record<string, number>;
  interpretation?: string;
  error?: string;
}

/**
 * Calcula a pontuação total de um questionário
 * @param questionnaire Questionário
 * @param answers Respostas do usuário (mapa itemId -> score)
 * @returns Resultado do cálculo de pontuação
 */
export function calculateQuestionnaireScore(
  questionnaire: Questionnaire,
  answers: Record<string, number>
): ScoringResult {
  try {
    // Validar questionário
    const validation = validateQuestionnaire(questionnaire);
    if (!validation.success) {
      return {
        totalScore: 0,
        isPercent: false,
        error: `Questionário inválido: ${validation.error?.message || 'Erro desconhecido'}`,
      };
    }

    let totalScore = 0;
    const domainScores: Record<string, number> = {};

    // Processar cada item
    questionnaire.items.forEach((item) => {
      // Se o item tem subitems, processar cada subitem
      if (item.subitems && item.subitems.length > 0) {
        item.subitems.forEach((subitem) => {
          // Pular itens não pontuados
          if (subitem.not_scored) return;

          const score = answers[subitem.id] ?? 0;
          
          // Aplicar reverse scoring se necessário
          const finalScore = item.reverse_scored 
            ? getMaxScore(subitem.options) - score 
            : score;

          totalScore += finalScore;

          // Acumular por domínio
          const domain = item.domain;
          if (!domainScores[domain]) {
            domainScores[domain] = 0;
          }
          domainScores[domain] += finalScore;
        });
      } else {
        // Item normal sem subitems
        const score = answers[item.id] ?? 0;
        
        // Aplicar reverse scoring se necessário
        const finalScore = item.reverse_scored
          ? getMaxScore(item.options) - score
          : score;

        totalScore += finalScore;

        // Acumular por domínio
        const domain = item.domain;
        if (!domainScores[domain]) {
          domainScores[domain] = 0;
        }
        domainScores[domain] += finalScore;
      }
    });

    // Aplicar fórmula de pontuação
    const formula = questionnaire.scoring?.formula || '';
    let finalScore = totalScore;
    let isPercent = false;

    // Parsear fórmulas comuns
    if (formula.includes('%') || formula.toLowerCase().includes('100')) {
      isPercent = true;
      
      // Fórmula: [(Soma - X) / Y] * 100
      const match1 = formula.match(/\[\(Soma.*?-\s*(\d+)\)\s*\/\s*(\d+)\)\]\s*\*\s*100/);
      if (match1) {
        const [, subtract, divide] = match1.map(Number);
        finalScore = ((totalScore - subtract) / divide) * 100;
      }
      // Fórmula: (Soma / X) * 100
      else if (formula.match(/\(Soma.*?\/\s*(\d+)\)\s*\*\s*100/)) {
        const match2 = formula.match(/\(Soma.*?\/\s*(\d+)\)\s*\*\s*100/);
        if (match2) {
          const [, divisor] = match2.map(Number);
          finalScore = (totalScore / divisor) * 100;
        }
      }
      // Fórmula: (Soma / Max) * 100
      else {
        const maxScore = getMaxPossibleScore(questionnaire);
        if (maxScore > 0) {
          finalScore = (totalScore / maxScore) * 100;
        }
      }
    }

    // Garantir que o score esteja dentro do range
    const range = questionnaire.scoring?.range;
    if (range) {
      finalScore = Math.max(range.min, Math.min(range.max, finalScore));
    }

    return {
      totalScore: Math.round(finalScore * 100) / 100, // Arredondar para 2 casas decimais
      isPercent,
      domainScores: Object.keys(domainScores).length > 0 ? domainScores : undefined,
      interpretation: questionnaire.scoring?.interpretation,
    };
  } catch (error) {
    return {
      totalScore: 0,
      isPercent: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no cálculo',
    };
  }
}

/**
 * Obtém o score máximo de uma lista de opções
 */
function getMaxScore(options: Array<{ score: number }>): number {
  if (!options || options.length === 0) return 0;
  return Math.max(...options.map(o => o.score));
}

/**
 * Calcula a pontuação máxima possível do questionário
 */
function getMaxPossibleScore(questionnaire: Questionnaire): number {
  let maxScore = 0;

  questionnaire.items.forEach((item) => {
    if (item.subitems && item.subitems.length > 0) {
      item.subitems.forEach((subitem) => {
        if (!subitem.not_scored) {
          maxScore += getMaxScore(subitem.options);
        }
      });
    } else {
      maxScore += getMaxScore(item.options);
    }
  });

  return maxScore;
}

/**
 * Valida se todas as respostas obrigatórias foram fornecidas
 */
export function validateAnswers(
  questionnaire: Questionnaire,
  answers: Record<string, number>
): { valid: boolean; missingItems: string[] } {
  const missingItems: string[] = [];

  questionnaire.items.forEach((item) => {
    if (item.subitems && item.subitems.length > 0) {
      item.subitems.forEach((subitem) => {
        if (!subitem.not_scored && answers[subitem.id] === undefined) {
          missingItems.push(subitem.id);
        }
      });
    } else {
      if (answers[item.id] === undefined) {
        missingItems.push(item.id);
      }
    }
  });

  return {
    valid: missingItems.length === 0,
    missingItems,
  };
}

