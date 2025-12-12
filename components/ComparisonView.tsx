import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { Patient, Questionnaire } from '../types';
import EvolutionChart from './EvolutionChart';

interface ComparisonViewProps {
  questionnaires: Questionnaire[];
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ questionnaires }) => {
  const { professionalId } = useAuth();
  const patientsKey = professionalId ? `patients_${professionalId}` : 'patients';
  const resultsKey = professionalId ? `results_${professionalId}` : 'results';
  const [patients] = useLocalStorage<Patient[]>(patientsKey, []);
  const [results] = useLocalStorage<any[]>(resultsKey, []);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | '30' | '90' | '180' | '365'>('all');

  const qMap = useMemo(() => Object.fromEntries(questionnaires.map(q => [q.id, q])), [questionnaires]);
  
  // Filtrar resultados do mesmo questionário para o paciente selecionado
  const comparisonResults = useMemo(() => {
    if (!selectedPatientId || !selectedQuestionnaireId) return [];
    
    const now = Date.now();
    const filterDays: Record<string, number> = {
      '30': 30,
      '90': 90,
      '180': 180,
      '365': 365,
      'all': Infinity,
    };
    const daysLimit = filterDays[dateFilter] || Infinity;
    const cutoffDate = now - daysLimit * 24 * 60 * 60 * 1000;
    
    return results
      .filter(r => {
        if (r.patientId !== selectedPatientId || r.questionnaireId !== selectedQuestionnaireId) return false;
        if (dateFilter !== 'all') {
          const resultDate = new Date(r.createdAt || 0).getTime();
          return resultDate >= cutoffDate;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
  }, [results, selectedPatientId, selectedQuestionnaireId, dateFilter]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaireId);

  const percentFrom = (r: any) => {
    if (!selectedQuestionnaire) return undefined;
    const max = selectedQuestionnaire.scoring?.range?.max ?? 100;
    if (r.isPercent) return Math.max(0, Math.min(100, r.totalScore));
    if (typeof r.totalScore === 'number' && max > 0) return (r.totalScore / max) * 100;
    return undefined;
  };

  // Calcular diferença percentual entre primeira e última avaliação
  const evolution = useMemo(() => {
    if (comparisonResults.length < 2) return null;
    const first = percentFrom(comparisonResults[0]);
    const last = percentFrom(comparisonResults[comparisonResults.length - 1]);
    if (first === undefined || last === undefined) return null;
    const diff = last - first;
    const diffPct = first !== 0 ? ((diff / first) * 100) : 0;
    
    // Calcular média de todas as avaliações
    const allPercents = comparisonResults.map(r => percentFrom(r)).filter((p): p is number => p !== undefined);
    const average = allPercents.length > 0 
      ? allPercents.reduce((sum, p) => sum + p, 0) / allPercents.length 
      : 0;
    
    // Calcular tendência (melhora ou piora)
    const recent = comparisonResults.slice(-3).map(r => percentFrom(r)).filter((p): p is number => p !== undefined);
    const older = comparisonResults.slice(0, Math.min(3, comparisonResults.length - recent.length))
      .map(r => percentFrom(r)).filter((p): p is number => p !== undefined);
    const recentAvg = recent.length > 0 ? recent.reduce((sum, p) => sum + p, 0) / recent.length : 0;
    const olderAvg = older.length > 0 ? older.reduce((sum, p) => sum + p, 0) / older.length : 0;
    const trend = recentAvg - olderAvg;
    
    return { first, last, diff, diffPct, average, trend };
  }, [comparisonResults, selectedQuestionnaire]);

  // Preparar dados para gráfico de linha
  const chartData = useMemo(() => {
    return comparisonResults.map((r, idx) => {
      const date = new Date(r.createdAt || Date.now());
      const pct = percentFrom(r);
      return {
        date: date.toLocaleDateString('pt-BR'),
        dateTime: date.getTime(),
        score: r.totalScore,
        percent: pct ?? 0,
        index: idx,
      };
    });
  }, [comparisonResults, selectedQuestionnaire]);

  // Dimensões do gráfico
  const chartWidth = 600;
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };

  // Calcular pontos do gráfico de linha
  const getChartPoints = () => {
    if (chartData.length === 0) return '';
    const minX = chartData[0].dateTime;
    const maxX = chartData[chartData.length - 1].dateTime;
    const rangeX = maxX - minX || 1;
    const minY = 0;
    const maxY = 100;
    const rangeY = maxY - minY || 1;

    const points = chartData.map((d, i) => {
      const x = padding.left + ((d.dateTime - minX) / rangeX) * (chartWidth - padding.left - padding.right);
      const y = padding.top + (chartHeight - padding.top - padding.bottom) - ((d.percent - minY) / rangeY) * (chartHeight - padding.top - padding.bottom);
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  const chartPath = getChartPoints();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Comparar Resultados</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Paciente</label>
            <select
              value={selectedPatientId}
              onChange={e => {
                setSelectedPatientId(e.target.value);
                setSelectedQuestionnaireId(''); // Reset questionário ao mudar paciente
              }}
              className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700 dark:text-white"
            >
              <option value="">-- Selecione um paciente --</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.nome} • {p.idade} anos</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Questionário</label>
            <select
              value={selectedQuestionnaireId}
              onChange={e => setSelectedQuestionnaireId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700 dark:text-white"
              disabled={!selectedPatientId}
            >
              <option value="">-- Selecione um questionário --</option>
              {questionnaires.map(q => (
                <option key={q.id} value={q.id}>{q.name} ({q.acronym})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedPatient && selectedQuestionnaire && comparisonResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {selectedQuestionnaire.name} ({selectedQuestionnaire.acronym})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Paciente: <span className="font-medium">{selectedPatient.nome}</span> • {selectedPatient.idade} anos
            </p>
          </div>

          {/* Filtros de período */}
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400">Período:</span>
            {(['all', '30', '90', '180', '365'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setDateFilter(period)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  dateFilter === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period === 'all' ? 'Todos' : `Últimos ${period} dias`}
              </button>
            ))}
          </div>

          {/* Resumo da evolução */}
          {evolution && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Resumo da Evolução</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Primeira avaliação</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{evolution.first.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Última avaliação</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{evolution.last.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Média geral</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{evolution.average.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Diferença absoluta</p>
                  <p className={`text-lg font-bold ${evolution.diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {evolution.diff >= 0 ? '+' : ''}{evolution.diff.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Variação percentual</p>
                  <p className={`text-lg font-bold ${evolution.diffPct >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {evolution.diffPct >= 0 ? '+' : ''}{evolution.diffPct.toFixed(2)}%
                  </p>
                </div>
              </div>
              {evolution.trend !== 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Tendência recente</p>
                  <p className={`text-sm font-medium ${evolution.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {evolution.trend >= 0 ? '↗' : '↘'} {evolution.trend >= 0 ? 'Melhora' : 'Piora'} de {Math.abs(evolution.trend).toFixed(2)}% nas últimas avaliações
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Gráfico de linha melhorado */}
          {chartData.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Evolução Temporal</h4>
              <EvolutionChart
                data={chartData}
                width={800}
                height={400}
                showGrid={true}
                showPoints={true}
                label={`Evolução - ${selectedQuestionnaire.acronym}`}
              />
            </div>
          )}

          {/* Tabela comparativa melhorada */}
          <div className="overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800 dark:text-white">Resultados Detalhados</h4>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {comparisonResults.length} avaliação(ões) encontrada(s)
              </span>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="border-b border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">#</th>
                    <th className="border-b border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Data</th>
                    <th className="border-b border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Pontuação Total</th>
                    <th className="border-b border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Percentual</th>
                    <th className="border-b border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Diferença vs. Anterior</th>
                    <th className="border-b border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Diferença vs. Primeira</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((r, idx) => {
                    const date = new Date(r.createdAt || Date.now());
                    const pct = percentFrom(r);
                    const prevPct = idx > 0 ? percentFrom(comparisonResults[idx - 1]) : undefined;
                    const diff = prevPct !== undefined && pct !== undefined ? pct - prevPct : undefined;
                    const firstPct = percentFrom(comparisonResults[0]);
                    const diffFromFirst = firstPct !== undefined && pct !== undefined ? pct - firstPct : undefined;

                    return (
                      <tr
                        key={idx}
                        className={`${
                          idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'
                        } hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                      >
                        <td className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
                          <div className="font-medium">{date.toLocaleDateString('pt-BR')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
                          {typeof r.totalScore === 'number' ? r.totalScore.toFixed(2) : '-'}
                          {r.isPercent ? '%' : ''}
                        </td>
                        <td className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {pct !== undefined ? `${pct.toFixed(2)}%` : '-'}
                        </td>
                        <td className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm">
                          {diff !== undefined ? (
                            <span className={`font-medium ${diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {diff >= 0 ? '↗ +' : '↘ '}{diff.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="border-b border-gray-200 dark:border-gray-700 p-3 text-sm">
                          {diffFromFirst !== undefined ? (
                            <span className={`font-medium ${diffFromFirst >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {diffFromFirst >= 0 ? '↗ +' : '↘ '}{diffFromFirst.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedPatient && selectedQuestionnaire && comparisonResults.length === 0 && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Nenhum resultado encontrado para este questionário e paciente. Preencha o questionário primeiro.
          </p>
        </div>
      )}

      {!selectedPatientId && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Selecione um paciente e um questionário para comparar resultados em datas distintas.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;

