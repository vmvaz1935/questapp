import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';

interface Professional {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
}

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  professional: Professional | null;
  twoFactorRequired: boolean;
  twoFactorSetup: TwoFactorSetup | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyTwoFactor: (professionalId: string, token: string) => Promise<void>;
  setupTwoFactor: () => Promise<TwoFactorSetup>;
  confirmTwoFactor: (token: string) => Promise<string[]>;
  disableTwoFactor: () => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      professional: null,
      twoFactorRequired: false,
      twoFactorSetup: null,
      isLoading: false,
      error: null,

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/register', {
            email,
            password,
            name,
          });

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            professional: response.data.professional,
            isLoading: false,
          });

          // Salvar tokens no localStorage para o interceptor
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao registrar';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/login', {
            email,
            password,
          });

          if (response.data.requiresTwoFactor) {
            set({
              twoFactorRequired: true,
              accessToken: response.data.tempToken,
              professional: { id: response.data.professionalId, email: '', name: '', emailVerified: false },
              isLoading: false,
            });
            localStorage.setItem('accessToken', response.data.tempToken);
          } else {
            set({
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              professional: response.data.professional,
              twoFactorRequired: false,
              isLoading: false,
            });
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao fazer login';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      verifyTwoFactor: async (professionalId, token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/2fa/verify', {
            professionalId,
            token,
          });

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            professional: response.data.professional,
            twoFactorRequired: false,
            isLoading: false,
          });

          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao verificar 2FA';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      setupTwoFactor: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/2fa/setup');
          const setup: TwoFactorSetup = {
            secret: response.data.secret,
            qrCode: response.data.qrCode,
            backupCodes: response.data.backupCodes,
          };
          set({
            twoFactorSetup: setup,
            isLoading: false,
          });
          return setup;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao configurar 2FA';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      confirmTwoFactor: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const { twoFactorSetup } = get();
          if (!twoFactorSetup) {
            throw new Error('Setup 2FA não encontrado');
          }

          const response = await apiClient.post('/auth/2fa/confirm', {
            secret: twoFactorSetup.secret,
            token,
          });

          set({
            twoFactorSetup: null,
            isLoading: false,
          });

          return response.data.backupCodes;
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao confirmar 2FA';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      disableTwoFactor: async () => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete('/auth/2fa');
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao desativar 2FA';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      loginWithGoogle: async (googleToken) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/auth/google', {
            token: googleToken,
          });

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            professional: response.data.professional,
            isLoading: false,
          });

          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao fazer login com Google';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      requestPasswordReset: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/password-reset/request', { email });
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao solicitar reset de senha';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/password-reset/confirm', {
            token,
            password,
          });
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao resetar senha';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      sendVerificationEmail: async () => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post('/auth/verify-email/send');
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Erro ao enviar email de verificação';
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await apiClient.post('/auth/logout', { refreshToken });
          }
        } catch (error) {
          console.error('Erro ao fazer logout:', error);
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            professional: null,
            twoFactorRequired: false,
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      logoutAll: async () => {
        try {
          await apiClient.post('/auth/logout-all');
        } catch (error) {
          console.error('Erro ao fazer logout de todos os dispositivos:', error);
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            professional: null,
            twoFactorRequired: false,
          });
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        professional: state.professional,
      }),
    }
  )
);

