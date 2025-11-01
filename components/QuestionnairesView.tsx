import React, { useMemo, useState, useEffect } from 'react';
import { Questionnaire, Patient } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import QuestionnaireForm from './QuestionnaireForm';
import BodySticker from './BodySticker';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { auth } from '../config/firebaseConfig';

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

      {/* Barra de categorias (selecionável) */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 mb-6 overflow-x-auto">
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


