// Helper para importar Firebase de forma segura (quando não instalado)
// Este arquivo tenta importar Firebase apenas se disponível

let firebaseAuthModule: any = null;
let firebaseConfigModule: any = null;
let firebaseSyncModule: any = null;
let isFirebaseAvailable = false;

/**
 * Verifica se o Firebase está disponível e carrega os módulos
 */
export async function loadFirebaseIfAvailable() {
  if (isFirebaseAvailable) {
    return {
      firebaseAuth: firebaseAuthModule,
      firebaseConfig: firebaseConfigModule,
      firebaseSync: firebaseSyncModule
    };
  }

  try {
    // Usar import dinâmico com string para evitar resolução durante build
    // O Vite tentará resolver, mas com try-catch isso não quebra a aplicação
    const firebaseAuthPath = 'firebase/auth';
    const firebaseConfigPath = '../config/firebaseConfig';
    const firebaseSyncPath = '../services/firebaseSync';
    
    // Criar função que tenta importar de forma segura
    // Usar @vite-ignore para evitar análise estática do Vite
    const tryImport = async (path: string) => {
      try {
        // @ts-ignore - import dinâmico com string
        if (path === 'firebase/auth' || path === 'firebase/app' || path === 'firebase/firestore') {
          // @ts-ignore - importação dinâmica do Firebase
          return await import(/* @vite-ignore */ path);
        }
        // @ts-ignore - import dinâmico com string
        return await import(path);
      } catch {
        return null;
      }
    };

    const [auth, config, sync] = await Promise.all([
      tryImport(firebaseAuthPath).catch(() => null),
      tryImport(firebaseConfigPath).catch(() => null),
      tryImport(firebaseSyncPath).catch(() => null)
    ]);

    if (auth && config && sync) {
      // Inicializar Firebase se configurado
      const firebaseInit = await config.getFirebase?.().catch(() => null);
      
      firebaseAuthModule = auth;
      firebaseConfigModule = {
        ...config,
        auth: firebaseInit?.auth || null,
        db: firebaseInit?.db || null,
        googleProvider: firebaseInit?.googleProvider || null
      };
      firebaseSyncModule = sync;
      isFirebaseAvailable = true;
      return { firebaseAuth: auth, firebaseConfig: firebaseConfigModule, firebaseSync: sync };
    }
  } catch (error) {
    // Firebase não instalado - ignorar
    // Não logar erro para não poluir o console quando Firebase não está instalado
  }

  return { firebaseAuth: null, firebaseConfig: null, firebaseSync: null };
}

/**
 * Faz signOut do Firebase se disponível
 */
export async function signOutIfAvailable(authInstance: any) {
  try {
    const { firebaseAuth } = await loadFirebaseIfAvailable();
    if (firebaseAuth && firebaseAuth.signOut && authInstance) {
      await firebaseAuth.signOut(authInstance);
    }
  } catch (error) {
    // Ignorar erros
    console.warn('Erro ao fazer signOut do Firebase:', error);
  }
}

