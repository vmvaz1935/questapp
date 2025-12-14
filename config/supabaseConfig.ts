// Configuração do Supabase
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// URL e chave do projeto Supabase
// Estas variáveis devem ser configuradas via .env
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://wahhoyqumzjbubecgvlh.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaGhveXF1bXpqYnViZWNndmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ5ODMsImV4cCI6MjA4MTIzMDk4M30.S1NrNPiymJ69dJxVuRKojx806aEh8t45XlAmFuqGISs';

// Verificar se as credenciais estão configuradas
export const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

// Cliente Supabase (singleton)
let supabaseClient: SupabaseClient | null = null;

/**
 * Obtém ou cria a instância do cliente Supabase
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    console.warn('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

/**
 * Obtém o ID do usuário autenticado
 */
export async function getCurrentUserId(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data: { user } } = await client.auth.getUser();
  return user?.id || null;
}

export default getSupabaseClient;

