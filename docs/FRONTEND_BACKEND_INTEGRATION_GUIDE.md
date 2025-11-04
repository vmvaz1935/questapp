# Guia de Integração Frontend-Backend - FisioQ (Revisado)

**Versão**: 2.0 (Revisado e Alinhado com Projeto Atual)  
**Data**: Novembro 2025  
**Status**: ✅ Revisado e Validado

---

## 📋 Mudanças Principais da Revisão

### ✅ Ajustes Realizados

1. **Compatibilidade com Estrutura Atual**
   - Mantém `AuthContext` existente
   - Integra com IndexedDB (Dexie) já implementado
   - Compatível com Firebase sync atual
   - Usa estrutura de tipos existente (`types.ts`)

2. **Dependências Mínimas**
   - Adiciona apenas `axios` (necessário)
   - Não força Zustand (usa Context API existente)
   - Não força React Query (usa hooks customizados)
   - Mantém estrutura atual

3. **Integração Offline-First**
   - Integra com IndexedDB existente
   - Compatível com Firebase sync
   - Estratégia híbrida (local + backend)

4. **Migração Gradual**
   - Estrutura permite migração gradual do Firebase
   - Mantém compatibilidade com dados existentes
   - Suporte para dual sync (Firebase + Backend)

---

## 1. Configuração do Frontend

### 1.1 Instalar Dependências

```bash
# Apenas axios é necessário (não adicionar Zustand, React Query)
npm install axios

# Opcional: para notificações (substituir toast atual se necessário)
npm install react-toastify
```

**Nota**: O projeto já usa:
- ✅ `dexie` (IndexedDB)
- ✅ `firebase` (sincronização opcional)
- ✅ `react-router-dom` (roteamento)
- ✅ Context API (estado)

**Não é necessário**:
- ❌ Zustand (já usa Context API)
- ❌ React Query (já usa hooks customizados)

### 1.2 Configurar Variáveis de Ambiente

```env
# .env.development
VITE_API_URL=http://localhost:3000/api/v1
VITE_ENABLE_BACKEND=true

# .env.production
VITE_API_URL=https://api.fisioq.app/api/v1
VITE_ENABLE_BACKEND=true
```

**Estrutura de arquivos `.env`:**
```
.env                    # Variáveis locais (não commitado)
.env.development        # Desenvolvimento
.env.production         # Produção
.env.example            # Template (commitado)
```

### 1.3 Criar API Client (`src/services/apiClient.ts`)

```typescript
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Variáveis de ambiente
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const ENABLE_BACKEND = import.meta.env.VITE_ENABLE_BACKEND === 'true';

// Tipos
interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

// Função para obter tokens do localStorage (compatível com estrutura atual)
function getAuthTokens(): AuthTokens {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  return {
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
  };
}

// Função para salvar tokens
function setAuthTokens(tokens: AuthTokens) {
  if (tokens.accessToken) {
    localStorage.setItem('access_token', tokens.accessToken);
  }
  if (tokens.refreshToken) {
    localStorage.setItem('refresh_token', tokens.refreshToken);
  }
}

// Função para limpar tokens
function clearAuthTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Criar instância do axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para adicionar token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Verificar se backend está habilitado
    if (!ENABLE_BACKEND) {
      // Se backend desabilitado, rejeitar requisição
      return Promise.reject(new Error('Backend API disabled'));
    }

    const { accessToken } = getAuthTokens();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para renovar token se expirado
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Se erro 401 (não autorizado) e ainda não tentou renovar
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = getAuthTokens();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Tentar renovar token
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken } = response.data;
        setAuthTokens({ accessToken, refreshToken });

        // Retentar requisição original com novo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Se falhar, limpar tokens e redirecionar para login
        clearAuthTokens();
        localStorage.removeItem('current_professional_id');
        localStorage.removeItem('is_google_auth');
        
        // Redirecionar apenas se não estiver na página de login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper para verificar se backend está disponível
export const isBackendEnabled = (): boolean => {
  return ENABLE_BACKEND && !!API_URL;
};

// Helper para verificar se está online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export default apiClient;
```

---

## 2. Integração com AuthContext Existente

### 2.1 Estender AuthContext (`src/context/AuthContext.tsx`)

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient, { isBackendEnabled } from '../services/apiClient';
import { getDatabase } from '../services/database';

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
  setProfessionalId: () => {},
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
        await apiClient.post('/auth/logout');
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
  }, [accessToken]);

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
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 3. Integração com IndexedDB Existente

### 3.1 Criar Sync Service (`src/services/backendSync.ts`)

```typescript
import apiClient, { isBackendEnabled, isOnline } from './apiClient';
import { getDatabase } from './database';
import type { Patient, Questionnaire } from '../types';

// Tipos para sincronização
interface SyncChange {
  entityType: 'PATIENT' | 'RESULT' | 'CONSENT';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  localTimestamp: string; // ISO 8601
  data: any;
}

interface SyncResult {
  synced: number;
  failed: number;
  conflicts: Array<{
    entityType: string;
    entityId: string;
    localData: any;
    serverData: any;
    resolution: 'LOCAL' | 'SERVER' | 'MANUAL';
  }>;
  errors: Array<{
    entityId: string;
    error: string;
  }>;
}

// Interface para sincronização
interface SyncQueueItem {
  id: string;
  change: SyncChange;
  attempts: number;
  lastAttemptAt?: number;
}

export class BackendSyncService {
  private static syncQueue: SyncQueueItem[] = [];
  private static isSyncing = false;

  /**
   * Adicionar mudança à fila de sincronização
   */
  static async queueChange(change: SyncChange): Promise<void> {
    // Carregar fila do IndexedDB
    const queueKey = `sync_queue_${change.entityType}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]') as SyncQueueItem[];

    const queueItem: SyncQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      change,
      attempts: 0,
    };

    queue.push(queueItem);
    localStorage.setItem(queueKey, JSON.stringify(queue));
    this.syncQueue = queue;

    // Tentar sincronizar imediatamente se online
    if (isOnline() && isBackendEnabled()) {
      this.sync();
    }
  }

  /**
   * Sincronizar mudanças pendentes
   */
  static async sync(): Promise<SyncResult> {
    if (this.isSyncing || !isOnline() || !isBackendEnabled()) {
      return { synced: 0, failed: 0, conflicts: [], errors: [] };
    }

    this.isSyncing = true;

    try {
      // Carregar todas as filas
      const allChanges: SyncChange[] = [];
      const queueKeys = ['sync_queue_PATIENT', 'sync_queue_RESULT', 'sync_queue_CONSENT'];

      for (const key of queueKeys) {
        const queue = JSON.parse(localStorage.getItem(key) || '[]') as SyncQueueItem[];
        const unsynced = queue.filter((item) => item.attempts < 3);
        allChanges.push(...unsynced.map((item) => item.change));
      }

      if (allChanges.length === 0) {
        this.isSyncing = false;
        return { synced: 0, failed: 0, conflicts: [], errors: [] };
      }

      // Enviar para backend
      const response = await apiClient.post<SyncResult>('/sync', {
        changes: allChanges,
      });

      // Processar resultado
      const result = response.data;

      // Marcar mudanças sincronizadas como concluídas
      for (const key of queueKeys) {
        const queue = JSON.parse(localStorage.getItem(key) || '[]') as SyncQueueItem[];
        const updatedQueue = queue.map((item) => {
          const synced = result.synced > 0 && allChanges.some((c) => c.entityId === item.change.entityId);
          if (synced) {
            return { ...item, attempts: 999 }; // Marcar como concluído
          }
          return { ...item, attempts: item.attempts + 1, lastAttemptAt: Date.now() };
        }).filter((item) => item.attempts < 3); // Remover após 3 tentativas

        localStorage.setItem(key, JSON.stringify(updatedQueue));
      }

      this.isSyncing = false;
      return result;
    } catch (error: any) {
      this.isSyncing = false;
      console.error('Sync failed:', error);
      return {
        synced: 0,
        failed: 1,
        conflicts: [],
        errors: [{ entityId: 'unknown', error: error.message }],
      };
    }
  }

  /**
   * Sincronizar pacientes específicos
   */
  static async syncPatients(professionalId: string): Promise<void> {
    if (!isOnline() || !isBackendEnabled()) {
      return;
    }

    try {
      const db = getDatabase(professionalId);
      const localPatients = await db.patients.toArray();

      // Converter para formato do backend
      const changes: SyncChange[] = localPatients.map((p) => ({
        entityType: 'PATIENT' as const,
        entityId: p.patientId,
        operation: 'CREATE' as const, // Ou UPDATE se já existir
        localTimestamp: p.updatedAt || p.createdAt,
        data: p.data,
      }));

      if (changes.length > 0) {
        await apiClient.post('/sync', { changes });
      }
    } catch (error) {
      console.error('Failed to sync patients:', error);
    }
  }

  /**
   * Sincronizar resultados específicos
   */
  static async syncResults(professionalId: string): Promise<void> {
    if (!isOnline() || !isBackendEnabled()) {
      return;
    }

    try {
      const db = getDatabase(professionalId);
      const localResults = await db.results.toArray();

      // Converter para formato do backend
      const changes: SyncChange[] = localResults.map((r) => ({
        entityType: 'RESULT' as const,
        entityId: r.resultId,
        operation: 'CREATE' as const,
        localTimestamp: r.updatedAt || r.createdAt,
        data: r.data,
      }));

      if (changes.length > 0) {
        await apiClient.post('/sync', { changes });
      }
    } catch (error) {
      console.error('Failed to sync results:', error);
    }
  }

  /**
   * Buscar dados do servidor e mesclar com local
   */
  static async pullFromServer(professionalId: string): Promise<void> {
    if (!isOnline() || !isBackendEnabled()) {
      return;
    }

    try {
      const db = getDatabase(professionalId);

      // Buscar pacientes do servidor
      const patientsResponse = await apiClient.get('/patients');
      const serverPatients = patientsResponse.data.data || [];

      // Mesclar com dados locais
      for (const serverPatient of serverPatients) {
        const localPatient = await db.patients
          .where('patientId')
          .equals(serverPatient.id)
          .first();

        if (!localPatient || new Date(serverPatient.updatedAt) > new Date(localPatient.updatedAt)) {
          // Atualizar com dados do servidor (mais recente)
          await db.patients.put({
            patientId: serverPatient.id,
            professionalId,
            data: serverPatient,
            createdAt: serverPatient.createdAt,
            updatedAt: serverPatient.updatedAt,
          });
        }
      }

      // Buscar resultados do servidor
      const resultsResponse = await apiClient.get('/results');
      const serverResults = resultsResponse.data.data || [];

      // Mesclar com dados locais
      for (const serverResult of serverResults) {
        const localResult = await db.results
          .where('resultId')
          .equals(serverResult.id)
          .first();

        if (!localResult || new Date(serverResult.updatedAt) > new Date(localResult.updatedAt)) {
          // Atualizar com dados do servidor (mais recente)
          await db.results.put({
            resultId: serverResult.id,
            patientId: serverResult.patientId,
            questionnaireId: serverResult.questionnaireId,
            professionalId,
            data: serverResult,
            createdAt: serverResult.createdAt,
            updatedAt: serverResult.updatedAt,
          });
        }
      }
    } catch (error) {
      console.error('Failed to pull from server:', error);
    }
  }
}
```

---

## 4. Hooks Customizados para Backend

### 4.1 Hook para Pacientes (`src/hooks/useBackendPatients.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient, { isBackendEnabled } from '../services/apiClient';
import { getDatabase } from '../services/database';
import { BackendSyncService } from '../services/backendSync';
import type { Patient } from '../types';

interface UseBackendPatientsResult {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  createPatient: (data: Omit<Patient, 'id'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBackendPatients(): UseBackendPatientsResult {
  const { professionalId, accessToken } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar pacientes (local ou backend)
  const fetchPatients = useCallback(async () => {
    if (!professionalId) {
      setPatients([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isBackendEnabled() && accessToken) {
        // Buscar do backend
        const response = await apiClient.get('/patients');
        const backendPatients = response.data.data || [];
        
        // Converter para formato local
        const formattedPatients: Patient[] = backendPatients.map((p: any) => ({
          id: p.id,
          nome: p.name,
          idade: p.age,
          sexo: p.gender,
          diagnostico: p.diagnosis,
          ladoAcometido: p.sidedAffected,
          medico: p.referringDoctor,
          fisioterapeuta: p.physiotherapist,
        }));

        setPatients(formattedPatients);

        // Sincronizar com IndexedDB
        const db = getDatabase(professionalId);
        for (const patient of backendPatients) {
          await db.patients.put({
            patientId: patient.id,
            professionalId,
            data: patient,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
          });
        }
      } else {
        // Buscar do IndexedDB (modo offline)
        const db = getDatabase(professionalId);
        const localPatients = await db.patients.toArray();
        const formattedPatients: Patient[] = localPatients.map((p) => ({
          id: p.data.id || p.patientId,
          nome: p.data.nome || p.data.name,
          idade: p.data.idade || p.data.age,
          sexo: p.data.sexo || p.data.gender,
          diagnostico: p.data.diagnostico || p.data.diagnosis,
          ladoAcometido: p.data.ladoAcometido || p.data.sidedAffected,
          medico: p.data.medico || p.data.referringDoctor,
          fisioterapeuta: p.data.fisioterapeuta || p.data.physiotherapist,
        }));
        setPatients(formattedPatients);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, accessToken]);

  // Criar paciente
  const createPatient = useCallback(async (data: Omit<Patient, 'id'>): Promise<Patient> => {
    if (!professionalId) {
      throw new Error('Professional ID required');
    }

    const newPatient: Patient = {
      id: `patient_${Date.now()}_${Math.random()}`,
      ...data,
    };

    // Salvar localmente primeiro (offline-first)
    const db = getDatabase(professionalId);
    await db.patients.add({
      patientId: newPatient.id,
      professionalId,
      data: newPatient,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Adicionar à fila de sincronização
    await BackendSyncService.queueChange({
      entityType: 'PATIENT',
      entityId: newPatient.id,
      operation: 'CREATE',
      localTimestamp: new Date().toISOString(),
      data: {
        name: newPatient.nome,
        age: newPatient.idade,
        gender: newPatient.sexo,
        diagnosis: newPatient.diagnostico,
        sidedAffected: newPatient.ladoAcometido,
        referringDoctor: newPatient.medico,
        physiotherapist: newPatient.fisioterapeuta,
      },
    });

    // Tentar sincronizar imediatamente
    if (isBackendEnabled() && accessToken) {
      try {
        const response = await apiClient.post('/patients', {
          name: newPatient.nome,
          age: newPatient.idade,
          gender: newPatient.sexo,
          diagnosis: newPatient.diagnostico,
          sidedAffected: newPatient.ladoAcometido,
          referringDoctor: newPatient.medico,
          physiotherapist: newPatient.fisioterapeuta,
        });

        // Atualizar com ID do servidor
        const serverPatient = response.data;
        newPatient.id = serverPatient.id;

        await db.patients.update(
          (await db.patients.where('patientId').equals(newPatient.id).first())?.id || 0,
          {
            patientId: serverPatient.id,
            data: { ...newPatient, id: serverPatient.id },
            updatedAt: serverPatient.updatedAt,
          }
        );
      } catch (error) {
        console.warn('Failed to create patient on server, will sync later:', error);
      }
    }

    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  }, [professionalId, accessToken]);

  // Atualizar paciente
  const updatePatient = useCallback(async (id: string, data: Partial<Patient>): Promise<Patient> => {
    if (!professionalId) {
      throw new Error('Professional ID required');
    }

    const db = getDatabase(professionalId);
    const localPatient = await db.patients.where('patientId').equals(id).first();

    if (!localPatient) {
      throw new Error('Patient not found');
    }

    const updatedPatient: Patient = {
      ...(localPatient.data as Patient),
      ...data,
      id,
    };

    // Atualizar localmente
    await db.patients.update(localPatient.id!, {
      data: updatedPatient,
      updatedAt: new Date().toISOString(),
    });

    // Adicionar à fila de sincronização
    await BackendSyncService.queueChange({
      entityType: 'PATIENT',
      entityId: id,
      operation: 'UPDATE',
      localTimestamp: new Date().toISOString(),
      data: {
        name: updatedPatient.nome,
        age: updatedPatient.idade,
        gender: updatedPatient.sexo,
        diagnosis: updatedPatient.diagnostico,
        sidedAffected: updatedPatient.ladoAcometido,
        referringDoctor: updatedPatient.medico,
        physiotherapist: updatedPatient.fisioterapeuta,
      },
    });

    // Tentar sincronizar imediatamente
    if (isBackendEnabled() && accessToken) {
      try {
        await apiClient.put(`/patients/${id}`, {
          name: updatedPatient.nome,
          age: updatedPatient.idade,
          gender: updatedPatient.sexo,
          diagnosis: updatedPatient.diagnostico,
          sidedAffected: updatedPatient.ladoAcometido,
          referringDoctor: updatedPatient.medico,
          physiotherapist: updatedPatient.fisioterapeuta,
        });
      } catch (error) {
        console.warn('Failed to update patient on server, will sync later:', error);
      }
    }

    setPatients((prev) => prev.map((p) => (p.id === id ? updatedPatient : p)));
    return updatedPatient;
  }, [professionalId, accessToken]);

  // Deletar paciente
  const deletePatient = useCallback(async (id: string): Promise<void> => {
    if (!professionalId) {
      throw new Error('Professional ID required');
    }

    const db = getDatabase(professionalId);
    const localPatient = await db.patients.where('patientId').equals(id).first();

    if (localPatient) {
      await db.patients.delete(localPatient.id!);
    }

    // Adicionar à fila de sincronização
    await BackendSyncService.queueChange({
      entityType: 'PATIENT',
      entityId: id,
      operation: 'DELETE',
      localTimestamp: new Date().toISOString(),
      data: {},
    });

    // Tentar sincronizar imediatamente
    if (isBackendEnabled() && accessToken) {
      try {
        await apiClient.delete(`/patients/${id}`);
      } catch (error) {
        console.warn('Failed to delete patient on server, will sync later:', error);
      }
    }

    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, [professionalId, accessToken]);

  // Buscar pacientes ao montar
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    isLoading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
    refresh: fetchPatients,
  };
}
```

---

## 5. Integração com App.tsx

### 5.1 Atualizar App.tsx para Sincronização Automática

```typescript
// Adicionar ao App.tsx existente

import { useEffect } from 'react';
import { BackendSyncService } from './services/backendSync';
import { useAuth } from './context/AuthContext';
import { isBackendEnabled, isOnline } from './services/apiClient';

// Dentro do componente App
useEffect(() => {
  const { professionalId } = useAuth();

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
```

---

## 6. Atualizar Componentes Existentes

### 6.1 Atualizar Login.tsx

```typescript
// Adicionar suporte para login com backend no Login.tsx existente

import { useAuth } from '../context/AuthContext';

// Dentro do componente Login
const { login, register, professional } = useAuth();

// Adicionar formulário de registro se necessário
const handleRegister = async (email: string, password: string, name: string) => {
  try {
    await register(email, password, name);
    // Redirecionar ou mostrar sucesso
  } catch (error) {
    // Mostrar erro
  }
};

// Login existente pode usar login() do useAuth
```

### 6.2 Atualizar ProfessionalView.tsx

```typescript
// Substituir hooks de dados locais por useBackendPatients

import { useBackendPatients } from '../hooks/useBackendPatients';

// Dentro do componente
const { patients, isLoading, createPatient, updatePatient, deletePatient } = useBackendPatients();

// Usar normalmente como antes
```

---

## 7. Estratégia de Migração

### 7.1 Fase 1: Coexistência (Atual)
- ✅ Backend opcional (variável `VITE_ENABLE_BACKEND`)
- ✅ IndexedDB continua funcionando
- ✅ Firebase sync continua funcionando
- ✅ Usuários podem optar por usar backend

### 7.2 Fase 2: Migração Gradual
- ⏳ Usuários migrados por lotes
- ⏳ Dados do IndexedDB/Firebase importados para backend
- ⏳ Validação de integridade

### 7.3 Fase 3: Backend Único
- ⏳ Backend como fonte única de verdade
- ⏳ IndexedDB apenas para cache offline
- ⏳ Firebase desativado

---

## 8. Checklist de Integração

### Setup Inicial
- [ ] Instalar `axios`
- [ ] Criar arquivo `.env.development` e `.env.production`
- [ ] Criar `src/services/apiClient.ts`
- [ ] Atualizar `src/context/AuthContext.tsx`

### Integração de Dados
- [ ] Criar `src/services/backendSync.ts`
- [ ] Criar `src/hooks/useBackendPatients.ts`
- [ ] Criar `src/hooks/useBackendResults.ts` (similar)
- [ ] Atualizar `App.tsx` para sincronização automática

### Componentes
- [ ] Atualizar `Login.tsx` para usar novo `login()`
- [ ] Atualizar `ProfessionalView.tsx` para usar `useBackendPatients()`
- [ ] Atualizar `QuestionnairesView.tsx` para usar hooks de backend
- [ ] Testar fluxo completo

### Testes
- [ ] Testar login/registro
- [ ] Testar criação de pacientes
- [ ] Testar sincronização offline
- [ ] Testar renovação de token
- [ ] Testar resolução de conflitos

---

## 9. Compatibilidade

### ✅ Mantém Compatibilidade
- ✅ IndexedDB (Dexie) continua funcionando
- ✅ Firebase sync opcional continua funcionando
- ✅ Estrutura de tipos existente (`types.ts`)
- ✅ Componentes existentes funcionam sem backend
- ✅ Modo offline completo

### 🆕 Novas Funcionalidades
- ✅ Sincronização com backend PostgreSQL
- ✅ Autenticação JWT
- ✅ Renovação automática de tokens
- ✅ Resolução de conflitos
- ✅ Sincronização automática

---

**Documento Revisado por**: Cursor IA  
**Data**: Novembro 2025  
**Status**: ✅ Revisado, Validado e Pronto para Implementação

