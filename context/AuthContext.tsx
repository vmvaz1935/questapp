import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
  
  useEffect(() => { 
    const savedId = localStorage.getItem('current_professional_id');
    const savedIsGoogle = localStorage.getItem('is_google_auth') === 'true';
    setProfessionalId(savedId);
    setIsGoogleAuth(savedIsGoogle);
  }, []);
  
  const handleSetProfessionalId = (id: string | null) => {
    setProfessionalId(id);
    if (id) {
      localStorage.setItem('current_professional_id', id);
    } else {
      localStorage.removeItem('current_professional_id');
      localStorage.removeItem('is_google_auth');
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


