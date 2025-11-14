import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function LoginForm() {
  const navigate = useNavigate();
  const {
    login,
    isLoading,
    error,
    twoFactorRequired,
    clearError,
  } = useAuthStore((state) => ({
    login: state.login,
    isLoading: state.isLoading,
    error: state.error,
    twoFactorRequired: state.twoFactorRequired,
    clearError: state.clearError,
  }));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(email, password);
      if (twoFactorRequired) {
        navigate('/verify-2fa');
      } else {
        navigate('/patients');
      }
    } catch (loginError) {
      console.error('Erro no login:', loginError);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onFocus={() => error && clearError()}
          required
          className="w-full p-2 border rounded"
          placeholder="seuemail@exemplo.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onFocus={() => error && clearError()}
          required
          className="w-full p-2 border rounded"
          placeholder="••••••••"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-60"
      >
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
