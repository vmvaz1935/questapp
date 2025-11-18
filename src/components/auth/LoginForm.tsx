import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { GoogleLoginButton } from './GoogleLoginButton';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, isLoading, error, twoFactorRequired } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      if (twoFactorRequired) {
        navigate('/verify-2fa');
      } else {
        navigate('/patients');
      }
    } catch (err) {
      // Erro já está no store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-2">
          FisioQ <span className="text-xs font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">Beta</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
          </div>
        </div>

        {/* Google Login Button */}
        <GoogleLoginButton
          onSuccess={() => navigate('/patients')}
          onError={(error) => console.error('Erro no login Google:', error)}
        />

        <div className="mt-4 text-center">
          <Link
            to="/forgot-password"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Esqueci minha senha
          </Link>
        </div>

        <div className="mt-4 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Não tem conta? </span>
          <Link
            to="/register"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
};

