import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { isBackendEnabled } from '../services/apiClient';

interface AuthState { 
  professionalId: string | null; 
  setProfessionalId: (id: string | null) => void;
  isGoogleAuth: boolean;
  setIsGoogleAuth: (isGoogle: boolean) => void;
  
  // Novos campos para backend
  accessToken: string | null;
  refreshToken: string | null;
  professional: {
    id: string;
    email: string;
    name: string;
    planType: 'FREE' | 'PRO';
  } | null;
  
  // Métodos de autenticação
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ 
  professionalId: null, 
  setProfessionalId: ()=>{}, 
  isGoogleAuth: false,
  setIsGoogleAuth: () => {},
  accessToken: null,
  refreshToken: null,
  professional: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshAuth: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isGoogleAuth, setIsGoogleAuth] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [professional, setProfessional] = useState<AuthState['professional']>(null);

  // Carregar estado do localStorage na inicialização
  useEffect(() => {
    const savedId = localStorage.getItem('current_professional_id');
    const savedIsGoogle = localStorage.getItem('is_google_auth') === 'true';
    const savedAccessToken = localStorage.getItem('access_token');
    const savedRefreshToken = localStorage.getItem('refresh_token');
    
    if (savedId) {
      setProfessionalId(savedId);
    }
    if (savedIsGoogle) {
      setIsGoogleAuth(true);
    }
    if (savedAccessToken) {
      setAccessToken(savedAccessToken);
    }
    if (savedRefreshToken) {
      setRefreshToken(savedRefreshToken);
    }
  }, []);

  // Login com backend
  const login = useCallback(async (email: string, password: string) => {
    if (!isBackendEnabled()) {
      // Fallback para modo offline (sem backend)
      const localId = `local_${Date.now()}`;
      setProfessionalId(localId);
      localStorage.setItem('current_professional_id', localId);
      return;
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, professional: prof } = response.data;
      
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setProfessional(prof);
      setProfessionalId(prof.id);
      
      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      localStorage.setItem('current_professional_id', prof.id);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }, []);

  // Registro com backend
  const register = useCallback(async (email: string, password: string, name: string) => {
    if (!isBackendEnabled()) {
      throw new Error('Backend not enabled');
    }

    try {
      const response = await apiClient.post('/auth/register', { email, password, name });
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken, professional: prof } = response.data;
      
      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);
      setProfessional(prof);
      setProfessionalId(prof.id);
      
      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      localStorage.setItem('current_professional_id', prof.id);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    if (isBackendEnabled() && accessToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    // Limpar estado local
    setAccessToken(null);
    setRefreshToken(null);
    setProfessional(null);
    setProfessionalId(null);
    setIsGoogleAuth(false);
    
    // Limpar localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_professional_id');
    localStorage.removeItem('is_google_auth');
  }, [accessToken, refreshToken]);

  // Refresh token
  const refreshAuth = useCallback(async () => {
    if (!isBackendEnabled() || !refreshToken) {
      return;
    }

    try {
      const response = await apiClient.post('/auth/refresh', { refreshToken });
      const { accessToken: newAccessToken } = response.data;
      
      setAccessToken(newAccessToken);
      localStorage.setItem('access_token', newAccessToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [refreshToken, logout]);
  
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
      setIsGoogleAuth: handleSetIsGoogleAuth,
      accessToken,
      refreshToken,
      professional,
      login,
      register,
      logout,
      refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


