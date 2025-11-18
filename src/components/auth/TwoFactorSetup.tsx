import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const TwoFactorSetup: React.FC = () => {
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const navigate = useNavigate();
  const { setupTwoFactor, confirmTwoFactor, isLoading, error } = useAuthStore();

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    try {
      await setupTwoFactor();
    } catch (err) {
      console.error('Erro ao carregar setup 2FA:', err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const codes = await confirmTwoFactor(token);
      setBackupCodes(codes);
      setStep('backup');
    } catch (err) {
      // Erro já está no store
    }
  };

  const { twoFactorSetup } = useAuthStore();

  if (!twoFactorSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 text-center">
          Configurar Autenticação em Duas Etapas
        </h1>

        {step === 'qr' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              1. Escaneie o QR code com seu aplicativo autenticador (Google Authenticator, Authy, etc.)
            </p>

            <div className="flex justify-center">
              <img src={twoFactorSetup.qrCode} alt="QR Code 2FA" className="border-2 border-gray-300 rounded-lg" />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              2. Depois, digite o código de 6 dígitos gerado pelo aplicativo
            </p>

            <button
              onClick={() => setStep('verify')}
              className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg p-3 transition-colors"
            >
              Continuar
            </button>
          </div>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Código de Verificação</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
              disabled={isLoading || token.length !== 6}
              className="w-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg p-3 transition-colors"
            >
              {isLoading ? 'Verificando...' : 'Verificar e Ativar'}
            </button>

            <button
              type="button"
              onClick={() => setStep('qr')}
              className="w-full text-gray-600 dark:text-gray-400 hover:underline"
            >
              Voltar
            </button>
          </form>
        )}

        {step === 'backup' && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
                ⚠️ Guarde estes códigos de backup em local seguro!
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Use estes códigos caso perca acesso ao seu aplicativo autenticador.
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-white dark:bg-gray-800 rounded text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                // Copiar códigos para clipboard
                navigator.clipboard.writeText(backupCodes.join('\n'));
                alert('Códigos copiados para a área de transferência!');
                navigate('/patients');
              }}
              className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg p-3 transition-colors"
            >
              Copiar e Finalizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

