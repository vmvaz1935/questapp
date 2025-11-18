import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const TwoFactorVerify: React.FC = () => {
  const [code, setCode] = useState('');
  const [searchParams] = useSearchParams();
  const professionalId = searchParams.get('professionalId');
  const navigate = useNavigate();
  const { verifyTwoFactor, isLoading, error, professional } = useAuthStore();

  useEffect(() => {
    if (!professionalId && !professional?.id) {
      navigate('/login');
    }
  }, [professionalId, professional, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = professionalId || professional?.id;
    if (!id) return;

    try {
      await verifyTwoFactor(id, code);
      navigate('/patients');
    } catch (err) {
      // Erro já está no store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
          Verificação em Duas Etapas
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 text-center">
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Código 2FA</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest"
              placeholder="000000"
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg p-3 transition-colors"
          >
            {isLoading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Voltar para login
          </button>
        </div>
      </div>
    </div>
  );
};

