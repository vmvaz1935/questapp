import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const PasswordReset: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { requestPasswordReset, resetPassword, isLoading, error } = useAuthStore();
  const [success, setSuccess] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      // Erro já está no store
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    if (!token) {
      alert('Token inválido');
      return;
    }

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Erro já está no store
    }
  };

  if (success && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md text-center">
          <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Email Enviado!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Verifique sua caixa de entrada e clique no link para resetar sua senha.
          </p>
          <Link
            to="/login"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    );
  }

  if (success && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md text-center">
          <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Senha Resetada!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecionando para login...
          </p>
        </div>
      </div>
    );
  }

  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
            Resetar Senha
          </h1>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial
              </p>
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg p-3 transition-colors"
            >
              {isLoading ? 'Resetando...' : 'Resetar Senha'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
          Esqueci Minha Senha
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
          Digite seu email e enviaremos um link para resetar sua senha
        </p>

        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white"
              placeholder="seu@email.com"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg p-3 transition-colors"
          >
            {isLoading ? 'Enviando...' : 'Enviar Link de Reset'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Voltar para login
          </Link>
        </div>
      </div>
    </div>
  );
};

