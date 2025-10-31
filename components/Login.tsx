import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useLocalStorage from '../hooks/useLocalStorage';
import { hashPassword, verifyPassword } from '../utils/security';
import { useAuth } from '../context/AuthContext';

interface Profile { 
  id: string; 
  name: string; 
  email: string; 
  passwordHash?: string; 
  isGoogleAuth?: boolean;
  plan?: 'free' | 'pro';
  planSubscribedAt?: string;
}

const Login: React.FC<{ 
  onLogin: (profileId: string, isGoogleAuth?: boolean, plan?: 'free' | 'pro') => void;
  selectedPlan?: 'free' | 'pro';
} > = ({ onLogin, selectedPlan: propSelectedPlan }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') as 'free' | 'pro' | null;
  const selectedPlan = propSelectedPlan || planFromUrl || null;
  
  const { setIsGoogleAuth } = useAuth();
  const [profiles, setProfiles] = useLocalStorage<Profile[]>('profiles', []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  
  // Monitorar estado de autenticação do Firebase
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    // Tentar carregar Firebase dinamicamente usando helper
    import('../utils/firebaseHelper').then(({ loadFirebaseIfAvailable }) => {
      return loadFirebaseIfAvailable();
    }).then(({ firebaseConfig, firebaseAuth, firebaseSync }) => {
      if (!firebaseConfig || !firebaseAuth || !firebaseSync) return;
      if (!firebaseConfig.isFirebaseConfigured || !firebaseConfig.auth) return;
      
      unsubscribe = firebaseAuth.onAuthStateChanged(firebaseConfig.auth, async (user: any) => {
        if (user && user.uid) {
          const existingProfile = profiles.find(p => p.email === user.email);
          if (existingProfile) {
            localStorage.setItem('current_professional_id', existingProfile.id);
            localStorage.setItem('is_google_auth', 'true');
            setIsGoogleAuth(true);
            if (firebaseSync.loadAllDataFromFirebase) {
              await firebaseSync.loadAllDataFromFirebase(user.uid);
            }
          }
        }
      });
    }).catch(() => {
      // Firebase não disponível - ignorar
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profiles, setIsGoogleAuth]);

  // Migração: converter senhas antigas (texto plano) para hash
  useEffect(() => {
    const migrateOldProfiles = async () => {
      const hasOldFormat = profiles.some((p: any) => 'password' in p && !('passwordHash' in p));
      if (hasOldFormat) {
        const migrated = await Promise.all(profiles.map(async (p: any) => {
          if ('password' in p && !('passwordHash' in p)) {
            const passwordHash = await hashPassword(p.password);
            const { password, ...rest } = p;
            return { ...rest, passwordHash };
          }
          return p;
        }));
        setProfiles(migrated);
      }
    };
    migrateOldProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew) {
      if (!email || !password || !name) { alert('Preencha nome, e-mail e senha.'); return; }
      if (password.length < 6) { alert('A senha deve ter no mínimo 6 caracteres.'); return; }
      const exists = profiles.find(p => p.email === email);
      if (exists) { alert('E-mail já cadastrado.'); return; }
      const id = `${Date.now()}`;
      const passwordHash = await hashPassword(password);
      const plan = selectedPlan || 'free';
      const p: Profile = { 
        id, 
        name, 
        email, 
        passwordHash, 
        isGoogleAuth: false,
        plan,
        planSubscribedAt: new Date().toISOString()
      };
      setProfiles(prev => [...prev, p]);
      localStorage.setItem('current_professional_id', id);
      setIsGoogleAuth(false);
      onLogin(id, false, plan);
      navigate('/patients');
      return;
    }
    const found = profiles.find(p => p.email === email);
    if (!found) { alert('E-mail ou senha inválidos.'); return; }
    // Compatibilidade: verificar senha antiga (texto plano) ou hash
    let isValid = false;
    if ('passwordHash' in found) {
      isValid = await verifyPassword(password, found.passwordHash);
    } else if ('password' in (found as any)) {
      isValid = password === (found as any).password;
      // Migrar automaticamente após login bem-sucedido
      if (isValid) {
        const passwordHash = await hashPassword(password);
        const { password: _, ...rest } = found as any;
        const migrated: Profile = { ...rest, passwordHash };
        setProfiles(prev => prev.map(p => p.id === found.id ? migrated : p));
      }
    }
    if (!isValid) { alert('E-mail ou senha inválidos.'); return; }
    localStorage.setItem('current_professional_id', found.id);
    setIsGoogleAuth(found.isGoogleAuth || false);
    const plan = found.plan || selectedPlan || 'free';
    onLogin(found.id, found.isGoogleAuth || false, plan);
    navigate('/patients');
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    try {
      // Tentar importar Firebase usando helper
      const { loadFirebaseIfAvailable } = await import('../utils/firebaseHelper');
      const { firebaseConfig, firebaseAuth, firebaseSync } = await loadFirebaseIfAvailable();
      
      if (!firebaseConfig || !firebaseAuth || !firebaseSync) {
        throw new Error('Firebase não instalado');
      }
      
      if (!firebaseConfig.isFirebaseConfigured || !firebaseConfig.auth || !firebaseConfig.googleProvider) {
        alert('Autenticação do Google não está configurada. Configure o Firebase em config/firebaseConfig.ts');
        setIsLoadingGoogle(false);
        return;
      }

      const result = await firebaseAuth.signInWithPopup(firebaseConfig.auth, firebaseConfig.googleProvider);
      const user = result.user;
      
      // Criar ou atualizar perfil com dados do Google
      const existingProfile = profiles.find(p => p.email === user.email);
      let profileId: string;
      
      if (existingProfile) {
        // Atualizar perfil existente
        profileId = existingProfile.id;
        const updatedProfile: Profile = {
          ...existingProfile,
          name: user.displayName || existingProfile.name,
          email: user.email || existingProfile.email,
          isGoogleAuth: true
        };
        setProfiles(prev => prev.map(p => p.id === profileId ? updatedProfile : p));
      } else {
        // Criar novo perfil
        profileId = user.uid || `${Date.now()}`;
        const plan = selectedPlan || 'free';
        const newProfile: Profile = {
          id: profileId,
          name: user.displayName || 'Usuário Google',
          email: user.email || '',
          isGoogleAuth: true,
          plan,
          planSubscribedAt: new Date().toISOString()
        };
        setProfiles(prev => [...prev, newProfile]);
      }
      
      // Salvar perfil no Firebase também
      if (firebaseSync.saveToFirebase) {
        await firebaseSync.saveToFirebase(user.uid, 'profile', {
          id: profileId,
          name: user.displayName || 'Usuário Google',
          email: user.email || '',
          isGoogleAuth: true,
          createdAt: new Date().toISOString()
        });
      }
      
      // Carregar dados do Firebase para localStorage
      if (firebaseSync.loadAllDataFromFirebase) {
        await firebaseSync.loadAllDataFromFirebase(user.uid);
      }
      
      localStorage.setItem('current_professional_id', profileId);
      localStorage.setItem('is_google_auth', 'true');
      setIsGoogleAuth(true);
      const plan = selectedPlan || existingProfile?.plan || 'free';
      onLogin(profileId, true, plan);
      navigate('/patients');
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      
      if (error.message === 'Firebase não instalado' || error.message?.includes('Failed to resolve')) {
        alert('Firebase não está instalado. Por favor, execute: npm install\n\nA aplicação funciona normalmente sem Firebase usando apenas localStorage.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        alert('Login cancelado pelo usuário.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Popup bloqueado. Permita popups para este site.');
      } else {
        alert(`Erro ao fazer login com Google: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-2">
          FisioQ <span className="text-xs font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">Beta</span>
        </h1>
        {selectedPlan && (
          <div className={`mb-4 p-3 rounded-lg text-center ${
            selectedPlan === 'pro' 
              ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500' 
              : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
          }`}>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Plano: <span className={selectedPlan === 'pro' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}>
                {selectedPlan === 'pro' ? 'Pro (R$ 50,00/mês)' : 'Gratuito'}
              </span>
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isNew && (
            <div>
              <label className="block text-sm mb-1">Nome</label>
              <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"/>
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"/>
          </div>
          <div>
            <label className="block text-sm mb-1">Senha</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700"/>
            {isNew && <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>}
          </div>
          <button type="submit" className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg p-3">{isNew ? 'Criar conta' : 'Entrar'}</button>
        </form>
        
        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
          </div>
        </div>
        
        {/* Botão Google - sempre mostrado, mas desabilitado se Firebase não disponível */}
        <button
            onClick={handleGoogleLogin}
            disabled={isLoadingGoogle}
            className="w-full flex items-center justify-center gap-3 text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-lg p-3 transition-colors"
          >
            {isLoadingGoogle ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Entrando com Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continuar com Google</span>
              </>
            )}
          </button>
        
        <button onClick={()=>setIsNew(v=>!v)} className="mt-4 w-full text-blue-600">{isNew ? 'Já tenho conta' : 'Criar nova conta'}</button>
        <div className="mt-4 text-xs text-gray-500 text-center">
          🔒 Seus dados são protegidos conforme a <strong>LGPD</strong>. 
          <a href="#privacy" className="text-blue-600 hover:underline ml-1">Política de Privacidade</a>
        </div>
      </div>
    </div>
  );
};

export default Login;


