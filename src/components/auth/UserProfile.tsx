import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const UserProfile: React.FC = () => {
  const { professional, logout, disableTwoFactor, setupTwoFactor } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSetup2FA = async () => {
    try {
      await setupTwoFactor();
      navigate('/setup-2fa');
    } catch (error) {
      console.error('Erro ao configurar 2FA:', error);
    }
  };

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Meu Perfil
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome
            </label>
            <p className="text-gray-900 dark:text-white">{professional.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white">{professional.email}</p>
            {!professional.emailVerified && (
              <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                ⚠️ Email não verificado
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Autenticação em Duas Etapas
            </label>
            <div className="flex items-center justify-between">
              <p className="text-gray-900 dark:text-white">
                {professional.twoFactorEnabled ? '✅ Ativado' : '❌ Desativado'}
              </p>
              {professional.twoFactorEnabled ? (
                <button
                  onClick={async () => {
                    if (confirm('Tem certeza que deseja desativar o 2FA?')) {
                      try {
                        await disableTwoFactor();
                        alert('2FA desativado com sucesso!');
                        window.location.reload();
                      } catch (error) {
                        alert('Erro ao desativar 2FA');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Desativar 2FA
                </button>
              ) : (
                <button
                  onClick={handleSetup2FA}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ativar 2FA
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};
