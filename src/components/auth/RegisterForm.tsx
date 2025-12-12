import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { GoogleLoginButton } from './GoogleLoginButton';

export const RegisterForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('As senhas não coincidem');
      return;
    }

    try {
      await register(email, password, name);
      navigate('/patients');
    } catch (err: any) {
      // Erro já está no store e será exibido na UI
      console.error('Erro ao criar conta:', err);
      
      // Se for erro de rede, mostrar mensagem mais amigável
      if (err.message?.includes('conectar ao servidor') || err.message?.includes('Network Error')) {
        // A mensagem já está sendo exibida pelo componente de erro
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-2">
          Criar Conta - FisioQ
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white"
              placeholder="Seu nome completo"
            />
          </div>

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
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial
            </p>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Confirmar Senha</label>
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
              <div className="font-semibold mb-1">Erro ao criar conta</div>
              <div>{error}</div>
              {error.includes('conectar ao servidor') && (
                <div className="mt-2 text-xs">
                  <p>O backend não está configurado ou não está acessível.</p>
                  <p>Por favor, configure a variável de ambiente VITE_API_URL no Vercel ou use o modo offline.</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg p-3 transition-colors"
          >
            {isLoading ? 'Criando conta...' : 'Criar Conta'}
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
          <span className="text-sm text-gray-600 dark:text-gray-400">Já tem conta? </span>
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
};

