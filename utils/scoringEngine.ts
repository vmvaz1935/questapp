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
        });
      } else {
        // Item normal sem subitems
        const score = answers[item.id] ?? 0;
        
        // Aplicar reverse scoring se necessário
        const finalScore = item.reverse_scored
          ? getMaxScore(item.options) - score
          : score;

        totalScore += finalScore;
      }
    });

    // Calcular pontuação por domínio (normalizado quando aplicável)
    if (questionnaire.scoring?.domains) {
      questionnaire.scoring.domains.forEach((domain) => {
        let sum = 0;
        let count = 0;
        
        domain.items.forEach((itemId) => {
          // Procurar o item ou subitem correspondente
          questionnaire.items.forEach((item) => {
            if (item.subitems && item.subitems.length > 0) {
              item.subitems.forEach((subitem) => {
                if (subitem.id === itemId && !subitem.not_scored && answers[subitem.id] !== undefined) {
                  const score = answers[subitem.id] ?? 0;
                  const finalScore = item.reverse_scored 
                    ? getMaxScore(subitem.options) - score 
                    : score;
                  sum += finalScore;
                  count++;
                }
              });
            } else if (item.id === itemId && answers[item.id] !== undefined) {
              const score = answers[item.id] ?? 0;
              const finalScore = item.reverse_scored
                ? getMaxScore(item.options) - score
                : score;
              sum += finalScore;
              count++;
            }
          });
        });
        
        const formulaText = (domain.formula || '').toLowerCase();
        let value = sum;
        
        // Normalização comum (KOOS/HOOS/HAGOS/FAOS): 100 - [(sum * 100) / (4 * n)]
        if (formulaText.includes('100 -') && formulaText.includes('/ (4 *') && count > 0) {
          value = 100 - ((sum * 100) / (4 * count));
        }
        
        domainScores[domain.name] = value;
      });
    }

    // Aplicar fórmula de pontuação
    const formula = questionnaire.scoring?.total_formula || '';
    let finalScore = totalScore;
    let isPercent = false;

    // Parsear fórmulas comuns
    if (formula.includes('%') || formula.toLowerCase().includes('100')) {
      isPercent = true;
    }

    // Processar fórmula total
    if (formula.includes('Soma de todos os itens')) {
      // Parser para fórmulas como "[(Soma de todos os itens - X) / Y] * 100" ou "(Soma de todos os itens / X) * Y"
      const simplified = formula.replace(/\s/g, '').replace(/Somadetodosositens/g, totalScore.toString());
      
      // Padrão 1: [(soma - X) / Y] * 100 (ex: DASH)
      const m1 = simplified.match(/\[\((\d+\.?\d*)\-(\d+\.?\d*)\)\/(\d+\.?\d*)\)\]\*(\d+\.?\d*)/);
      if (m1) {
        const sum = parseFloat(m1[1]);
        const subtract = parseFloat(m1[2]);
        const divisor = parseFloat(m1[3]);
        const mult = parseFloat(m1[4]);
        if (divisor) finalScore = ((sum - subtract) / divisor) * mult;
      } else {
        // Padrão 2: (soma / X) * Y (ex: ODI)
        const m2 = simplified.match(/\((\d+\.?\d*)\/(\d+\.?\d*)\)\*(\d+\.?\d*)/);
        if (m2) {
          const sum = parseFloat(m2[1]);
          const divisor = parseFloat(m2[2]);
          const mult = parseFloat(m2[3]);
          if (divisor) finalScore = (sum / divisor) * mult;
        }
      }
    } else if (formula.toLowerCase().includes('(2100 - total') || formula.includes('2100')) {
      // WOSI: % = (2100 - total raw) / 2100 * 100
      const max = 2100;
      finalScore = ((max - totalScore) / max) * 100;
      isPercent = true;
    } else if (formula.includes('%') || formula.toLowerCase().includes('100')) {
      // Fórmula genérica com porcentagem: usar max score possível
      const maxScore = getMaxPossibleScore(questionnaire);
      if (maxScore > 0) {
        finalScore = (totalScore / maxScore) * 100;
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

/**
 * Valida um item específico do questionário
 * @param item Item do questionário a ser validado
 * @param answers Respostas atuais
 * @returns Resultado da validação com mensagem de erro se houver
 */
export function validateItem(
  item: Item,
  answers: Record<string, number>
): { valid: boolean; error?: string } {
  // Se o item tem subitems, validar cada subitem
  if (item.subitems && item.subitems.length > 0) {
    const missingSubitems: string[] = [];
    
    item.subitems.forEach((subitem) => {
      if (!subitem.not_scored && answers[subitem.id] === undefined) {
        missingSubitems.push(subitem.text || subitem.id);
      }
    });

    if (missingSubitems.length > 0) {
      return {
        valid: false,
        error: `Por favor, responda todas as perguntas desta seção.`,
      };
    }
  } else {
    // Item simples sem subitems
    if (answers[item.id] === undefined) {
      return {
        valid: false,
        error: 'Esta pergunta é obrigatória.',
      };
    }
  }

  return { valid: true };
}

