/**
 * Configuração do Sentry para error tracking
 * Opt-in via variável de ambiente
 */

export async function initSentry() {
  // Verificar se Sentry deve ser carregado (via env var)
  const enableSentry = import.meta.env.VITE_ENABLE_SENTRY === 'true';
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!enableSentry || !sentryDsn) {
    console.log('Sentry desabilitado ou DSN não configurado');
    return;
  }

  try {
    const Sentry = await import('@sentry/react');
    
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% das transações
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% das sessões
      replaysOnErrorSampleRate: 1.0, // 100% em caso de erro
      environment: import.meta.env.MODE || 'development',
      // Não enviar dados pessoais
      beforeSend(event, hint) {
        // Filtrar dados sensíveis
        if (event.request) {
          // Remover dados sensíveis da URL
          if (event.request.url) {
            event.request.url = event.request.url.replace(/[?&]token=[^&]*/gi, '[FILTRADO]');
            event.request.url = event.request.url.replace(/[?&]apiKey=[^&]*/gi, '[FILTRADO]');
          }
          // Remover headers sensíveis
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['x-api-key'];
          }
        }
        // Remover dados pessoais do contexto
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });

    console.log('Sentry inicializado com sucesso');
  } catch (error) {
    console.warn('Erro ao inicializar Sentry:', error);
  }
}

/**
 * Captura erro manualmente
 */
export async function captureException(error: Error, context?: Record<string, any>) {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureException(error, {
      extra: context,
    });
  } catch (e) {
    console.warn('Erro ao capturar exceção no Sentry:', e);
  }
}

/**
 * Captura mensagem manualmente
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  try {
    const Sentry = await import('@sentry/react');
    Sentry.captureMessage(message, level);
  } catch (e) {
    console.warn('Erro ao capturar mensagem no Sentry:', e);
  }
}

