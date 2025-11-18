import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../services/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não fornecido');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await apiClient.get(`/auth/verify-email?token=${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verificado com sucesso!');
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Erro ao verificar email. Token inválido ou expirado.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Verificando Email...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Aguarde enquanto verificamos seu email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Email Verificado!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecionando para login...
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
            >
              Ir para login agora
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 dark:text-red-400 text-6xl mb-4">✗</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Erro na Verificação
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="space-y-2">
              <Link
                to="/login"
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ir para Login
              </Link>
              <button
                onClick={() => navigate('/register')}
                className="block w-full text-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:underline"
              >
                Criar nova conta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

