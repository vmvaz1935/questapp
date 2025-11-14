import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, setAccessToken as setClientAccessToken, ApiError } from "../services/api";

interface ProfessionalSummary {
  id: string;
  email: string;
  name: string;
  planType?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
}

interface TwoFactorSetupPayload {
  secret: string;
  qrCode: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  professional: ProfessionalSummary | null;
  pendingProfessionalId: string | null;
  twoFactorRequired: boolean;
  twoFactorSetup: TwoFactorSetupPayload | null;
  isLoading: boolean;
  error: string | null;

  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  verifyTwoFactor: (token: string) => Promise<void>;
  setupTwoFactor: () => Promise<void>;
  confirmTwoFactor: (token: string) => Promise<string[]>;
  disableTwoFactor: () => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  clearError: () => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      professional: null,
      pendingProfessionalId: null,
      twoFactorRequired: false,
      twoFactorSetup: null,
      isLoading: false,
      error: null,

      setTokens: (accessToken, refreshToken) => {
        setClientAccessToken(accessToken);
        set({ accessToken, refreshToken });
      },

      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post<{
            accessToken: string;
            refreshToken: string;
            professional: ProfessionalSummary;
          }>("/auth/register", { email, password, name });

          get().setTokens(data.accessToken, data.refreshToken);
          set({
            professional: data.professional,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post<
            | {
                accessToken: string;
                refreshToken: string;
                professional: ProfessionalSummary;
              }
            | {
                requiresTwoFactor: true;
                professionalId: string;
                tempToken: string;
              }
          >("/auth/login", { email, password });

          if ("requiresTwoFactor" in data) {
            get().setTokens(data.tempToken, null);
            set({
              twoFactorRequired: true,
              pendingProfessionalId: data.professionalId,
              isLoading: false,
            });
          } else {
            get().setTokens(data.accessToken, data.refreshToken);
            set({
              professional: data.professional,
              twoFactorRequired: false,
              pendingProfessionalId: null,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      verifyTwoFactor: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const professionalId = get().pendingProfessionalId;
          const payload = professionalId ? { professionalId, token } : { token };
          const { data } = await apiClient.post<{
            accessToken: string;
            refreshToken: string;
            professional: ProfessionalSummary;
          }>("/auth/2fa/verify", payload);

          get().setTokens(data.accessToken, data.refreshToken);
          set({
            professional: data.professional,
            twoFactorRequired: false,
            pendingProfessionalId: null,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      setupTwoFactor: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post<TwoFactorSetupPayload>("/auth/2fa/setup");
          set({
            twoFactorSetup: data,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      confirmTwoFactor: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const secret = get().twoFactorSetup?.secret;
          if (!secret) {
            throw new Error("Secret 2FA ausente. Inicie a configuração novamente.");
          }

          const { data } = await apiClient.post<{ backupCodes: string[] }>(
            "/auth/2fa/confirm",
            { secret, token },
          );

          const professional = get().professional;
          set({
            twoFactorSetup: null,
            professional: professional
              ? { ...professional, twoFactorEnabled: true }
              : professional,
            isLoading: false,
          });

          return data.backupCodes;
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      disableTwoFactor: async () => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete("/auth/2fa");
          const professional = get().professional;
          set({
            professional: professional
              ? { ...professional, twoFactorEnabled: false }
              : professional,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      loginWithGoogle: async (googleToken) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await apiClient.post<{
            accessToken: string;
            refreshToken: string;
            professional: ProfessionalSummary;
          }>("/auth/google", { token: googleToken });

          get().setTokens(data.accessToken, data.refreshToken);
          set({
            professional: data.professional,
            twoFactorRequired: false,
            pendingProfessionalId: null,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      requestPasswordReset: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post("/auth/password-reset/request", { email });
          set({ isLoading: false });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (token, password) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.post("/auth/password-reset/confirm", { token, password });
          set({ isLoading: false });
        } catch (error) {
          set({
            error: extractErrorMessage(error),
            isLoading: false,
          });
          throw error;
        }
      },

      refresh: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          throw new Error("Refresh token ausente");
        }

        try {
          const { data } = await apiClient.post<{ accessToken: string }>(
            "/auth/refresh",
            { refreshToken },
            { skipAuth: true },
          );
          get().setTokens(data.accessToken, refreshToken);
        } catch (error) {
          set({
            error: extractErrorMessage(error),
          });
          throw error;
        }
      },

      logout: async () => {
        const refreshToken = get().refreshToken;
        try {
          if (refreshToken) {
            await apiClient.post("/auth/logout", { refreshToken });
          }
        } catch (error) {
          console.warn("Erro no logout", error);
        } finally {
          get().setTokens(null, null);
          set({
            professional: null,
            pendingProfessionalId: null,
            twoFactorRequired: false,
          });
        }
      },

      logoutAll: async () => {
        try {
          await apiClient.post("/auth/logout-all");
        } catch (error) {
          console.warn("Erro ao sair de todas as sessões", error);
        } finally {
          get().setTokens(null, null);
          set({
            professional: null,
            pendingProfessionalId: null,
            twoFactorRequired: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        professional: state.professional,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          setClientAccessToken(state.accessToken);
        }
      },
    },
  ),
);
