// Configuração do Firebase
// IMPORTANTE: Substitua estas credenciais pelas suas próprias do Firebase Console
// Obtenha estas credenciais em: https://console.firebase.google.com/
// Este arquivo usa exports dinâmicos para evitar erros quando Firebase não está instalado

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Verificar se as credenciais estão configuradas
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && 
                              firebaseConfig.projectId !== "YOUR_PROJECT_ID";

// Variáveis para armazenar instâncias do Firebase (carregadas dinamicamente)
let firebaseApp: any = null;
let firebaseAuth: any = null;
let firebaseDb: any = null;
let firebaseGoogleProvider: any = null;

// Função para inicializar Firebase quando necessário
async function initializeFirebase() {
  if (firebaseApp) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, googleProvider: firebaseGoogleProvider };
  }

  if (!isFirebaseConfigured) {
    return { app: null, auth: null, db: null, googleProvider: null };
  }

  try {
    // Usar @vite-ignore para evitar análise estática do Vite
    // @ts-ignore - importação dinâmica
    const firebaseAppModule = await import(/* @vite-ignore */ 'firebase/app').catch(() => null);
    // @ts-ignore - importação dinâmica
    const firebaseAuthModule = await import(/* @vite-ignore */ 'firebase/auth').catch(() => null);
    // @ts-ignore - importação dinâmica
    const firebaseFirestoreModule = await import(/* @vite-ignore */ 'firebase/firestore').catch(() => null);

    if (!firebaseAppModule || !firebaseAuthModule || !firebaseFirestoreModule) {
      return { app: null, auth: null, db: null, googleProvider: null };
    }

    const { initializeApp } = firebaseAppModule;
    const { getAuth, GoogleAuthProvider } = firebaseAuthModule;
    const { getFirestore } = firebaseFirestoreModule;

    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    firebaseGoogleProvider = new GoogleAuthProvider();
    
    // Configurar escopo do Google
    firebaseGoogleProvider.addScope('profile');
    firebaseGoogleProvider.addScope('email');
    
    console.log('Firebase inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    return { app: null, auth: null, db: null, googleProvider: null };
  }

  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, googleProvider: firebaseGoogleProvider };
}

// Exportar funções e variáveis (lazy loading)
export const getFirebase = initializeFirebase;
export { isFirebaseConfigured };

// Exportar getters que inicializam Firebase quando necessário
export const app = firebaseApp;
export const auth = firebaseAuth;
export const db = firebaseDb;
export const googleProvider = firebaseGoogleProvider;

// Inicializar Firebase automaticamente se configurado (opcional)
if (isFirebaseConfigured) {
  initializeFirebase().catch(() => {
    // Ignorar erros na inicialização automática
  });
}
