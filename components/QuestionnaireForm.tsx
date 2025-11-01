import React, { useEffect, useMemo, useState } from 'react';
import { Questionnaire, Item, Patient } from '../types';
import ScoreDisplay from './ScoreDisplay';

interface QuestionnaireFormProps {
  questionnaire: Questionnaire;
  patient?: Patient | null;
  onSaved?: (payload: { questionnaireId: string; totalScore: number; isPercent: boolean; answers: { itemId: string; itemText: string; optionLabel?: string; score: number }[] }) => void;
}

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ questionnaire, patient, onSaved }) => {
  const [answers, setAnswers] = useState<{ [itemId: string]: number }>({});
  const [scoreData, setScoreData] = useState<{ totalScore: number; domainScores: { [key: string]: number } } | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  // Exibe todas as perguntas em uma única página

  // Autosave/load answers
  const storageKey = `qform_${questionnaire.id}`;
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setAnswers(JSON.parse(raw));
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(answers)); } catch {}
  }, [answers, storageKey]);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted && Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [submitted, answers]);

  // Contar total de itens incluindo subitems
  const totalItems = useMemo(() => {
    let count = 0;
    questionnaire.items.forEach(item => {
      if (item.subitems && item.subitems.length > 0) {
        // Contar apenas subitems que devem ser pontuados
        count += item.subitems.filter(sub => !sub.not_scored).length;
      } else {
        count += 1;
      }
    });
    return count;
  }, [questionnaire.items]);

  const answeredCount = useMemo(() => {
    let count = 0;
    questionnaire.items.forEach(item => {
      if (item.subitems && item.subitems.length > 0) {
        item.subitems.forEach(sub => {
          if (!sub.not_scored && answers[sub.id] !== undefined) {
            count++;
          }
        });
      } else if (answers[item.id] !== undefined) {
        count++;
      }
    });
    return count;
  }, [answers, questionnaire.items]);
  
  const progressPct = Math.round((answeredCount / totalItems) * 100);
  const visibleItems = questionnaire.items;

  // Agrupar itens por domínio para melhor organização visual
  // Garantir que os itens estejam ordenados pela ordem numérica que aparecem no questionário
  const itemsByDomain = useMemo(() => {
    const grouped: { [domain: string]: Item[] } = {};
    
    // Iterar pelos itens na ordem original do questionário
    questionnaire.items.forEach((item, originalIndex) => {
      const domain = item.domain || 'Outros';
      if (!grouped[domain]) grouped[domain] = [];
      
      // Adicionar item com seu índice original para manter ordem
      grouped[domain].push(item);
    });
    
    // Ordenar itens dentro de cada domínio pela ordem original no questionário
    Object.keys(grouped).forEach(domain => {
      grouped[domain].sort((a, b) => {
        const indexA = questionnaire.items.findIndex(item => item.id === a.id);
        const indexB = questionnaire.items.findIndex(item => item.id === b.id);
        return indexA - indexB;
      });
    });
    
    // Ordenar domínios pela ordem do primeiro item de cada domínio
    const sortedDomains: { [domain: string]: Item[] } = {};
    const domainOrder = Object.keys(grouped).sort((domainA, domainB) => {
      const firstItemA = grouped[domainA][0];
      const firstItemB = grouped[domainB][0];
      const indexA = questionnaire.items.findIndex(item => item.id === firstItemA.id);
      const indexB = questionnaire.items.findIndex(item => item.id === firstItemB.id);
      return indexA - indexB;
    });
    
    domainOrder.forEach(domain => {
      sortedDomains[domain] = grouped[domain];
    });
    
    return sortedDomains;
  }, [questionnaire.items]);

  const handleAnswerChange = (itemId: string, score: number) => {
    setAnswers(prev => ({ ...prev, [itemId]: score }));
  };

  const calculateScore = () => {
    // Soma bruta dos itens (incluindo subitems, exceto os marcados como not_scored)
    let totalScore = 0;
    questionnaire.items.forEach(item => {
      if (item.subitems && item.subitems.length > 0) {
        item.subitems.forEach(sub => {
          if (!sub.not_scored && answers[sub.id] !== undefined) {
            totalScore += answers[sub.id] || 0;
          }
        });
      } else if (answers[item.id] !== undefined) {
        totalScore += answers[item.id] || 0;
      }
    });

    // Cálculo por domínio (normalizado quando aplicável)
    const domainScores: { [key: string]: number } = {};
    questionnaire.scoring.domains.forEach(domain => {
      let sum = 0; let count = 0;
      domain.items.forEach(itemId => {
        if (answers[itemId] !== undefined) { sum += answers[itemId]; count++; }
      });
      const formulaText = (domain.formula || '').toLowerCase();
      let value = sum;
      // Normalização comum (KOOS/HOOS/HAGOS/FAOS): 100 - [(sum * 100) / (4 * n)]
      if (formulaText.includes('100 -') && formulaText.includes('/ (4 *') && count > 0) {
        value = 100 - ((sum * 100) / (4 * count));
      }
      domainScores[domain.name] = value;
    });

    // Total
    let finalScore = totalScore;
    const formula = questionnaire.scoring.total_formula;
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
      const max = 2100; finalScore = ((max - totalScore) / max) * 100;
    }
    
    return {
      totalScore: finalScore,
      domainScores,
    };
  };

  // Preparar respostas para análise ANTES de qualquer return condicional
  const answersArrayForDisplay = useMemo(() => {
    if (!scoreData) return [];
    try {
      const result: Array<{ itemId: string; itemText: string; optionLabel?: string; score: number }> = [];
      
      if (questionnaire?.items) {
        questionnaire.items.forEach(item => {
          if (!item) return;
          
          if (item.subitems && item.subitems.length > 0) {
            item.subitems.forEach(sub => {
              if (!sub || sub.not_scored) return;
              if (answers[sub.id] !== undefined && sub.options) {
                const opt = sub.options.find(o => o && o.score === answers[sub.id]);
                result.push({ 
                  itemId: sub.id, 
                  itemText: `${item.text || ''} - ${sub.text || ''}`, 
                  optionLabel: opt?.label, 
                  score: answers[sub.id] 
                });
              }
            });
          } else if (answers[item.id] !== undefined && item.options) {
            const opt = item.options.find(o => o && o.score === answers[item.id]);
            result.push({ 
              itemId: item.id, 
              itemText: item.text || '', 
              optionLabel: opt?.label, 
              score: answers[item.id] 
            });
          }
        });
      }
      return result;
    } catch (error) {
      console.error('Erro ao preparar respostas para exibição:', error);
      return [];
    }
  }, [scoreData, questionnaire, answers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar se todos os itens (incluindo subitems necessários) foram respondidos
    const requiredAnswers = new Set<string>();
    questionnaire.items.forEach(item => {
      if (item.subitems && item.subitems.length > 0) {
        item.subitems.forEach(sub => {
          if (!sub.not_scored) {
            requiredAnswers.add(sub.id);
          }
        });
      } else {
        requiredAnswers.add(item.id);
      }
    });
    
    const allAnswered = Array.from(requiredAnswers).every(id => answers[id] !== undefined);
    if (!allAnswered) {
      alert(`Por favor, responda todas as perguntas. Faltam ${totalItems - answeredCount} resposta(s).`);
      return;
    }
    const result = calculateScore();
    setScoreData(result);
    setSubmitted(true);
    if (onSaved) {
      const answersArray: { itemId: string; itemText: string; optionLabel?: string; score: number }[] = [];
      questionnaire.items.forEach(item => {
        if (item.subitems && item.subitems.length > 0) {
          item.subitems.forEach(sub => {
            if (!sub.not_scored && answers[sub.id] !== undefined) {
              const opt = sub.options.find(o => o.score === answers[sub.id]);
              answersArray.push({ 
                itemId: sub.id, 
                itemText: `${item.text} - ${sub.text}`, 
                optionLabel: opt?.label, 
                score: answers[sub.id] 
              });
            }
          });
        } else if (answers[item.id] !== undefined) {
          const opt = item.options.find(o => o.score === answers[item.id]);
          answersArray.push({ 
            itemId: item.id, 
            itemText: item.text, 
            optionLabel: opt?.label, 
            score: answers[item.id] 
          });
        }
      });
      onSaved({ questionnaireId: questionnaire.id, totalScore: result.totalScore, isPercent: questionnaire.scoring.range.max === 100, answers: answersArray });
    }
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };
  
  // IMPORTANTE: Todos os hooks DEVEM ser chamados antes de qualquer return condicional
  const currentPageValid = useMemo(() => {
    if (scoreData) return true; // Se já tem scoreData, consideramos válido (não deve aparecer aqui mesmo)
    return visibleItems.every(it => {
      if (it.subitems && it.subitems.length > 0) {
        // Verificar se todos os subitems necessários foram respondidos
        return it.subitems.filter(sub => !sub.not_scored).every(sub => answers[sub.id] !== undefined);
      }
      return answers[it.id] !== undefined;
    });
  }, [visibleItems, answers, scoreData]);

  // Renderizar resultados se houver scoreData
  if (scoreData) {
    try {
      return (
        <ScoreDisplay 
          scoreData={scoreData} 
          scoring={questionnaire.scoring}
          questionnaire={questionnaire}
          answers={answersArrayForDisplay}
          patient={patient}
        />
      );
    } catch (error) {
      console.error('Erro ao exibir resultados:', error);
      return (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-6 mt-8">
          <h3 className="text-xl font-semibold text-red-800 dark:text-red-400 mb-2">Erro ao exibir resultados</h3>
          <p className="text-red-700 dark:text-red-300 mb-2">
            Ocorreu um erro ao processar os resultados. Por favor, verifique o console para mais detalhes.
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Pontuação calculada: {scoreData.totalScore.toFixed(2)}{questionnaire.scoring?.range?.max === 100 ? '%' : ''}
          </p>
          {error instanceof Error && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-mono">{error.message}</p>
          )}
        </div>
      );
    }
  }

  return (
    <div className="mt-6 animate-fade-in">
      {/* Barra de progresso */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">Progresso: {answeredCount}/{totalItems} ({progressPct}%)</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Todas as perguntas</p>
        </div>
        <div className="w-full h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className="h-2 bg-blue-600" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
      {/* Cabeçalho do questionário */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6 border-l-4 border-blue-600">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{questionnaire.name} ({questionnaire.acronym})</h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
          <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">{questionnaire.instructions.text}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {Object.entries(itemsByDomain).map(([domain, items]) => {
          // Mostrar seção de domínio apenas se houver múltiplos domínios
          const showDomainSection = Object.keys(itemsByDomain).length > 1;
          
          return (
            <div key={domain} className={showDomainSection ? "space-y-6" : ""}>
              {showDomainSection && (
                <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-3 px-4 rounded-lg border-b-2 border-blue-500">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white uppercase tracking-wide">{domain}</h3>
                </div>
              )}
              
              {items.map((item) => {
                // Garantir numeração sequencial global baseada na ordem original do questionário
                const index = questionnaire.items.findIndex(i => i.id === item.id);
                const numericLabels = item.options?.every(o => /^\d+$/.test(String(o.label)) || /^\d+\s*(?:–|-|a)\s*\d+$/.test(String(o.label))) ?? false;
                const scores = item.options?.map(o => o.score).sort((a, b) => a - b) ?? [];
                const is011 = numericLabels && scores[0] === 0 && scores[scores.length - 1] === 10 && scores.length >= 5;
                const value = answers[item.id] ?? (is011 ? 0 : undefined);
                // Verificar se o item está respondido (considerando subitems quando aplicável)
                const isAnswered = item.subitems && item.subitems.length > 0
                  ? item.subitems.filter(sub => !sub.not_scored).every(sub => answers[sub.id] !== undefined)
                  : answers[item.id] !== undefined;
                
                return (
                  <div key={item.id} className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 transition-all ${isAnswered ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300'}`}>
                    <p className="text-base font-semibold text-gray-800 dark:text-white mb-4 leading-relaxed">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold mr-3">
                        {index + 1}
                      </span>
                      {item.text}
                    </p>
                    
                    {item.format === 'table' && item.subitems ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900">
                              <th className="border border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Atividade</th>
                              {item.subitems[0]?.options.map((opt, optIdx) => (
                                <th key={optIdx} className="border border-gray-300 dark:border-gray-700 p-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                  <div>{opt.label}</div>
                                  <div className="text-gray-500 dark:text-gray-400 mt-1">({opt.score})</div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {item.subitems.map((subitem) => {
                              const subIsAnswered = answers[subitem.id] !== undefined;
                              return (
                                <tr key={subitem.id} className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 ${subIsAnswered ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                                  <td className="border border-gray-300 dark:border-gray-700 p-3 text-sm font-medium text-gray-800 dark:text-white">
                                    {subitem.text}
                                  </td>
                                  {subitem.options.map((option) => {
                                    const isSelected = answers[subitem.id] === option.score;
                                    return (
                                      <td key={option.score} className="border border-gray-300 dark:border-gray-700 p-2 text-center">
                                        <label className={`flex items-center justify-center p-2 rounded cursor-pointer transition-all ${
                                          isSelected
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                        }`}>
                                          <input
                                            type="radio"
                                            name={subitem.id}
                                            value={option.score}
                                            checked={isSelected}
                                            onChange={() => handleAnswerChange(subitem.id, option.score)}
                                            className="sr-only"
                                            aria-label={`${subitem.text}: ${option.label}`}
                                          />
                                          <span className="text-sm font-medium">{option.label}</span>
                                        </label>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : item.format === 'dual_scale' && item.subitems ? (
                      <div className="space-y-6">
                        {item.subitems.map((subitem) => {
                          const value = answers[subitem.id] ?? 0;
                          const isAnswered = answers[subitem.id] !== undefined;
                          return (
                            <div key={subitem.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {subitem.text}
                                {subitem.not_scored && (
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 italic">(não pontuado, apenas para referência)</span>
                                )}
                              </p>
                              <div className="relative mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{subitem.label_left || '0'}</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-400">{subitem.label_right || '10'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {subitem.options.map((option) => {
                                    const isSelected = answers[subitem.id] === option.score;
                                    return (
                                      <button
                                        key={option.score}
                                        type="button"
                                        onClick={() => handleAnswerChange(subitem.id, option.score)}
                                        disabled={subitem.not_scored}
                                        className={`flex-1 h-10 rounded-lg border-2 transition-all ${
                                          isSelected
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                                        } ${subitem.not_scored ? 'opacity-75 cursor-default' : 'cursor-pointer'}`}
                                      >
                                        <span className="text-sm font-medium">{option.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {isAnswered && (
                                  <div className="mt-3 text-center">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Valor selecionado: <span className="text-blue-600 dark:text-blue-400 font-bold">{value}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : is011 ? (
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-6">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Selecione um valor de 0 a 10:
                          </label>
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            aria-label={`Selecionar valor para ${item.text}`}
                            value={value ?? 0}
                            onChange={(e) => handleAnswerChange(item.id, Number(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                            <span>0</span>
                            <span>5</span>
                            <span>10</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-500">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Valor selecionado:</span>
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{value ?? 0}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.options.map((option) => {
                          const isSelected = answers[item.id] === option.score;
                          return (
                            <label
                              key={option.label}
                              className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md'
                                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                              }`}
                            >
                              <input
                                type="radio"
                                name={item.id}
                                value={option.score}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(item.id, option.score)}
                                className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              />
                              <span className={`ml-4 text-base flex-1 ${isSelected ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {option.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        
        <div className="sticky bottom-4 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 border-t-4 border-blue-600 mt-8">
          <button
            type="submit"
            disabled={!currentPageValid}
            className={`w-full text-white font-semibold rounded-lg text-lg px-6 py-4 text-center shadow-lg transform transition-all ${
              currentPageValid
                ? 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {answeredCount === totalItems ? 'Calcular Pontuação' : `Responder ${totalItems - answeredCount} pergunta${totalItems - answeredCount > 1 ? 's' : ''} restante${totalItems - answeredCount > 1 ? 's' : ''}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm;