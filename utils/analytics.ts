/**
 * Analytics com Plausible (privacy-first)
 * Opt-in via variável de ambiente
 */

export interface PlausibleEvent {
  name: string;
  props?: Record<string, string | number>;
  revenue?: { currency: string; amount: number };
}

/**
 * Inicializa Plausible (se configurado)
 */
export function initPlausible() {
  const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
  const plausibleScript = import.meta.env.VITE_PLAUSIBLE_SCRIPT || 'https://plausible.io/js/script.js';

  if (!plausibleDomain) {
    console.log('[Analytics] Plausible não configurado (VITE_PLAUSIBLE_DOMAIN não definido)');
    return;
  }

  // Adicionar script do Plausible
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = plausibleDomain;
  script.src = plausibleScript;
  document.head.appendChild(script);

  // Inicializar função global
  (window as any).plausible =
    (window as any).plausible ||
    function (...args: any[]) {
      ((window as any).plausible.q = (window as any).plausible.q || []).push(args);
    };

  console.log('[Analytics] Plausible inicializado:', plausibleDomain);
}

/**
 * Registra um evento no Plausible
 */
export function trackEvent(eventName: string, props?: Record<string, string | number>) {
  if (typeof window === 'undefined' || !(window as any).plausible) {
    return;
  }

  try {
    (window as any).plausible(eventName, {
      props: props || {},
    });
  } catch (error) {
    console.warn('[Analytics] Erro ao rastrear evento:', error);
  }
}

/**
 * Track pageview manualmente (se necessário)
 */
export function trackPageview(path?: string) {
  if (typeof window === 'undefined' || !(window as any).plausible) {
    return;
  }

  try {
    (window as any).plausible('pageview', {
      u: path || window.location.pathname,
    });
  } catch (error) {
    console.warn('[Analytics] Erro ao rastrear pageview:', error);
  }
}

/**
 * Eventos comuns do FisioQ
 */
export const AnalyticsEvents = {
  // Autenticação
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  GOOGLE_LOGIN: 'google_login',

  // Pacientes
  PATIENT_CREATED: 'patient_created',
  PATIENT_UPDATED: 'patient_updated',
  PATIENT_DELETED: 'patient_deleted',

  // Questionários
  QUESTIONNAIRE_STARTED: 'questionnaire_started',
  QUESTIONNAIRE_COMPLETED: 'questionnaire_completed',
  QUESTIONNAIRE_EXPORTED: 'questionnaire_exported',
  QUESTIONNAIRE_EXPORT_PDF: 'questionnaire_export_pdf',
  QUESTIONNAIRE_EXPORT_CSV: 'questionnaire_export_csv',
  QUESTIONNAIRE_EXPORT_JSON: 'questionnaire_export_json',

  // Planos
  PLAN_SELECTED: 'plan_selected',
  PLAN_UPGRADED: 'plan_upgraded',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',

  // Navegação
  NAVIGATION: 'navigation',
  PRIVACY_VIEWED: 'privacy_viewed',
  CONSENT_ACCEPTED: 'consent_accepted',
  CONSENT_DECLINED: 'consent_declined',
} as const;

