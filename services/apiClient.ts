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

