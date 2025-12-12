import React, { useMemo, useState, useEffect } from 'react';
import { Questionnaire, Patient } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import QuestionnaireForm from './QuestionnaireForm';
import BodySticker from './BodySticker';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { auth } from '../config/firebaseConfig';
import { useDrafts } from '../hooks/useDrafts';

const QuestionnairesView: React.FC<{ questionnaires: Questionnaire[] }>
  = ({ questionnaires }) => {
  const { professionalId, isGoogleAuth } = useAuth();
  const patientsKey = professionalId ? `patients_${professionalId}` : 'patients';
  const resultsKey = professionalId ? `results_${professionalId}` : 'results';
  const [patients] = useLocalStorage<Patient[]>(patientsKey, []);
  const [results, setResults] = useLocalStorage<any[]>(resultsKey, []);
  
  // Obter UID do Firebase se autenticado com Google
  const firebaseUserId = isGoogleAuth && auth?.currentUser?.uid || null;
  
  // Sincronizar com Firebase
  const { syncData } = useFirebaseSync({ 
    userId: firebaseUserId || professionalId, 
    isGoogleAuth 
  });
  
  // Sincronizar resultados quando mudarem (apenas se autenticado com Google)
  useEffect(() => {
    if (isGoogleAuth && firebaseUserId && results.length > 0) {
      syncData('results', results).catch(err => {
        console.error('Erro ao sincronizar resultados:', err);
      });
    }
  }, [results, isGoogleAuth, firebaseUserId, syncData]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [activeQ, setActiveQ] = useState<Questionnaire | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [showDrafts, setShowDrafts] = useState(false);
  const { drafts, loadDraft, deleteDraft } = useDrafts();

  const groups = useMemo(()=>{
    const getCat = (q: Questionnaire) => {
      const a = q.acronym?.toUpperCase?.()||''; const n=q.name?.toLowerCase?.()||'';
      if (['ODI','RMDQ','QBPDS','SBST','NBQ','NDI','CPG','TSK-11'].includes(a)) return 'Coluna';
      if (['KOOS','LYSHOLM','IKDC','ACL-RSI'].includes(a)) return 'Joelho';
      if (['HOOS','HAGOS','IHOT-12','IHOT'].includes(a)) return 'Quadril';
      if (['AOFAS','FAAM','FAOS'].includes(a)) return 'Tornozelo/Pé';
      if (['LEFS'].includes(a)) return 'Membro inferior (geral)';
      if (['WOMAC'].includes(a)) return 'Joelho/Quadril (OA)';
      // Classificação específica para membro superior
      if (['SPADI','OSS','WOSI'].includes(a)) return 'Ombro';
      if (['PRTEE'].includes(a)) return 'Cotovelo';
      if (['PRWE'].includes(a)) return 'Punho';
      if (['MHQ'].includes(a)) return 'Mão';
      // DASH é geral e se aplica aos 3 - será duplicado abaixo
      if (['DASH'].includes(a)) return 'DASH_GERAL'; // Marcador especial
      // Fallback por palavras-chave
      if (n.includes('joelho')) return 'Joelho';
      if (n.includes('virilha')||n.includes('quadril')) return 'Quadril';
      if (n.includes('tornozelo')||n.includes('pé')) return 'Tornozelo/Pé';
      if (n.includes('ombro')) return 'Ombro';
      if (n.includes('cotovelo')) return 'Cotovelo';
      if (n.includes('punho')) return 'Punho';
      if (n.includes('mão') || n.includes('mao')) return 'Mão';
      if (n.includes('coluna')||n.includes('cervical')||n.includes('lombar')) return 'Coluna';
      return 'Outros';
    };
    
    // Classificar questionários e duplicar DASH nas categorias de membro superior
    const classified: Record<string, Questionnaire[]> = {};
    questionnaires.forEach(q => {
      const cat = getCat(q);
      if (cat === 'DASH_GERAL') {
        // DASH se aplica a Ombro, Cotovelo, Punho e Mão
        ['Ombro', 'Cotovelo', 'Punho', 'Mão'].forEach(c => {
          if (!classified[c]) classified[c] = [];
          classified[c].push(q);
        });
      } else {
        if (!classified[cat]) classified[cat] = [];
        classified[cat].push(q);
      }
    });
    
    return classified;
  },[questionnaires]);

  const handleSaved = (payload: any) => {
    setResults(prev => [{ ...payload, professionalId, createdAt: new Date().toISOString() }, ...prev]);
    // Mantém a tela do questionário aberta para exibir o resultado (ScoreDisplay)
  };

  // Pré-seleciona paciente e categoria quando disponíveis
  React.useEffect(()=>{
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  },[patients]);
  React.useEffect(()=>{
    const cats = Object.keys(groups);
    if (!selectedCat && cats.length > 0) setSelectedCat(cats[0]);
  },[groups, selectedCat]);

  if (activeQ) {
    const patient = patients.find(p=>p.id===selectedPatientId);
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{activeQ.name} ({activeQ.acronym})</h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Paciente: {patient?.nome ?? '-'}</p>
          </div>
          <button onClick={() => setActiveQ(null)} className="text-sm px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600">Voltar</button>
        </div>
        <QuestionnaireForm 
          questionnaire={activeQ} 
          patient={patient || null}
          onSaved={(data)=>handleSaved({ ...data, patientId: selectedPatientId, questionnaireId: activeQ.id })} 
        />
      </div>
    );
  }

  // Filtrar rascunhos por paciente se selecionado
  const filteredDrafts = selectedPatientId 
    ? drafts.filter(d => !d.patientId || d.patientId === selectedPatientId)
    : drafts;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Questionários</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Selecionar paciente</label>
            <select value={selectedPatientId} onChange={e=>setSelectedPatientId(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700">
              <option value="">-- Selecione --</option>
              {patients.map(p=> <option key={p.id} value={p.id}>{p.nome} • {p.idade} anos</option>)}
            </select>
          </div>
          <div className="md:col-span-2 text-sm text-gray-600 dark:text-gray-300">
            Escolha um questionário na lista abaixo. Você precisa selecionar um paciente para iniciar.
          </div>
        </div>
      </div>

      {/* Tabs: Questionários e Rascunhos */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 mb-6">
        <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => { setShowDrafts(false); setSelectedCat(''); }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              !showDrafts
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Questionários
          </button>
          <button
            onClick={() => { setShowDrafts(true); setSelectedCat(''); }}
            className={`px-4 py-2 font-medium border-b-2 transition-colors relative ${
              showDrafts
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Rascunhos
            {filteredDrafts.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {filteredDrafts.length}
              </span>
            )}
          </button>
        </div>

        {showDrafts ? (
          /* Lista de Rascunhos */
          <div>
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">Nenhum rascunho salvo</p>
                <p className="text-sm mt-2">Os rascunhos aparecerão aqui quando você salvar o progresso de um questionário.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDrafts.map((draft) => {
                  const questionnaire = questionnaires.find(q => q.id === draft.questionnaireId);
                  const draftPatient = patients.find(p => p.id === draft.patientId);
                  
                  return (
                    <div
                      key={draft.draftId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                              Rascunho
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {draft.progress}% completo
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {questionnaire?.name || 'Questionário desconhecido'} ({questionnaire?.acronym || 'N/A'})
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Paciente: {draftPatient?.nome || 'Não especificado'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Última atualização: {new Date(draft.updatedAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={async () => {
                              if (!questionnaire) {
                                alert('Questionário não encontrado.');
                                return;
                              }
                              if (draft.patientId) {
                                setSelectedPatientId(draft.patientId);
                              }
                              setActiveQ(questionnaire);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                          >
                            Continuar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja excluir este rascunho?')) {
                                try {
                                  await deleteDraft(draft.draftId);
                                } catch (error) {
                                  console.error('Erro ao deletar rascunho:', error);
                                  alert('Erro ao deletar rascunho.');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors text-sm"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Barra de categorias (selecionável) */
          <div className="overflow-x-auto">
            <div className="flex space-x-3 min-w-max items-center">
              {Object.keys(groups).map(cat => (
                <button key={cat} onClick={()=>setSelectedCat(cat)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${selectedCat===cat ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                  <BodySticker category={cat} size={28} />
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista da categoria escolhida */}
      {selectedCat && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{selectedCat}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(groups[selectedCat]||[]).map(q => (
              <li key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-start space-x-3"
                  onClick={()=> selectedPatientId ? setActiveQ(q) : alert('Selecione um paciente primeiro.') }>
                <BodySticker category={selectedCat} size={36} />
                <div>
                  <p className="font-semibold">{q.name} ({q.acronym})</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{q.domain}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuestionnairesView;


