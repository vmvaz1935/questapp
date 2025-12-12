import React, { useState } from 'react';
import { 
  validateFirebaseConfigWithGemini, 
  generateFirebaseSetupInstructions,
  generateFirebaseConfigCode 
} from '../services/geminiFirebaseConfig';

interface FirebaseConfigHelperProps {
  onConfigGenerated?: (config: string) => void;
}

const FirebaseConfigHelper: React.FC<FirebaseConfigHelperProps> = ({ onConfigGenerated }) => {
  const [projectName, setProjectName] = useState<string>('FisioQ');
  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [authDomain, setAuthDomain] = useState<string>('');
  const [storageBucket, setStorageBucket] = useState<string>('');
  const [messagingSenderId, setMessagingSenderId] = useState<string>('');
  const [appId, setAppId] = useState<string>('');
  
  const [validationResult, setValidationResult] = useState<any>(null);
  const [instructions, setInstructions] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'validate' | 'instructions' | 'generate'>('validate');

  const handleValidate = async () => {
    setIsLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const result = await validateFirebaseConfigWithGemini({
        projectName,
        apiKey,
        projectId,
        authDomain,
        storageBucket,
        messagingSenderId,
        appId,
      });
      setValidationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao validar configuração');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInstructions = async () => {
    setIsLoading(true);
    setError('');
    setInstructions('');

    try {
      const result = await generateFirebaseSetupInstructions(
        projectName,
        'autenticação com Google e sincronização de dados no Firestore'
      );
      setInstructions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar instruções');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError('');
    setGeneratedCode('');

    try {
      const config = {
        projectName,
        apiKey: apiKey || 'YOUR_API_KEY',
        projectId: projectId || 'YOUR_PROJECT_ID',
        authDomain: authDomain || 'YOUR_PROJECT_ID.firebaseapp.com',
        storageBucket: storageBucket || 'YOUR_PROJECT_ID.appspot.com',
        messagingSenderId: messagingSenderId || 'YOUR_MESSAGING_SENDER_ID',
        appId: appId || 'YOUR_APP_ID',
      };

      const code = await generateFirebaseConfigCode(config);
      setGeneratedCode(code);
      
      if (onConfigGenerated) {
        onConfigGenerated(code);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar código');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
        🔥 Configuração do Firebase com Gemini AI
      </h2>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('validate')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'validate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Validar Configuração
        </button>
        <button
          onClick={() => setActiveTab('instructions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'instructions'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Gerar Instruções
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'generate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          Gerar Código
        </button>
      </div>

      {/* Formulário de Configuração */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome do Projeto
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="FisioQ"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="AIza..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="meu-projeto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Auth Domain
          </label>
          <input
            type="text"
            value={authDomain}
            onChange={(e) => setAuthDomain(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="meu-projeto.firebaseapp.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Storage Bucket
          </label>
          <input
            type="text"
            value={storageBucket}
            onChange={(e) => setStorageBucket(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="meu-projeto.appspot.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Messaging Sender ID
          </label>
          <input
            type="text"
            value={messagingSenderId}
            onChange={(e) => setMessagingSenderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="123456789"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            App ID
          </label>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="1:123456789:web:abc123"
          />
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Conteúdo das Tabs */}
      <div className="mt-6">
        {activeTab === 'validate' && (
          <div>
            <button
              onClick={handleValidate}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Validando...' : 'Validar Configuração com Gemini'}
            </button>
            
            {validationResult && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                <h3 className="font-bold text-lg mb-2">
                  {validationResult.isValid ? '✅ Configuração Válida' : '❌ Configuração Inválida'}
                </h3>
                
                {validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Erros:</h4>
                    <ul className="list-disc list-inside">
                      {validationResult.errors.map((err: string, idx: number) => (
                        <li key={idx} className="text-red-600">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.instructions && validationResult.instructions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Instruções:</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {validationResult.instructions.map((inst: string, idx: number) => (
                        <li key={idx}>{inst}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {validationResult.securityRecommendations && validationResult.securityRecommendations.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Recomendações de Segurança:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {validationResult.securityRecommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'instructions' && (
          <div>
            <button
              onClick={handleGenerateInstructions}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Gerando Instruções...' : 'Gerar Instruções com Gemini'}
            </button>
            
            {instructions && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div className="whitespace-pre-wrap text-sm">{instructions}</div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'generate' && (
          <div>
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Gerando Código...' : 'Gerar Código TypeScript com Gemini'}
            </button>
            
            {generatedCode && (
              <div className="mt-4">
                <textarea
                  value={generatedCode}
                  readOnly
                  className="w-full h-96 px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    alert('Código copiado para a área de transferência!');
                  }}
                  className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Copiar Código
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseConfigHelper;

