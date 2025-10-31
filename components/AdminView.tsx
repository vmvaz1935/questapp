
import React, { useState, useCallback } from 'react';
import { Questionnaire } from '../types';
import { parseMarkdownToQuestionnaire } from '../services/geminiService';
import { UploadIcon, AiIcon, CheckCircleIcon } from './icons';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useAuth } from '../context/AuthContext';
import PaymentModal from './PaymentModal';
import useLocalStorage from '../hooks/useLocalStorage';

interface AdminViewProps {
  addQuestionnaire: (q: Questionnaire) => void;
}

const AdminView: React.FC<AdminViewProps> = ({ addQuestionnaire }) => {
  const { professionalId } = useAuth();
  const [questionnaires] = useLocalStorage<Questionnaire[]>('published_questionnaires', []);
  const { plan, maxQuestionnaires, canAddQuestionnaire } = usePlanLimits();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [markdownText, setMarkdownText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdownText(e.target?.result as string);
        setGeneratedJson('');
        setError('');
        setSuccessMessage('');
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = useCallback(async () => {
    if (!markdownText) {
      setError('Por favor, carregue um arquivo Markdown primeiro.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    setGeneratedJson('');

    try {
      const jsonString = await parseMarkdownToQuestionnaire(markdownText, fileName);
      setGeneratedJson(jsonString);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, [markdownText, fileName]);

  const handlePublish = () => {
    if (!generatedJson) {
      setError('Nenhum JSON para publicar. Processe um arquivo primeiro.');
      return;
    }
    
    // Verificar limite do plano (contar apenas questionários gerados pelo usuário, não os pré-carregados)
    // Questionários pré-carregados têm IDs gerados com timestamp, então vamos contar apenas os criados via AdminView
    const userGeneratedCount = questionnaires.filter(q => q.id && !q.id.match(/^[A-Z]+-\d+-[a-z0-9]+$/)).length;
    
    if (!canAddQuestionnaire(userGeneratedCount)) {
      if (plan === 'free') {
        const upgrade = confirm(`Você atingiu o limite do plano gratuito (${maxQuestionnaires} questionários gerados).\n\nDeseja fazer upgrade para o Plano Pro (R$ 50,00/mês) para questionários ilimitados?`);
        if (upgrade) {
          setShowPaymentModal(true);
        }
      } else {
        alert('Limite de questionários atingido. Faça upgrade para o Plano Pro.');
      }
      return;
    }
    
    try {
      const questionnaireData = JSON.parse(generatedJson);
      const newQuestionnaire: Questionnaire = {
          ...questionnaireData,
          id: `${questionnaireData.acronym}-${Date.now()}` // Add a unique ID
      };
      addQuestionnaire(newQuestionnaire);
      setSuccessMessage(`Questionário "${newQuestionnaire.name}" publicado com sucesso!`);
      // Reset state
      setMarkdownText('');
      setFileName('');
      setGeneratedJson('');
      setError('');
    } catch (err) {
      setError('O JSON é inválido. Por favor, corrija antes de publicar.');
    }
  };

  const handlePaymentSuccess = () => {
    // Atualizar plano para Pro após pagamento bem-sucedido
    const planKey = `user_plan_${professionalId}`;
    localStorage.setItem(planKey, JSON.stringify('pro'));
    window.location.reload(); // Recarregar para aplicar o novo plano
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white">Painel do Administrador</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Transforme questionários de Markdown em formulários web interativos.</p>
        
        {/* Plano e uso */}
        <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            plan === 'pro' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}>
            Plano: {plan === 'pro' ? 'Pro' : 'Gratuito'}
          </div>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Questionários gerados: {questionnaires.filter(q => q.id && !q.id.match(/^[A-Z]+-\d+-[a-z0-9]+$/)).length} / {maxQuestionnaires === null ? '∞' : maxQuestionnaires}
            </span>
          </div>
          {plan === 'free' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
            >
              Upgrade para Pro
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1 & 2 */}
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="bg-blue-600 text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">1</span>
                Carregar Questionário
                </h2>
                <div className="mt-4">
                    <label htmlFor="md-upload" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Arquivo Markdown (.md)</label>
                    <input 
                        id="md-upload"
                        type="file" 
                        accept=".md,.markdown,.txt"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" 
                    />
                    {fileName && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Arquivo selecionado: {fileName}</p>}
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                <span className="bg-blue-600 text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">2</span>
                Processar com IA
                </h2>
                <button 
                    onClick={handleProcess}
                    disabled={!markdownText || isLoading}
                    className="mt-4 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <AiIcon className="w-5 h-5 mr-2 -ml-1" />
                    {isLoading ? 'Processando...' : 'Analisar e Extrair Lógica'}
                </button>
            </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 relative">
             <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center mb-4">
                <span className="bg-blue-600 text-white rounded-full h-8 w-8 text-lg font-bold flex items-center justify-center mr-3">3</span>
                Revisar e Publicar
             </h2>
             {isLoading && (
                 <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center rounded-xl">
                     <div className="text-white text-lg font-semibold">Gerando JSON com Gemini...</div>
                 </div>
             )}
            
             <div className="h-full flex flex-col">
                <label htmlFor="json-output" className="block text-sm font-medium text-gray-700 dark:text-gray-300">JSON Gerado (editável)</label>
                <textarea
                    id="json-output"
                    value={generatedJson}
                    onChange={(e) => setGeneratedJson(e.target.value)}
                    placeholder="O JSON extraído pela IA aparecerá aqui para sua revisão..."
                    className="mt-1 block w-full flex-grow rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 font-mono"
                    rows={15}
                />
                <button
                    onClick={handlePublish}
                    disabled={!generatedJson || isLoading}
                    className="mt-4 w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    <CheckCircleIcon className="w-5 h-5 mr-2 -ml-1" />
                    Aprovar e Publicar Questionário
                </button>
             </div>
        </div>
      </div>
      {error && <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">{error}</div>}
      {successMessage && <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">{successMessage}</div>}
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        planPrice={50}
      />
    </div>
  );
};

export default AdminView;
