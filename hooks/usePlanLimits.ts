import { useAuth } from '../context/AuthContext';
import useLocalStorage from './useLocalStorage';
import { PlanType } from '../types';

interface PlanLimits {
  plan: PlanType;
  maxPatients: number | null;
  maxQuestionnaires: number | null;
  canAddPatient: (currentCount: number) => boolean;
  canAddQuestionnaire: (currentCount: number) => boolean;
}

export const usePlanLimits = (): PlanLimits => {
  const { professionalId } = useAuth();
  
  // Garantir que professionalId não seja null/undefined para criar a chave
  const planKey = professionalId ? `user_plan_${professionalId}` : 'user_plan_temp';
  const [userPlan] = useLocalStorage<PlanType | null>(planKey, 'free');

  const plan: PlanType = (userPlan && (userPlan === 'free' || userPlan === 'pro')) ? userPlan : 'free';

  const limits = {
    free: {
      maxPatients: 3,
      maxQuestionnaires: 3
    },
    pro: {
      maxPatients: null,
      maxQuestionnaires: null
    }
  };

  const currentLimits = limits[plan];

  return {
    plan,
    maxPatients: currentLimits.maxPatients,
    maxQuestionnaires: currentLimits.maxQuestionnaires,
    canAddPatient: (currentCount: number) => {
      if (currentLimits.maxPatients === null) return true;
      return currentCount < currentLimits.maxPatients;
    },
    canAddQuestionnaire: (currentCount: number) => {
      if (currentLimits.maxQuestionnaires === null) return true;
      return currentCount < currentLimits.maxQuestionnaires;
    }
  };
};

