import React, { useMemo } from 'react';
import { Questionnaire } from '../types';
import { validateAll } from '../utils/validateQuestionnaires';

const Badge: React.FC<{ kind: 'ok' | 'warn' | 'err'; children: React.ReactNode }>
  = ({ kind, children }) => (
  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
    kind==='ok' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    : kind==='warn' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }`}>{children}</span>
);

const ValidateView: React.FC<{ questionnaires: Questionnaire[] }> = ({ questionnaires }) => {
  const results = useMemo(() => validateAll(questionnaires), [questionnaires]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Validação de Questionários</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Checagem automática de estrutura, itens, opções, domínios, fórmulas e faixas.</p>
      </div>

      <div className="space-y-4">
        {results.map(r => {
          const errors = r.issues.filter(i=>i.type==='error');
          const warnings = r.issues.filter(i=>i.type==='warning');
          const ok = errors.length===0 && warnings.length===0;
          return (
            <div key={r.questionnaireId} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{r.name} ({r.acronym})</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">ID: {r.questionnaireId}</p>
                </div>
                <div className="space-x-2">
                  {ok && <Badge kind="ok">OK</Badge>}
                  {errors.length>0 && <Badge kind="err">{errors.length} erro(s)</Badge>}
                  {warnings.length>0 && <Badge kind="warn">{warnings.length} aviso(s)</Badge>}
                </div>
              </div>
              {(errors.length>0 || warnings.length>0) && (
                <ul className="mt-3 list-disc ml-5 text-sm text-gray-700 dark:text-gray-200">
                  {r.issues.map((iss, idx)=> (
                    <li key={idx} className={iss.type==='error'?'text-red-600 dark:text-red-400': 'text-yellow-700 dark:text-yellow-300'}>
                      {iss.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ValidateView;


