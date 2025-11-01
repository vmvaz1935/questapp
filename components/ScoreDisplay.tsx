
import React, { useMemo } from 'react';
import { Scoring, Questionnaire, Patient } from '../types';
import { analyzeResults } from '../utils/resultAnalysis';
import CollapsibleTabs from './CollapsibleTabs';

interface ScoreDisplayProps {
  scoreData: {
    totalScore: number;
    domainScores: { [key: string]: number };
  };
  scoring: Scoring;
  questionnaire: Questionnaire;
  answers: Array<{ itemId: string; itemText: string; optionLabel?: string; score: number }>;
  patient?: Patient | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scoreData, scoring, questionnaire, answers, patient }) => {
  const analysis = useMemo(() => {
    try {
      if (!questionnaire || !answers || answers.length === 0) {
        return { positive: [], negative: [] };
      }
      return analyzeResults(questionnaire, answers);
    } catch (error) {
      console.error('Erro ao analisar resultados:', error);
      return { positive: [], negative: [] };
    }
  }, [questionnaire, answers]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 md:p-8 mt-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-4">Seu Resultado</h2>
      
      {/* Informações do Paciente */}
      {patient && (
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Informações do Paciente</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-medium">Nome:</span> {patient.nome}
            </div>
            <div>
              <span className="font-medium">Idade:</span> {patient.idade} anos
            </div>
            <div>
              <span className="font-medium">Sexo:</span> {patient.sexo}
            </div>
            {patient.ladoAcometido && patient.ladoAcometido !== 'Não se aplica' && (
              <div>
                <span className="font-medium">Lado Acometido:</span> {patient.ladoAcometido}
              </div>
            )}
            <div className="md:col-span-2">
              <span className="font-medium">Diagnóstico:</span> {patient.diagnostico || '-'}
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center mb-6">
        <p className="text-lg text-gray-600 dark:text-gray-300">Pontuação Total Final</p>
        <p className="text-7xl font-extrabold text-gray-800 dark:text-white my-2">
          {scoreData.totalScore.toFixed(2)}{scoring.range.max === 100 ? '%' : ''}
        </p>
        <p className="text-gray-500 dark:text-gray-400">
          (Intervalo: {scoring.range.min} - {scoring.range.max})
        </p>
      </div>
      
      {Object.keys(scoreData.domainScores).length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3 border-b pb-2">Pontuações por Domínio</h3>
          <ul className="space-y-2">
            {Object.entries(scoreData.domainScores).map(([domain, score]) => (
              <li key={domain} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <span className="font-medium text-gray-800 dark:text-gray-100">{domain}</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{Number(score).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pontos Pertinentes Positivos */}
      {analysis.positive.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-3 border-b border-green-300 dark:border-green-700 pb-2 flex items-center gap-2">
            <span className="text-2xl">✓</span>
            Pontos Pertinentes Positivos
          </h3>
          <ul className="space-y-2">
            {analysis.positive.map((point, idx) => (
              <li key={idx} className="flex items-start bg-green-50 dark:bg-green-900/30 p-3 rounded-md border-l-4 border-green-500">
                <span className="text-green-600 dark:text-green-400 mr-2 mt-0.5">•</span>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pontos Pertinentes Negativos */}
      {analysis.negative.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-3 border-b border-red-300 dark:border-red-700 pb-2 flex items-center gap-2">
            <span className="text-2xl">⚠</span>
            Pontos Pertinentes Negativos
          </h3>
          <ul className="space-y-2">
            {analysis.negative.map((point, idx) => (
              <li key={idx} className="flex items-start bg-red-50 dark:bg-red-900/30 p-3 rounded-md border-l-4 border-red-500">
                <span className="text-red-600 dark:text-red-400 mr-2 mt-0.5">•</span>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Valores normativos e interpretação</h3>
        <p className="text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          {scoring.interpretation}
        </p>
      </div>

      {/* Abas Retráteis com Informações Adicionais */}
      {questionnaire?.metadata && (
        <div className="mt-8">
          <CollapsibleTabs
            tabs={[
              {
                id: 'about_score',
                title: 'Sobre a Pontuação',
                content: (
                  <div className="space-y-3">
                    {questionnaire.metadata.about_score && (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {questionnaire.metadata.about_score}
                      </p>
                    )}
                    {questionnaire.metadata.translation_cultural_adaptation && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tradução e Adaptação Cultural</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Idioma original:</strong> {questionnaire.metadata.translation_cultural_adaptation.original_language || '-'}</p>
                          <p><strong>Idioma de destino:</strong> {questionnaire.metadata.translation_cultural_adaptation.target_language || '-'}</p>
                          <p><strong>Ano de adaptação:</strong> {questionnaire.metadata.translation_cultural_adaptation.adaptation_year || '-'}</p>
                          <p><strong>Autores da adaptação:</strong> {questionnaire.metadata.translation_cultural_adaptation.adaptation_authors || '-'}</p>
                          {questionnaire.metadata.translation_cultural_adaptation.process && (
                            <div className="mt-3">
                              <p className="font-medium mb-2">Processo de adaptação:</p>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {questionnaire.metadata.translation_cultural_adaptation.process}
                              </p>
                            </div>
                          )}
                          {questionnaire.metadata.translation_cultural_adaptation.validation_study && (
                            <div className="mt-3">
                              <p className="font-medium mb-2">Estudo de validação:</p>
                              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {questionnaire.metadata.translation_cultural_adaptation.validation_study}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              },
              {
                id: 'literature',
                title: 'Literatura de Apoio',
                content: (
                  <div className="space-y-4">
                    {questionnaire.metadata.supporting_literature && questionnaire.metadata.supporting_literature.length > 0 ? (
                      questionnaire.metadata.supporting_literature.map((lit: any, idx: number) => (
                        <div key={idx} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                          {lit.type && (
                            <p className="font-semibold text-gray-900 dark:text-white mb-2">{lit.type}</p>
                          )}
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                            {lit.citation || '-'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">Não há literatura de apoio disponível.</p>
                    )}
                  </div>
                )
              },
              {
                id: 'developer',
                title: 'Sobre o Desenvolvedor da Pontuação',
                content: (
                  <div className="space-y-3">
                    {questionnaire.metadata.about_developer ? (
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {questionnaire.metadata.about_developer}
                      </p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">Informações sobre o desenvolvedor não disponíveis.</p>
                    )}
                  </div>
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
