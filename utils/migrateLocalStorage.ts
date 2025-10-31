/**
 * Função para migrar e corrigir valores inválidos no localStorage
 * Deve ser chamada uma vez na inicialização do app
 */
export function migrateLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // Procurar por todas as chaves que começam com "user_plan_"
    const keysToFix: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_plan_')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Tentar fazer parse
            JSON.parse(value);
            // Se passou, está OK
          }
        } catch (e) {
          // Se falhou o parse, adicionar à lista para corrigir
          keysToFix.push(key);
        }
      }
    }
    
    // Corrigir valores inválidos
    keysToFix.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        // Tentar determinar o valor correto
        const trimmed = value.trim();
        let correctValue: string = 'free'; // padrão
        
        if (trimmed === 'pro' || trimmed === '"pro"') {
          correctValue = 'pro';
        } else if (trimmed === 'free' || trimmed === '"free"') {
          correctValue = 'free';
        }
        
        // Armazenar corretamente em JSON
        try {
          localStorage.setItem(key, JSON.stringify(correctValue));
          console.log(`✓ Corrigido ${key}: "${value}" → "${JSON.stringify(correctValue)}"`);
        } catch (setError) {
          console.error(`Erro ao corrigir ${key}:`, setError);
          // Se não conseguiu corrigir, remover o valor inválido
          try {
            localStorage.removeItem(key);
            console.log(`✓ Removido valor inválido ${key}`);
          } catch (removeError) {
            console.error(`Erro ao remover ${key}:`, removeError);
          }
        }
      }
    });
    
    if (keysToFix.length > 0) {
      console.log(`Migração concluída: ${keysToFix.length} chave(s) corrigida(s).`);
    }
  } catch (error) {
    console.error('Erro durante migração do localStorage:', error);
  }
}

