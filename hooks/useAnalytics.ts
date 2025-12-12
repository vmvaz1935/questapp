import { useCallback } from 'react';
import { trackEvent, AnalyticsEvent, AnalyticsProperties } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para facilitar o uso de analytics
 * Adiciona automaticamente propriedades do contexto (user_id, plan_type, etc.)
 */
export function useAnalytics() {
  const { professionalId, isGoogleAuth } = useAuth();

  const track = useCallback(
    (event: AnalyticsEvent, properties: AnalyticsProperties = {}) => {
      // Adicionar propriedades do contexto
      const enrichedProperties: AnalyticsProperties = {
        ...properties,
        user_id: professionalId || undefined,
        plan_type: isGoogleAuth ? 'pro' : 'free', // [HIPÓTESE] Assumindo que Google Auth = Pro
      };

      trackEvent(event, enrichedProperties);
    },
    [professionalId, isGoogleAuth]
  );

  return { track };
}

