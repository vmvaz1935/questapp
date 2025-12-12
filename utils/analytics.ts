/**
 * Serviço de analytics para rastreamento de eventos
 * Implementa eventos críticos para análise de funis e comportamento do usuário
 */

export type AnalyticsEvent =
  | 'questionnaire_viewed'
  | 'questionnaire_started'
  | 'answer_changed'
  | 'autosave_ok'
  | 'autosave_error'
  | 'questionnaire_completed'
  | 'questionnaire_abandoned'
  | 'questionnaire_draft_saved'
  | 'pdf_generated'
  | 'pdf_downloaded'
  | 'sync_initiated'
  | 'sync_progress'
  | 'sync_success'
  | 'sync_conflict'
  | 'sync_error'
  | 'login_started'
  | 'login_success'
  | 'login_error'
  | '2fa_required'
  | '2fa_verified'
  | 'page_load'
  | 'offline_detected'
  | 'online_restored'
  | 'questionnaire_exported';

export interface AnalyticsProperties {
  questionnaire_id?: string;
  questionnaire_name?: string;
  questionnaire_items_count?: number;
  patient_id?: string;
  patient_age?: number;
  patient_sex?: string;
  item_id?: string;
  step_index?: number;
  total_steps?: number;
  time_spent_ms?: number;
  total_time_ms?: number;
  progress_pct?: number;
  answers_count?: number;
  score?: number;
  offline?: boolean;
  plan_type?: 'free' | 'pro';
  device_type?: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  error_message?: string;
  error_code?: string;
  method?: 'email' | 'google';
  user_id?: string;
  data_type?: string;
  items_synced?: number;
  total_items?: number;
  sync_duration_ms?: number;
  conflict_count?: number;
  retry_count?: number;
  route?: string;
  load_time_ms?: number;
  offline_duration_ms?: number;
  file_size_kb?: number;
  generation_time_ms?: number;
  last_item_id?: string;
}

// Armazenar eventos em memória (pode ser enviado para serviço externo depois)
let eventQueue: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; timestamp: number }> = [];

// Detectar tipo de dispositivo
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

// Detectar navegador
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'unknown';
}

// Detectar OS
function getOS(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'unknown';
}

/**
 * Rastreia um evento de analytics
 */
export function trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
  try {
    const timestamp = Date.now();
    
    // Adicionar propriedades padrão
    const enrichedProperties: AnalyticsProperties = {
      ...properties,
      device_type: properties.device_type || getDeviceType(),
      browser: properties.browser || getBrowser(),
      os: properties.os || getOS(),
      timestamp,
    };

    // Adicionar à fila
    eventQueue.push({
      event,
      properties: enrichedProperties,
      timestamp,
    });

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event, enrichedProperties);
    }

    // Enviar para serviço externo (se configurado)
    // Exemplo: sendToAnalyticsService(event, enrichedProperties);
    
    // Limitar tamanho da fila (manter últimos 100 eventos)
    if (eventQueue.length > 100) {
      eventQueue = eventQueue.slice(-100);
    }
  } catch (error) {
    console.error('Erro ao rastrear evento de analytics:', error);
  }
}

/**
 * Obtém a fila de eventos (útil para debug ou envio em lote)
 */
export function getEventQueue(): Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; timestamp: number }> {
  return [...eventQueue];
}

/**
 * Limpa a fila de eventos
 */
export function clearEventQueue(): void {
  eventQueue = [];
}

/**
 * Envia eventos em lote para serviço externo (implementar conforme necessário)
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  try {
    // Aqui você pode implementar o envio para seu serviço de analytics
    // Exemplo: await fetch('/api/analytics', { method: 'POST', body: JSON.stringify(eventQueue) });
    
    // Por enquanto, apenas limpa a fila após "enviar"
    clearEventQueue();
  } catch (error) {
    console.error('Erro ao enviar eventos de analytics:', error);
  }
}

// Detectar quando o usuário está saindo e enviar eventos pendentes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushEvents().catch(console.error);
  });

  // Enviar eventos periodicamente (a cada 30 segundos)
  setInterval(() => {
    flushEvents().catch(console.error);
  }, 30000);
}

