import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function TwoFactorVerify() {
  const navigate = useNavigate();
  const { verifyTwoFactor, isLoading, error, clearError } = useAuthStore((state) => ({
    verifyTwoFactor: state.verifyTwoFactor,
    isLoading: state.isLoading,
    error: state.error,
    clearError: state.clearError,
  }));

  const [token, setToken] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await verifyTwoFactor(token);
      navigate('/patients');
    } catch (verificationError) {
      console.error('Erro na verificação 2FA:', verificationError);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">Verificação em duas etapas</h1>
      <p className="text-sm text-gray-600 text-center">
        Informe o código do seu autenticador ou um código de backup.
      </p>
      <input
        value={token}
        onChange={(event) => setToken(event.target.value)}
        onFocus={() => error && clearError()}
        type="text"
        inputMode="numeric"
        maxLength={10}
        placeholder="000000"
        className="w-full p-2 border rounded text-center tracking-widest"
        required
      />
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-60"
      >
        {isLoading ? 'Verificando...' : 'Verificar'}
      </button>
    </form>
  );
}
