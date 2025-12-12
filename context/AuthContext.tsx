import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../src/stores/authStore';
import { clearEncryptionCacheForProfessional } from '../services/encryption';

interface AuthState { 
  professionalId: string | null; 
  setProfessionalId: (id: string | null) => void;
  isGoogleAuth: boolean;
  setIsGoogleAuth: (isGoogle: boolean) => void;
}

const AuthContext = createContext<AuthState>({ 
  professionalId: null, 
  setProfessionalId: ()=>{}, 
  isGoogleAuth: false,
  setIsGoogleAuth: () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { professional, logout } = useAuthStore();
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
  
  // Sincronizar com Zustand store
  useEffect(() => {
    if (professional) {
      setProfessionalId(professional.id);
      // Verificar se é Google Auth (pode ser melhorado com flag no professional)
      const savedIsGoogle = localStorage.getItem('is_google_auth') === 'true';
      setIsGoogleAuth(savedIsGoogle);
      localStorage.setItem('current_professional_id', professional.id);
    } else {
      setProfessionalId(null);
      setIsGoogleAuth(false);
      localStorage.removeItem('current_professional_id');
      localStorage.removeItem('is_google_auth');
    }
  }, [professional]);
  
  // Carregar do localStorage na inicialização (compatibilidade)
  useEffect(() => { 
    const savedId = localStorage.getItem('current_professional_id');
    const savedIsGoogle = localStorage.getItem('is_google_auth') === 'true';
    if (savedId && !professional) {
      setProfessionalId(savedId);
      setIsGoogleAuth(savedIsGoogle);
    }
  }, [professional]);
  
  const handleSetProfessionalId = (id: string | null) => {
    const previousId = professionalId;
    
    setProfessionalId(id);
    if (id) {
      localStorage.setItem('current_professional_id', id);
    } else {
      localStorage.removeItem('current_professional_id');
      localStorage.removeItem('is_google_auth');
      
      // Limpar cache de criptografia ao fazer logout
      if (previousId) {
        clearEncryptionCacheForProfessional(previousId);
      }
      
      logout();
    }
  };
  
  const handleSetIsGoogleAuth = (isGoogle: boolean) => {
    setIsGoogleAuth(isGoogle);
    if (isGoogle) {
      localStorage.setItem('is_google_auth', 'true');
    } else {
      localStorage.removeItem('is_google_auth');
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      professionalId, 
      setProfessionalId: handleSetProfessionalId,
      isGoogleAuth,
      setIsGoogleAuth: handleSetIsGoogleAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


