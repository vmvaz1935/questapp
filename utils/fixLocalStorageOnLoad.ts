/**
 * Limpa valores inválidos do localStorage imediatamente na inicialização
 * Deve ser chamado ANTES de qualquer hook useLocalStorage
 */
export function fixLocalStorageOnLoad() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // Lista de chaves que podem ter valores inválidos
    const keysToCheck: string[] = [];
    
    // Coletar todas as chaves que começam com "user_plan_"
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_plan_')) {
        keysToCheck.push(key);
      }
    }
    
    // Corrigir cada chave
    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (!value) return;
        
        // Verificar se é um valor inválido (string direta sem JSON)
        const trimmed = value.trim();
        if (trimmed === 'pro' || trimmed === 'free') {
          // Se não começa com aspas, é inválido
          if (!value.startsWith('"')) {
            console.log(`🔧 Corrigindo ${key}: "${value}" → ${JSON.stringify(trimmed)}`);
            localStorage.setItem(key, JSON.stringify(trimmed));
          }
        } else {
          // Tentar fazer parse para verificar se é JSON válido
          try {
            JSON.parse(value);
          } catch (e) {
            // Não é JSON válido - limpar
            console.log(`🗑️ Removendo valor inválido ${key}: "${value}"`);
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error(`Erro ao processar ${key}:`, error);
      }
    });
  } catch (error) {
    console.error('Erro ao corrigir localStorage:', error);
  }
}

