import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Questionnaire, Item, Patient } from '../types';
import ScoreDisplay from './ScoreDisplay';
import { useAutosave } from '../hooks/useAutosave';
import AutosaveIndicator from './AutosaveIndicator';
import { useIndexedDB } from '../hooks/useIndexedDB';
import { validateItem, calculateQuestionnaireScore } from '../utils/scoringEngine';
import ValidationMessage from './ValidationMessage';
import { useAnalytics } from '../hooks/useAnalytics';
import { useDrafts } from '../hooks/useDrafts';

interface QuestionnaireFormProps {
  questionnaire: Questionnaire;
  patient?: Patient | null;
  onSaved?: (payload: { questionnaireId: string; totalScore: number; isPercent: boolean; answers: { itemId: string; itemText: string; optionLabel?: string; score: number }[] }) => void;
}

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({ questionnaire, patient, onSaved }) => {
  const [answers, setAnswers] = useState<{ [itemId: string]: number }>({});
  const [scoreData, setScoreData] = useState<{ totalScore: number; domainScores: { [key: string]: number } } | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [itemId: string]: string }>({});
  const errorRefs = useRef<{ [itemId: string]: HTMLElement | null }>({});
  const startTimeRef = useRef<number>(Date.now());
  const { track } = useAnalytics();
  const { saveDraft, loadDraftByQuestionnaire, deleteDraft } = useDrafts();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // Exibe todas as perguntas em uma única página

  // Autosave/load answers usando IndexedDB
  const storageKey = `qform_${questionnaire.id}`;
  const [savedAnswers, setSavedAnswers, isInitialized] = useIndexedDB<{ [itemId: string]: number }>({
    store: 'profiles',
    key: storageKey,
    encrypt: false,
    defaultValue: {},
  });

  // Contar total de itens incluindo subitems (precisa estar antes do useEffect)
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

  // Carregar respostas salvas na inicialização (incluindo rascunhos)
  useEffect(() => {
    const loadSavedData = async () => {
      if (!isInitialized) return;

      // Tentar carregar rascunho primeiro
      const draft = await loadDraftByQuestionnaire(questionnaire.id, patient?.id);
      if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
        setAnswers(draft.answers);
        return;
      }

      // Se não houver rascunho, carregar respostas salvas normais
      if (savedAnswers && Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers);
      }
    };

    loadSavedData();
  }, [isInitialized, questionnaire.id, patient?.id, loadDraftByQuestionnaire, savedAnswers]); // Apenas na inicialização

  // Rastrear início do questionário
  useEffect(() => {
    startTimeRef.current = Date.now();
    track('questionnaire_started', {
      questionnaire_id: questionnaire.id,
      questionnaire_name: questionnaire.name,
      questionnaire_items_count: totalItems,
      patient_id: patient?.id,
      patient_age: patient?.idade,
      patient_sex: patient?.sexo,
    });
  }, [questionnaire.id]); // Apenas na montagem inicial

  // Migrar dados do localStorage para IndexedDB (compatibilidade)
  useEffect(() => {
    if (isInitialized && Object.keys(answers).length === 0) {
      try {
        const raw = localStorage.getItem(`qform_${questionnaire.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Object.keys(parsed).length > 0) {
            setAnswers(parsed);
            // Migrar para IndexedDB
            setSavedAnswers(parsed);
            // Remover do localStorage após migração
            localStorage.removeItem(`qform_${questionnaire.id}`);
          }
        }
      } catch (e) {
        console.warn('Erro ao migrar dados do localStorage:', e);
      }
    }
  }, [isInitialized, questionnaire.id, setSavedAnswers]);

  // Autosave com feedback visual
  const { status, lastSaved, error } = useAutosave({
    value: answers,
    debounceMs: 500,
    onSave: async (value) => {
      await setSavedAnswers(value);
      // Rastrear autosave bem-sucedido
      track('autosave_ok', {
        questionnaire_id: questionnaire.id,
        answers_count: Object.keys(value).length,
      });
    },
    onError: (err) => {
      // Rastrear erro no autosave
      track('autosave_error', {
        questionnaire_id: questionnaire.id,
        error_message: err.message,
      });
    },
  });
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted && Object.keys(answers).length > 0) {
        // Rastrear abandono
        const timeSpent = Date.now() - startTimeRef.current;
        const progressPct = Math.round((Object.keys(answers).length / totalItems) * 100);
        const lastItemId = Object.keys(answers).pop() || '';
        
        track('questionnaire_abandoned', {
          questionnaire_id: questionnaire.id,
          progress_pct: progressPct,
          last_item_id: lastItemId,
          time_spent_ms: timeSpent,
        });
        
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [submitted, answers, questionnaire.id, totalItems, track]);


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

  // Calcular estimativa de tempo
  const estimatedMinutes = Math.ceil(totalItems * 0.5); // 0.5 minutos por item
  const remainingItems = totalItems - answeredCount;
  const estimatedRemainingMinutes = Math.ceil(remainingItems * 0.5);

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

  const handleAnswerChange = (itemId: string, score: number, item?: Item) => {
    setAnswers(prev => ({ ...prev, [itemId]: score }));
    
    // Rastrear mudança de resposta
    const timeSpent = Date.now() - startTimeRef.current;
    track('answer_changed', {
      questionnaire_id: questionnaire.id,
      item_id: itemId,
      time_spent_ms: timeSpent,
      progress_pct: Math.round((Object.keys({ ...answers, [itemId]: score }).length / totalItems) * 100),
    });
    
    // Validar imediatamente após mudança
    if (item) {
      const newAnswers = { ...answers, [itemId]: score };
      const validation = validateItem(item, newAnswers);
      
      if (validation.valid) {
        // Remover erro se existir
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[itemId];
          return newErrors;
        });
      } else {
        // Adicionar erro
        setErrors(prev => ({ ...prev, [itemId]: validation.error || 'Erro de validação' }));
      }
    }
  };

  const handleBlur = (itemId: string, item: Item) => {
    // Validar no blur também
    // Se é um subitem, criar um item temporário para validação
    if (item.subitems && item.subitems.length > 0) {
      // Validar o item pai completo
      const validation = validateItem(item, answers);
      if (!validation.valid) {
        // Adicionar erro ao subitem específico
        setErrors(prev => ({ ...prev, [itemId]: validation.error || 'Esta pergunta é obrigatória.' }));
      } else {
        // Remover erro se validado
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[itemId];
          return newErrors;
        });
      }
    } else {
      // Item simples
      const validation = validateItem(item, answers);
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, [itemId]: validation.error || 'Esta pergunta é obrigatória.' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[itemId];
          return newErrors;
        });
      }
    }
  };

  const calculateScore = () => {
    // Usar scoringEngine centralizado
    const result = calculateQuestionnaireScore(questionnaire, answers);
    
    if (result.error) {
      console.error('Erro no cálculo de score:', result.error);
      // Retornar estrutura compatível mesmo em caso de erro
      return {
        totalScore: 0,
        domainScores: {},
      };
    }
    
    return {
      totalScore: result.totalScore,
      domainScores: result.domainScores || {},
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
    
    // Validar todos os itens
    const newErrors: { [itemId: string]: string } = {};
    let firstErrorItemId: string | null = null;
    
    questionnaire.items.forEach(item => {
      const validation = validateItem(item, answers);
      if (!validation.valid) {
        if (item.subitems && item.subitems.length > 0) {
          item.subitems.forEach(sub => {
            if (!sub.not_scored && answers[sub.id] === undefined) {
              newErrors[sub.id] = validation.error || 'Esta pergunta é obrigatória.';
              if (!firstErrorItemId) firstErrorItemId = sub.id;
            }
          });
        } else {
          newErrors[item.id] = validation.error || 'Esta pergunta é obrigatória.';
          if (!firstErrorItemId) firstErrorItemId = item.id;
        }
      }
    });
    
    setErrors(newErrors);
    
    // Se houver erros, scroll para o primeiro
    if (Object.keys(newErrors).length > 0) {
      if (firstErrorItemId && errorRefs.current[firstErrorItemId]) {
        errorRefs.current[firstErrorItemId]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Focar no elemento após scroll
        setTimeout(() => {
          const element = document.querySelector(`[data-item-id="${firstErrorItemId}"]`) as HTMLElement;
          if (element) {
            element.focus();
          }
        }, 300);
      }
      return;
    }
    const result = calculateScore();
    setScoreData(result);
    setSubmitted(true);
    
    // Deletar rascunho se existir (questionário foi completado)
    loadDraftByQuestionnaire(questionnaire.id, patient?.id)
      .then((draft) => {
        if (draft) {
          return deleteDraft(draft.draftId);
        }
      })
      .catch((error) => {
        console.warn('Erro ao deletar rascunho após conclusão:', error);
      });
    
    // Rastrear conclusão do questionário
    const totalTime = Date.now() - startTimeRef.current;
    track('questionnaire_completed', {
      questionnaire_id: questionnaire.id,
      time_spent_ms: totalTime,
      answers_count: Object.keys(answers).length,
      score: result.totalScore,
      progress_pct: 100,
    });
    
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
    
    // Scroll para resultados e focar após renderização
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      // Focar no primeiro elemento dos resultados após scroll
      setTimeout(() => {
        const resultsElement = document.querySelector('[data-results-section]') as HTMLElement;
        if (resultsElement) {
          const firstFocusable = resultsElement.querySelector(
            'button, a, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (firstFocusable) {
            firstFocusable.focus();
          } else {
            resultsElement.focus();
          }
        }
      }, 500);
    }, 100);
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
        <div data-results-section tabIndex={-1} className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
          <ScoreDisplay 
            scoreData={scoreData} 
            scoring={questionnaire.scoring}
            questionnaire={questionnaire}
            answers={answersArrayForDisplay}
            patient={patient}
          />
        </div>
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
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{questionnaire.name} ({questionnaire.acronym})</h2>
          <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {answeredCount === totalItems 
                ? 'Concluído' 
                : remainingItems > 0
                  ? `~${estimatedRemainingMinutes} min restante${estimatedRemainingMinutes !== 1 ? 's' : ''}`
                  : `~${estimatedMinutes} min`}
            </span>
          </div>
        </div>
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
                
                const hasError = item.subitems && item.subitems.length > 0
                  ? item.subitems.some(sub => !sub.not_scored && errors[sub.id])
                  : errors[item.id];
                
                return (
                  <div 
                    key={item.id} 
                    ref={(el) => {
                      if (el && item.id) errorRefs.current[item.id] = el;
                    }}
                    data-item-id={item.id}
                    className={`bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 transition-all ${
                      hasError 
                        ? 'border-l-4 border-red-500' 
                        : isAnswered 
                          ? 'border-l-4 border-green-500' 
                          : 'border-l-4 border-gray-300'
                    }`}
                  >
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
                                            onChange={() => handleAnswerChange(subitem.id, option.score, item)}
                                            onBlur={() => handleBlur(subitem.id, item)}
                                            className="sr-only"
                                            aria-label={`${subitem.text}: ${option.label}`}
                                            aria-describedby={errors[subitem.id] ? `error-${subitem.id}` : undefined}
                                            aria-invalid={!!errors[subitem.id]}
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
                        {hasError && (
                          <ValidationMessage 
                            error={Object.values(errors).find(err => err) || 'Por favor, responda todas as perguntas desta seção.'}
                            itemId={item.id}
                            className="mt-2"
                          />
                        )}
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
                                        onClick={() => handleAnswerChange(subitem.id, option.score, item)}
                                        onBlur={() => handleBlur(subitem.id, item)}
                                        disabled={subitem.not_scored}
                                        data-item-id={subitem.id}
                                        aria-invalid={!!errors[subitem.id]}
                                        aria-describedby={errors[subitem.id] ? `error-${subitem.id}` : undefined}
                                        className={`flex-1 h-10 rounded-lg border-2 transition-all ${
                                          errors[subitem.id]
                                            ? 'border-red-500 dark:border-red-500'
                                            : isSelected
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
                                {errors[subitem.id] && (
                                  <ValidationMessage 
                                    error={errors[subitem.id]}
                                    itemId={subitem.id}
                                    className="mt-2"
                                  />
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
                            aria-invalid={!!errors[item.id]}
                            aria-describedby={errors[item.id] ? `error-${item.id}` : undefined}
                            data-item-id={item.id}
                            value={value ?? 0}
                            onChange={(e) => handleAnswerChange(item.id, Number(e.target.value), item)}
                            onBlur={() => handleBlur(item.id, item)}
                            className={`w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider ${
                              errors[item.id] ? 'border-red-500' : ''
                            }`}
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
                        {errors[item.id] && (
                          <ValidationMessage 
                            error={errors[item.id]}
                            itemId={item.id}
                            className="mt-2"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.options.map((option) => {
                          const isSelected = answers[item.id] === option.score;
                          return (
                            <label
                              key={option.label}
                              className={`flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                errors[item.id]
                                  ? 'border-red-500 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20'
                                  : isSelected
                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md'
                                    : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                              }`}
                            >
                              <input
                                type="radio"
                                name={item.id}
                                value={option.score}
                                checked={isSelected}
                                onChange={() => handleAnswerChange(item.id, option.score, item)}
                                onBlur={() => handleBlur(item.id, item)}
                                aria-invalid={!!errors[item.id]}
                                aria-describedby={errors[item.id] ? `error-${item.id}` : undefined}
                                data-item-id={item.id}
                                className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              />
                              <span className={`ml-4 text-base flex-1 ${isSelected ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                {option.label}
                              </span>
                            </label>
                          );
                        })}
                        {errors[item.id] && (
                          <ValidationMessage 
                            error={errors[item.id]}
                            itemId={item.id}
                            className="mt-2"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        
        <div className="sticky bottom-4 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-4 border-t-4 border-blue-600 mt-8">
          <div className="flex items-center justify-between mb-3">
            <AutosaveIndicator
              status={status}
              lastSaved={lastSaved}
              error={error}
              className="text-sm"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                setIsSavingDraft(true);
                try {
                  const progress = Math.round((answeredCount / totalItems) * 100);
                  await saveDraft(questionnaire.id, answers, patient?.id, progress);
                  track('questionnaire_draft_saved', {
                    questionnaire_id: questionnaire.id,
                    progress_pct: progress,
                  });
                  alert('Rascunho salvo com sucesso! Você pode continuar depois.');
                } catch (error) {
                  console.error('Erro ao salvar rascunho:', error);
                  alert('Erro ao salvar rascunho. Tente novamente.');
                } finally {
                  setIsSavingDraft(false);
                }
              }}
              disabled={isSavingDraft || Object.keys(answers).length === 0}
              className={`px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2 ${
                isSavingDraft ? 'cursor-wait' : ''
              }`}
            >
              {isSavingDraft ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Salvar Rascunho
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={!currentPageValid}
              className={`flex-1 text-white font-semibold rounded-lg text-lg px-6 py-4 text-center shadow-lg transform transition-all ${
                currentPageValid
                  ? 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {answeredCount === totalItems ? 'Calcular Pontuação' : `Responder ${totalItems - answeredCount} pergunta${totalItems - answeredCount > 1 ? 's' : ''} restante${totalItems - answeredCount > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionnaireForm;