import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { Patient, Questionnaire } from '../types';

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

  const qMap = useMemo(() => Object.fromEntries(questionnaires.map(q => [q.id, q])), [questionnaires]);
  
  // Filtrar resultados do mesmo questionário para o paciente selecionado
  const comparisonResults = useMemo(() => {
    if (!selectedPatientId || !selectedQuestionnaireId) return [];
    return results
      .filter(r => r.patientId === selectedPatientId && r.questionnaireId === selectedQuestionnaireId)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
  }, [results, selectedPatientId, selectedQuestionnaireId]);

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
    return { first, last, diff, diffPct };
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

          {/* Resumo da evolução */}
          {evolution && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-3">Evolução</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Primeira avaliação</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{evolution.first.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Última avaliação</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{evolution.last.toFixed(2)}%</p>
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
            </div>
          )}

          {/* Gráfico de linha */}
          {chartData.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Evolução Temporal</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mx-auto">
                  {/* Eixos */}
                  <line
                    x1={padding.left}
                    y1={padding.top}
                    x2={padding.left}
                    y2={chartHeight - padding.bottom}
                    stroke="#6B7280"
                    strokeWidth="2"
                  />
                  <line
                    x1={padding.left}
                    y1={chartHeight - padding.bottom}
                    x2={chartWidth - padding.right}
                    y2={chartHeight - padding.bottom}
                    stroke="#6B7280"
                    strokeWidth="2"
                  />

                  {/* Grade horizontal */}
                  {[0, 25, 50, 75, 100].map(val => {
                    const y = padding.top + (chartHeight - padding.top - padding.bottom) - ((val - 0) / 100) * (chartHeight - padding.top - padding.bottom);
                    return (
                      <g key={val}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                        />
                        <text
                          x={padding.left - 10}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#6B7280"
                        >
                          {val}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Linha do gráfico */}
                  {chartData.length > 1 && chartPath && (
                    <polyline
                      points={chartPath}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="3"
                    />
                  )}

                  {/* Pontos do gráfico */}
                  {chartData.map((d, i) => {
                    const minX = chartData[0].dateTime;
                    const maxX = chartData[chartData.length - 1].dateTime;
                    const rangeX = maxX - minX || 1;
                    const x = padding.left + ((d.dateTime - minX) / rangeX) * (chartWidth - padding.left - padding.right);
                    const y = padding.top + (chartHeight - padding.top - padding.bottom) - ((d.percent - 0) / 100) * (chartHeight - padding.top - padding.bottom);
                    return (
                      <g key={i}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#2563EB"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={chartHeight - padding.bottom + 20}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#6B7280"
                          transform={`rotate(-45 ${x} ${chartHeight - padding.bottom + 20})`}
                        >
                          {d.date}
                        </text>
                        <title>{`${d.date}: ${d.percent.toFixed(2)}%`}</title>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}

          {/* Tabela comparativa */}
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-4">Resultados Detalhados</h4>
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Data</th>
                  <th className="border border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Pontuação Total</th>
                  <th className="border border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Percentual</th>
                  <th className="border border-gray-300 dark:border-gray-700 p-3 text-left text-sm font-semibold text-gray-800 dark:text-white">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResults.map((r, idx) => {
                  const date = new Date(r.createdAt || Date.now());
                  const pct = percentFrom(r);
                  const prevPct = idx > 0 ? percentFrom(comparisonResults[idx - 1]) : undefined;
                  const diff = prevPct !== undefined && pct !== undefined ? pct - prevPct : undefined;

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
                        {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
                        {typeof r.totalScore === 'number' ? r.totalScore.toFixed(2) : '-'}
                        {r.isPercent ? '%' : ''}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {pct !== undefined ? `${pct.toFixed(2)}%` : '-'}
                      </td>
                      <td className="border border-gray-300 dark:border-gray-700 p-3 text-sm">
                        {diff !== undefined ? (
                          <span className={diff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(2)}%
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

