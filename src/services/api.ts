import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Verificar se estamos em produção e se há URL da API configurada
const getApiUrl = () => {
  // Se houver variável de ambiente, usar ela
  if ((import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }
  
  // Em produção (Vercel), tentar usar URL relativa ou variável de ambiente do Vercel
  if ((import.meta as any).env?.PROD) {
    // Se não houver backend configurado, retornar null para indicar que a API não está disponível
    return null;
  }
  
  // Em desenvolvimento, usar localhost
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

// Log para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('[API] Configuração:', {
    VITE_API_URL: (import.meta as any).env?.VITE_API_URL,
    API_URL: API_URL,
    PROD: (import.meta as any).env?.PROD,
  });
}

const apiClient = axios.create({
  baseURL: API_URL || '/api', // Fallback para URL relativa se não houver API_URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos de timeout
});

// Verificar se a API está disponível
if (!API_URL && (import.meta as any).env?.PROD) {
  console.warn('[API] Backend não configurado. Algumas funcionalidades podem não funcionar.');
  console.warn('[API] Para configurar, defina VITE_API_URL no arquivo .env ou nas variáveis de ambiente do Vercel.');
}

// Interceptor para logar erros de API
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detalhado de erros para debug
    if (error.response) {
      console.error('[API Error]', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('[API Error] Sem resposta do servidor:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
      });
    }
    return Promise.reject(error);
  }
);

// Interceptor para adicionar token e logar requisições
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log da URL completa em desenvolvimento
    if (import.meta.env.DEV) {
      const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
      console.log('[API Request]', {
        method: config.method?.toUpperCase(),
        url: fullUrl,
        baseURL: config.baseURL,
        path: config.url,
        hasToken: !!localStorage.getItem('accessToken'),
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const refreshUrl = API_URL ? `${API_URL}/auth/refresh` : '/api/auth/refresh';
        const response = await axios.post(refreshUrl, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, fazer logout
        if (import.meta.env.DEV) {
          console.error('[DEBUG] Refresh token falhou, fazendo logout', {
            error: refreshError,
            hadRefreshToken: !!refreshToken,
          });
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('professional');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

