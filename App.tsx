import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Questionnaire, PlanType } from './types';
import { getPreloadedQuestionnaires } from './data/preload';
import useLocalStorage from './hooks/useLocalStorage';
import { migrateLocalStorage } from './utils/migrateLocalStorage';
import { fixLocalStorageOnLoad } from './utils/fixLocalStorageOnLoad';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackendSyncService } from './services/backendSync';
import { isBackendEnabled, isOnline } from './services/apiClient';
import {
  LandingPage,
  Login,
  ProfessionalView,
  QuestionnairesView,
  ReportView,
  ComparisonView,
  ValidateView,
  PrivacyPolicy,
  ConsentLGPD,
} from './routes';

// Executar correção IMEDIATAMENTE ao carregar o módulo (antes de qualquer hook)
// Verificar se estamos no navegador antes de executar
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    fixLocalStorageOnLoad();
  } catch (error) {
    console.error('Erro ao corrigir localStorage na inicialização:', error);
  }
}

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" role="status" aria-label="Carregando">
      <span className="sr-only">Carregando...</span>
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { professionalId } = useAuth();
  const [lgpdConsent, setLgpdConsent] = useLocalStorage<any>('lgpd_consent', null);
  const navigate = useNavigate();
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    if (!professionalId) {
      navigate('/');
      return;
    }
    
    if (professionalId && !lgpdConsent?.accepted) {
      setShowConsent(true);
    }
  }, [professionalId, lgpdConsent, navigate]);

  if (showConsent) {
    return (
      <ConsentLGPD
        onAccept={() => {
          setShowConsent(false);
          setLgpdConsent({ accepted: true, timestamp: new Date().toISOString() });
        }}
        onDecline={async () => {
          const isGoogleAuth = localStorage.getItem('is_google_auth') === 'true';
          localStorage.removeItem('current_professional_id');
          localStorage.removeItem('is_google_auth');
          
          if (isGoogleAuth) {
            try {
              const { signOutIfAvailable } = await import('./utils/firebaseHelper');
              const { loadFirebaseIfAvailable } = await import('./utils/firebaseHelper');
              const { firebaseConfig } = await loadFirebaseIfAvailable();
              if (firebaseConfig?.auth) {
                await signOutIfAvailable(firebaseConfig.auth);
              }
            } catch (error) {
              console.warn('Firebase não disponível para signOut:', error);
            }
          }
          
          navigate('/');
        }}
      />
    );
  }

  return <>{children}</>;
};

// Removed RoutesWithQuestionnaires - routes are now inline

const InnerApp: React.FC = () => {
  const { professionalId, setProfessionalId } = useAuth();
  const [questionnaires, setQuestionnaires] = useLocalStorage<Questionnaire[]>('published_questionnaires', []);
  // Garantir que professionalId não seja null/undefined
  const planKey = professionalId ? `user_plan_${professionalId}` : 'user_plan_temp';

  // Sincronização automática com backend
  useEffect(() => {
    if (!professionalId || !isBackendEnabled()) {
      return;
    }

    // Sincronizar quando aplicação inicia
    if (isOnline()) {
      BackendSyncService.sync();
      BackendSyncService.pullFromServer(professionalId);
    }

    // Sincronizar quando volta online
    const handleOnline = () => {
      console.log('Back online, syncing...');
      BackendSyncService.sync();
      BackendSyncService.pullFromServer(professionalId);
    };

    window.addEventListener('online', handleOnline);

    // Sincronizar periodicamente (a cada 5 minutos)
    const syncInterval = setInterval(() => {
      if (isOnline()) {
        BackendSyncService.sync();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(syncInterval);
    };
  }, [professionalId]);
  const [userPlan, setUserPlan] = useLocalStorage<PlanType | null>(planKey, null);

  // Executar migração uma vez na inicialização
  useEffect(() => {
    migrateLocalStorage();
  }, []);

  // Seed initial questionnaires from bundled JSONs if none published yet
  // Ou atualizar se detectar mudança na estrutura (ex: IKDC atualizado)
  useEffect(() => {
    const preloaded = getPreloadedQuestionnaires();
    if (preloaded.length === 0) return;
    
    if (questionnaires.length === 0) {
      // Primeira vez: carregar todos os questionários
      setQuestionnaires(preloaded);
    } else {
      // Verificar se há atualizações nos questionários pré-carregados
      // Especialmente para IKDC que foi reformatado
      const ikdcPreloaded = preloaded.find(q => q.acronym === 'IKDC');
      const ikdcStored = questionnaires.find(q => q.acronym === 'IKDC');
      
      if (ikdcPreloaded && ikdcStored) {
        // Verificar se o IKDC mudou (comparando número de itens principais)
        const preloadedMainItems = ikdcPreloaded.items.filter(item => !item.subitems).length;
        const storedMainItems = ikdcStored.items.filter(item => !item.subitems).length;
        
        // Se estrutura mudou, atualizar o IKDC
        if (preloadedMainItems !== storedMainItems || 
            ikdcPreloaded.items.length !== ikdcStored.items.length) {
          const updated = questionnaires.map(q => 
            q.acronym === 'IKDC' ? { ...ikdcPreloaded, id: q.id } : q
          );
          setQuestionnaires(updated);
          console.log('IKDC atualizado no localStorage');
        }
      }
      
      // Garantir que todos os questionários pré-carregados existam
      const missing = preloaded.filter(p => 
        !questionnaires.some(q => q.acronym === p.acronym)
      );
      if (missing.length > 0) {
        setQuestionnaires(prev => [...prev, ...missing]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const addQuestionnaire = (q: Questionnaire) => {
    setQuestionnaires(prev => [...prev, q]);
  };

  const handleLogin = (id: string, isGoogleAuth?: boolean, plan?: PlanType) => {
    setProfessionalId(id);
    if (plan) {
      setUserPlan(plan);
    }
  };

  return (
    <Layout>
      {/* Skip link para navegação por teclado */}
      <a href="#main-content" className="skip-link" aria-label="Pular para conteúdo principal">
        Ir para conteúdo principal
      </a>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={!professionalId ? <LandingPage onLogin={handleLogin} /> : <Navigate to="/patients" replace />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/privacy" element={
            <ProtectedRoute>
              <PrivacyPolicy onAccept={() => window.history.back()} />
            </ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute>
              <ProfessionalView />
            </ProtectedRoute>
          } />
          <Route path="/questionnaires" element={
            <ProtectedRoute>
              <QuestionnairesView questionnaires={questionnaires} />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <ReportView questionnaires={questionnaires} />
            </ProtectedRoute>
          } />
          <Route path="/comparison" element={
            <ProtectedRoute>
              <ComparisonView questionnaires={questionnaires} />
            </ProtectedRoute>
          } />
          <Route path="/validate" element={
            <ProtectedRoute>
              <ValidateView />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
