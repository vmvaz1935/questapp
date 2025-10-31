import { Questionnaire, Item, Option } from '../types';

interface Answer {
  itemId: string;
  itemText: string;
  optionLabel?: string;
  score: number;
}

interface PositiveNegativePoints {
  positive: string[];
  negative: string[];
}

/**
 * Analisa as respostas do questionário para identificar pontos positivos e negativos
 * baseado nos escores e padrões das respostas, similar ao OrthoToolKit
 */
export function analyzeResults(
  questionnaire: Questionnaire,
  answers: Answer[]
): PositiveNegativePoints {
  const positive: string[] = [];
  const negative: string[] = [];

  if (!questionnaire || !questionnaire.items || !answers || answers.length === 0) {
    return { positive, negative };
  }

  // Mapear respostas por item ID para facilitar acesso
  const answersMap = new Map(answers.map(a => [a.itemId, a]));

  // Analisar cada item do questionário
  questionnaire.items.forEach(item => {
    if (!item) return;
    // Se o item tem subitems, analisar cada subitem
    if (item.subitems && item.subitems.length > 0) {
      item.subitems.forEach(subitem => {
        if (subitem.not_scored) return; // Pular itens não pontuados
        
        const answer = answersMap.get(subitem.id);
        if (!answer) return;

        const score = answer.score;
        const maxScore = Math.max(...subitem.options.map(o => o.score));
        const minScore = Math.min(...subitem.options.map(o => o.score));
      // Para itens de função, maior score geralmente = melhor
      // Calcular porcentagem considerando o range
      const scoreRange = maxScore - minScore;
      const scorePercentage = scoreRange > 0 ? ((score - minScore) / scoreRange) * 100 : 0;

      // Determinar se é positivo ou negativo baseado na pontuação
      // Para função: maior score = melhor
      if (scorePercentage >= 75) {
        positive.push(`${subitem.text}: Boa capacidade funcional`);
      } else if (scorePercentage >= 50) {
        positive.push(`${subitem.text}: Capacidade funcional moderada`);
      } else if (scorePercentage >= 25) {
        negative.push(`${subitem.text}: Capacidade funcional limitada`);
      } else {
        negative.push(`${subitem.text}: Dificuldade significativa ou incapacidade`);
      }
      });
    } else {
      // Item normal sem subitems
      const answer = answersMap.get(item.id);
      if (!answer) return;

      const score = answer.score;
      const maxScore = Math.max(...item.options.map(o => o.score));
      const minScore = Math.min(...item.options.map(o => o.score));
      const scoreRange = maxScore - minScore;
      const scorePercentage = scoreRange > 0 ? ((score - minScore) / scoreRange) * 100 : 0;

      // Determinar contexto baseado no domínio e tipo de pergunta
      const domain = item.domain?.toLowerCase() || '';
      const text = item.text.toLowerCase();

      // Para itens de dor/sintomas: maior escore geralmente = menos sintomas = melhor
      // (No IKDC: Nunca=10, Constantemente=0, então maior = melhor)
      if (domain.includes('dor') || domain.includes('sintoma') || 
          text.includes('dor') || text.includes('rigidez') || text.includes('inchado') ||
          text.includes('travou') || text.includes('falseio') || text.includes('travou')) {
        // Verificar se é reverse scored (menor score = melhor)
        const isReverseScored = item.reverse_scored === true;
        
        if (isReverseScored) {
          // Reverse scored: menor score = melhor
          if (scorePercentage <= 25) {
            positive.push(`${item.text}: Ausência ou mínima presença de sintomas`);
          } else if (scorePercentage <= 50) {
            positive.push(`${item.text}: Sintomas leves`);
          } else if (scorePercentage <= 75) {
            negative.push(`${item.text}: Sintomas moderados`);
          } else {
            negative.push(`${item.text}: Sintomas graves ou constantes`);
          }
        } else {
          // Normal scored: maior score = melhor (menos sintomas)
          if (scorePercentage >= 75) {
            positive.push(`${item.text}: Ausência ou mínima presença de sintomas`);
          } else if (scorePercentage >= 50) {
            positive.push(`${item.text}: Sintomas leves`);
          } else if (scorePercentage >= 25) {
            negative.push(`${item.text}: Sintomas moderados`);
          } else {
            negative.push(`${item.text}: Sintomas graves ou constantes`);
          }
        }
      }
      // Para itens de atividade/função: maior escore = melhor (positivo)
      else if (domain.includes('atividade') || domain.includes('função') ||
               text.includes('atividade') || text.includes('nível') || text.includes('capacidade')) {
        if (scorePercentage >= 75) {
          positive.push(`${item.text}: Alta capacidade funcional`);
        } else if (scorePercentage >= 50) {
          positive.push(`${item.text}: Capacidade funcional moderada`);
        } else if (scorePercentage >= 25) {
          negative.push(`${item.text}: Capacidade funcional limitada`);
        } else {
          negative.push(`${item.text}: Capacidade funcional muito limitada ou incapacidade`);
        }
      }
      // Para itens genéricos: maior escore geralmente = melhor
      else {
        if (scorePercentage >= 75) {
          positive.push(`${item.text}: Boa condição`);
        } else if (scorePercentage < 50) {
          negative.push(`${item.text}: Condição comprometida`);
        }
      }
    }
  });

  // Analisar pontuação total para adicionar contexto geral (apenas se não houver muitos pontos específicos)
  if (positive.length + negative.length < 10) {
    const totalScore = answers.reduce((sum, a) => sum + a.score, 0);
    const questionnaireMaxScore = questionnaire.items.reduce((sum, item) => {
      if (item.subitems && item.subitems.length > 0) {
        return sum + item.subitems
          .filter(sub => !sub.not_scored)
          .reduce((subSum, sub) => {
            const max = Math.max(...sub.options.map(o => o.score));
            return subSum + max;
          }, 0);
      } else {
        const max = Math.max(...item.options.map(o => o.score));
        return sum + max;
      }
    }, 0);
    
    const totalPercentage = questionnaireMaxScore > 0 ? (totalScore / questionnaireMaxScore) * 100 : 0;

    // Adicionar análise geral baseada na pontuação total
    if (totalPercentage >= 80) {
      positive.unshift(`Pontuação geral excelente (${totalPercentage.toFixed(1)}%): Indica boa função e mínimos sintomas`);
    } else if (totalPercentage >= 60) {
      positive.unshift(`Pontuação geral boa (${totalPercentage.toFixed(1)}%): Indica função adequada com alguns sintomas`);
    } else if (totalPercentage >= 40) {
      negative.unshift(`Pontuação geral moderada (${totalPercentage.toFixed(1)}%): Indica limitações funcionais e sintomas moderados`);
    } else if (totalPercentage > 0) {
      negative.unshift(`Pontuação geral baixa (${totalPercentage.toFixed(1)}%): Indica limitações funcionais significativas e sintomas graves`);
    }
  }

  // Limitar a 10 pontos mais relevantes em cada categoria
  if (positive.length > 10) {
    positive.splice(10);
  }
  if (negative.length > 10) {
    negative.splice(10);
  }

  return { positive, negative };
}

