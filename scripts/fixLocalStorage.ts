// Script para limpar valores inválidos do localStorage
// Execute este script no console do navegador para corrigir valores incorretos

function fixLocalStorage() {
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
    console.log(`Corrigindo ${key}: valor inválido "${value}"`);
    
    // Tentar determinar o valor correto
    let correctValue = 'free'; // padrão
    if (value === 'pro' || value === '"pro"') {
      correctValue = 'pro';
    }
    
    // Armazenar corretamente em JSON
    localStorage.setItem(key, JSON.stringify(correctValue));
    console.log(`✓ ${key} corrigido para: ${JSON.stringify(correctValue)}`);
  });
  
  console.log(`Correção concluída. ${keysToFix.length} chave(s) corrigida(s).`);
}

// Auto-executar se estiver no navegador
if (typeof window !== 'undefined') {
  fixLocalStorage();
}

export default fixLocalStorage;

