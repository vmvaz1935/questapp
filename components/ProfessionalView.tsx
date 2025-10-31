import React, { useState, useEffect } from 'react';
import { Questionnaire, Patient } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useAuth } from '../context/AuthContext';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { auth } from '../config/firebaseConfig';
import { usePlanLimits } from '../hooks/usePlanLimits';
import PaymentModal from './PaymentModal';

interface ProfessionalViewProps {
  questionnaires: Questionnaire[];
}

const ProfessionalView: React.FC<ProfessionalViewProps> = ({ questionnaires }) => {
  const { professionalId, isGoogleAuth } = useAuth();
  const storageKey = professionalId ? `patients_${professionalId}` : 'patients';
  const [patients, setPatients] = useLocalStorage<Patient[]>(storageKey, []);
  const { plan, maxPatients, canAddPatient } = usePlanLimits();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Obter UID do Firebase se autenticado com Google
  const firebaseUserId = isGoogleAuth && auth?.currentUser?.uid || null;
  
  // Sincronizar com Firebase
  const { syncData } = useFirebaseSync({ 
    userId: firebaseUserId || professionalId, 
    isGoogleAuth 
  });
  
  // Sincronizar pacientes quando mudarem (apenas se autenticado com Google)
  useEffect(() => {
    if (isGoogleAuth && firebaseUserId && patients.length > 0) {
      syncData('patients', patients).catch(err => {
        console.error('Erro ao sincronizar pacientes:', err);
      });
    }
  }, [patients, isGoogleAuth, firebaseUserId, syncData]);

  const [form, setForm] = useState<Partial<Patient>>({
    nome: '',
    idade: undefined,
    sexo: 'Prefiro não informar',
    diagnostico: '',
    ladoAcometido: 'Não se aplica',
    fisioterapeuta: '',
    medico: ''
  });

  const handleChange = (key: keyof Patient, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.idade || !form.sexo || !form.diagnostico) {
      alert('Preencha nome, idade, sexo e diagnóstico.');
      return;
    }
    
    // Verificar limite do plano
    if (!canAddPatient(patients.length)) {
      if (plan === 'free') {
        const upgrade = confirm(`Você atingiu o limite do plano gratuito (${maxPatients} pacientes).\n\nDeseja fazer upgrade para o Plano Pro (R$ 50,00/mês) para pacientes ilimitados?`);
        if (upgrade) {
          setShowPaymentModal(true);
        }
      } else {
        alert('Limite de pacientes atingido. Faça upgrade para o Plano Pro.');
      }
      return;
    }
    
    const newPatient: Patient = {
      id: `${Date.now()}`,
      nome: form.nome as string,
      idade: Number(form.idade),
      sexo: form.sexo as Patient['sexo'],
      diagnostico: form.diagnostico as string,
      ladoAcometido: form.ladoAcometido as Patient['ladoAcometido'],
      fisioterapeuta: form.fisioterapeuta as string,
      medico: form.medico as string,
    };
    setPatients(prev => [newPatient, ...prev]);
    setForm({ nome: '', idade: undefined, sexo: 'Prefiro não informar', diagnostico: '', ladoAcometido: 'Não se aplica', fisioterapeuta: '', medico: '' });
  };

  const handlePaymentSuccess = () => {
    // Atualizar plano para Pro após pagamento bem-sucedido
    const planKey = `user_plan_${professionalId}`;
    localStorage.setItem(planKey, JSON.stringify('pro'));
    window.location.reload(); // Recarregar para aplicar o novo plano
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white flex items-center justify-center gap-3">
          FisioQ <span className="text-lg font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-3 py-1 rounded-full">Beta</span>
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400">Cadastre pacientes e acompanhe escalas clínicas.</p>
        
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
              Pacientes: {patients.length} / {maxPatients === null ? '∞' : maxPatients}
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
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500 max-w-2xl mx-auto">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            🔒 <strong>Confidencialidade:</strong> Todos os dados são armazenados localmente no seu navegador. 
            É sua responsabilidade manter o dispositivo seguro e obter consentimento dos pacientes conforme a LGPD.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cadastro de Paciente */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Cadastrar Paciente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome completo</label>
              <input value={form.nome || ''} onChange={e=>handleChange('nome', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700" required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Idade</label>
                <input type="number" min={0} value={form.idade ?? ''} onChange={e=>handleChange('idade', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700" required/>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sexo</label>
                <select value={form.sexo} onChange={e=>handleChange('sexo', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700">
                  <option>Masculino</option>
                  <option>Feminino</option>
                  <option>Outro</option>
                  <option>Prefiro não informar</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diagnóstico</label>
              <input value={form.diagnostico || ''} onChange={e=>handleChange('diagnostico', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700" required/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Lado acometido</label>
                <select value={form.ladoAcometido} onChange={e=>handleChange('ladoAcometido', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700">
                  <option>Não se aplica</option>
                  <option>Direito</option>
                  <option>Esquerdo</option>
                  <option>Bilateral</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fisioterapeuta</label>
                <input value={form.fisioterapeuta || ''} onChange={e=>handleChange('fisioterapeuta', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"/>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Médico</label>
              <input value={form.medico || ''} onChange={e=>handleChange('medico', e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"/>
            </div>
            <button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg p-3">Salvar Paciente</button>
          </form>
        </div>

        {/* Lista de Pacientes */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Pacientes Cadastrados</h2>
          {patients.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum paciente ainda.</p>
          ) : (
            <ul className="space-y-3">
              {patients.map(p => (
                <li key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{p.nome} <span className="text-gray-500 font-normal">({p.idade} anos • {p.sexo})</span></p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Diag.: {p.diagnostico} {p.ladoAcometido && `• Lado: ${p.ladoAcometido}`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Fisio: {p.fisioterapeuta || '-'} • Médico: {p.medico || '-'}</p>
                  </div>
                  <button
                    onClick={()=> setPatients(prev => prev.filter(x => x.id !== p.id))}
                    className="text-red-600 hover:text-red-700 text-sm"
                    aria-label={`Excluir paciente ${p.nome}`}>
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Questionários disponíveis por categoria */}
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mt-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Questionários por parte do corpo</h2>
        {questionnaires.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhum questionário publicado.</p>
        ) : (
          (() => {
            const getCategory = (q: Questionnaire): string => {
              const a = q.acronym?.toUpperCase?.() || '';
              const n = q.name?.toLowerCase?.() || '';
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
              if (n.includes('quadril') || n.includes('virilha')) return 'Quadril';
              if (n.includes('tornozelo') || n.includes('pé')) return 'Tornozelo/Pé';
              if (n.includes('ombro')) return 'Ombro';
              if (n.includes('cotovelo')) return 'Cotovelo';
              if (n.includes('punho')) return 'Punho';
              if (n.includes('mão') || n.includes('mao')) return 'Mão';
              if (n.includes('coluna') || n.includes('cervical') || n.includes('lombar')) return 'Coluna';
              return 'Outros';
            };
            
            // Classificar questionários e duplicar DASH nas categorias de membro superior
            const classified: Record<string, Questionnaire[]> = {};
            questionnaires.forEach(q => {
              const cat = getCategory(q);
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
            
            const groups = classified;
            const order = ['Coluna','Ombro','Cotovelo','Punho','Mão','Membro inferior (geral)','Joelho','Quadril','Tornozelo/Pé','Joelho/Quadril (OA)','Outros'];
            const cats = Object.keys(groups).sort((a,b)=> {
              const idxA = order.indexOf(a);
              const idxB = order.indexOf(b);
              if (idxA === -1 && idxB === -1) return 0;
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            });
            return (
              <div className="space-y-6">
                {cats.map(cat => (
                  <div key={cat}>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{cat}</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groups[cat].map(q => (
                        <li key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <p className="font-semibold">{q.name} ({q.acronym})</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{q.domain}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
      
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        planPrice={50}
      />
    </div>
  );
};

export default ProfessionalView;


