import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Plan {
  id: 'free' | 'pro';
  name: string;
  price: string;
  priceValue: number;
  features: string[];
  popular?: boolean;
  limitPatients: number | null; // null = ilimitado
  limitQuestionnaires: number | null; // null = ilimitado
}

const LandingPage: React.FC<{ onLogin: (profileId: string, isGoogleAuth?: boolean, plan?: 'free' | 'pro') => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | null>(null);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 'R$ 0,00',
      priceValue: 0,
      features: [
        'Até 3 pacientes',
        'Geração de até 3 questionários',
        'Acesso a todos os tipos de questionários',
        'Relatórios básicos',
        'Suporte por email'
      ],
      limitPatients: 3,
      limitQuestionnaires: 3
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 'R$ 50,00',
      priceValue: 50,
      features: [
        'Pacientes ilimitados',
        'Questionários ilimitados',
        'Acesso a todos os tipos de questionários',
        'Relatórios avançados',
        'Exportação de dados',
        'Sincronização na nuvem',
        'Suporte prioritário'
      ],
      popular: true,
      limitPatients: null,
      limitQuestionnaires: null
    }
  ];

  const handlePlanSelect = (planId: 'free' | 'pro') => {
    navigate(`/login?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🩺</span>
            <h1 className="text-3xl font-bold text-blue-700 dark:text-white">
              FisioQ <span className="text-lg font-normal text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">Beta</span>
            </h1>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-label="Fazer login"
          >
            Entrar
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Questionários Clínicos para Fisioterapeutas
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Gerencie pacientes, aplique questionários validados e acompanhe a evolução do tratamento de forma profissional e eficiente.
          </p>
        </div>

        {/* Pricing Plans */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Escolha seu Plano
          </h3>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Comece grátis ou escolha o plano Pro para recursos ilimitados
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all transform hover:scale-105 ${
                  plan.popular
                    ? 'border-4 border-blue-500 ring-4 ring-blue-200 dark:ring-blue-900/30'
                    : 'border-2 border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h4>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{plan.price}</span>
                    {plan.priceValue > 0 && <span className="text-gray-600 dark:text-gray-400">/mês</span>}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.id === 'free' ? 'Começar Grátis' : 'Assinar Pro'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Recursos Inclusos
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📋</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Questionários Validados</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Acesso a mais de 25 questionários clínicos validados cientificamente
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📊</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Relatórios Detalhados</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Gere relatórios completos com gráficos e comparações temporais
              </p>
            </div>
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
              <div className="text-4xl mb-4">☁️</div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sincronização na Nuvem</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Acesse seus dados de qualquer dispositivo com sincronização automática
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>© 2024 FisioQ Beta. Todos os direitos reservados.</p>
          <p className="mt-2">
            <a href="#privacy" className="text-blue-600 hover:underline">Política de Privacidade</a> |{' '}
            <a href="#terms" className="text-blue-600 hover:underline">Termos de Uso</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

