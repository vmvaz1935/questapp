import React, { useState } from 'react';

interface ConsentLGPDProps {
  onAccept: () => void;
  onDecline?: () => void;
}

const ConsentLGPD: React.FC<ConsentLGPDProps> = ({ onAccept, onDecline }) => {
  const [consents, setConsents] = useState({
    dataCollection: false,
    dataTreatment: false,
    privacyPolicy: false,
  });

  const allAccepted = consents.dataCollection && consents.dataTreatment && consents.privacyPolicy;

  const handleAccept = () => {
    if (allAccepted) {
      localStorage.setItem('lgpd_consent', JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        consents,
      }));
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🔒</span>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Consentimento LGPD - Proteção de Dados
            </h2>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              <strong>Importante:</strong> Esta aplicação coleta e armazena dados pessoais e de saúde. 
              Para continuar utilizando o sistema, é necessário aceitar os termos de tratamento de dados 
              conforme a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent1"
                checked={consents.dataCollection}
                onChange={(e) => setConsents(prev => ({ ...prev, dataCollection: e.target.checked }))}
                className="mt-1 mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="consent1" className="text-gray-700 dark:text-gray-300">
                <strong>Coleta de Dados:</strong> Concordo com a coleta dos meus dados pessoais e dos dados 
                dos meus pacientes (nome, idade, sexo, diagnóstico, respostas a questionários, etc.) para 
                fins de avaliação clínica e geração de relatórios.
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent2"
                checked={consents.dataTreatment}
                onChange={(e) => setConsents(prev => ({ ...prev, dataTreatment: e.target.checked }))}
                className="mt-1 mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="consent2" className="text-gray-700 dark:text-gray-300">
                <strong>Tratamento de Dados:</strong> Concordo com o tratamento e armazenamento local dos dados 
                no navegador, entendendo que as informações permanecerão sob meu controle e não serão 
                compartilhadas com terceiros.
              </label>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="consent3"
                checked={consents.privacyPolicy}
                onChange={(e) => setConsents(prev => ({ ...prev, privacyPolicy: e.target.checked }))}
                className="mt-1 mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="consent3" className="text-gray-700 dark:text-gray-300">
                <strong>Política de Privacidade:</strong> Li e concordo com a Política de Privacidade e 
                Proteção de Dados, incluindo os direitos garantidos pela LGPD (acesso, correção, exclusão, etc.).
              </label>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500 mb-6">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>⚠️ Atenção:</strong> Você pode revogar seu consentimento a qualquer momento. 
              Todos os dados são armazenados localmente no seu navegador e podem ser excluídos através 
              das configurações do navegador ou da aplicação.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            {onDecline && (
              <button
                onClick={onDecline}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Recusar
              </button>
            )}
            <button
              onClick={handleAccept}
              disabled={!allAccepted}
              className={`px-6 py-2 rounded-lg font-medium ${
                allAccepted
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Aceitar e Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentLGPD;

