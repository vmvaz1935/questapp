
import React, { useState } from 'react';
import { Questionnaire } from '../types';
import QuestionnaireForm from './QuestionnaireForm';

interface UserViewProps {
  questionnaires: Questionnaire[];
}

const UserView: React.FC<UserViewProps> = ({ questionnaires }) => {
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string>('');
  
  const selectedQuestionnaire = questionnaires.find(q => q.id === selectedQuestionnaireId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white">Portal do Paciente</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Selecione e preencha um questionário clínico.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 md:p-8">
        {questionnaires.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum questionário publicado ainda. Peça a um administrador para adicionar um.
          </p>
        ) : (
          <div>
            <label htmlFor="questionnaire-select" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Selecione um Questionário</label>
            <select
              id="questionnaire-select"
              value={selectedQuestionnaireId}
              onChange={(e) => setSelectedQuestionnaireId(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">-- Escolha um questionário --</option>
              {questionnaires.map(q => (
                <option key={q.id} value={q.id}>{q.name} ({q.acronym})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedQuestionnaire && <QuestionnaireForm questionnaire={selectedQuestionnaire} />}
    </div>
  );
};

export default UserView;
