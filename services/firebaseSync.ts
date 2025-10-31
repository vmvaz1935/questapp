// Serviço de sincronização entre localStorage e Firebase
// Usa imports dinâmicos para evitar erros quando Firebase não está instalado

// Tipos
interface SyncData {
  patients?: any[];
  results?: any[];
  questionnaires?: any[];
  profiles?: any[];
}

/**
 * Salva dados no Firebase (coloca em segundo plano, não bloqueia)
 */
export async function saveToFirebase(
  userId: string,
  dataKey: string,
  data: any
): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    // Tentar importar Firebase dinamicamente
    // Usar @vite-ignore para evitar análise estática do Vite
    const [firebaseConfig, firebaseFirestore] = await Promise.all([
      import('../config/firebaseConfig').catch(() => null),
      // @ts-ignore - importação dinâmica
      import(/* @vite-ignore */ 'firebase/firestore').catch(() => null)
    ]);

    if (!firebaseConfig || !firebaseFirestore) {
      // Firebase não instalado - retornar silenciosamente
      return;
    }

    const { db, isFirebaseConfigured } = firebaseConfig;
    const { doc, getDoc, setDoc, updateDoc } = firebaseFirestore;

    if (!isFirebaseConfigured || !db) {
      return;
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    const updateData: any = {};
    updateData[dataKey] = data;
    updateData.lastUpdated = new Date().toISOString();

    if (userDoc.exists()) {
      // Atualizar documento existente
      await updateDoc(userDocRef, updateData);
    } else {
      // Criar novo documento
      await setDoc(userDocRef, {
        userId,
        createdAt: new Date().toISOString(),
        ...updateData
      });
    }
  } catch (error) {
    // Firebase não instalado ou erro de conexão - ignorar
    // Os dados ainda estão salvos no localStorage
  }
}

/**
 * Carrega dados do Firebase
 */
export async function loadFromFirebase(
  userId: string,
  dataKey: string
): Promise<any | null> {
  if (!userId) {
    return null;
  }

  try {
    // Tentar importar Firebase dinamicamente
    // Usar @vite-ignore para evitar análise estática do Vite
    const [firebaseConfig, firebaseFirestore] = await Promise.all([
      import('../config/firebaseConfig').catch(() => null),
      // @ts-ignore - importação dinâmica
      import(/* @vite-ignore */ 'firebase/firestore').catch(() => null)
    ]);

    if (!firebaseConfig || !firebaseFirestore) {
      return null;
    }

    const { db, isFirebaseConfigured } = firebaseConfig;
    const { doc, getDoc } = firebaseFirestore;

    if (!isFirebaseConfigured || !db) {
      return null;
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data[dataKey] || null;
    }
  } catch (error) {
    // Firebase não instalado ou erro de conexão - retornar null
  }

  return null;
}

/**
 * Sincroniza todos os dados do usuário entre localStorage e Firebase
 */
export async function syncAllData(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    // Sincronizar pacientes
    const patientsKey = `patients_${userId}`;
    const patients = JSON.parse(localStorage.getItem(patientsKey) || '[]');
    await saveToFirebase(userId, 'patients', patients);

    // Sincronizar resultados
    const resultsKey = `results_${userId}`;
    const results = JSON.parse(localStorage.getItem(resultsKey) || '[]');
    await saveToFirebase(userId, 'results', results);

    // Sincronizar questionários publicados
    const questionnaires = JSON.parse(localStorage.getItem('published_questionnaires') || '[]');
    await saveToFirebase(userId, 'questionnaires', questionnaires);

    // Sincronizar perfis (se necessário)
    const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
    await saveToFirebase(userId, 'profiles', profiles);

    console.log('Sincronização com Firebase concluída');
  } catch (error) {
    // Ignorar erros de sincronização
  }
}

/**
 * Carrega todos os dados do usuário do Firebase para localStorage
 */
export async function loadAllDataFromFirebase(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    // Carregar pacientes
    const patients = await loadFromFirebase(userId, 'patients');
    if (patients && Array.isArray(patients) && patients.length > 0) {
      const patientsKey = `patients_${userId}`;
      const localPatients = JSON.parse(localStorage.getItem(patientsKey) || '[]');
      
      // Mesclar dados: Firebase tem prioridade se mais recente
      if (patients.length >= localPatients.length) {
        localStorage.setItem(patientsKey, JSON.stringify(patients));
      }
    }

    // Carregar resultados
    const results = await loadFromFirebase(userId, 'results');
    if (results && Array.isArray(results) && results.length > 0) {
      const resultsKey = `results_${userId}`;
      const localResults = JSON.parse(localStorage.getItem(resultsKey) || '[]');
      
      // Mesclar dados: Firebase tem prioridade se mais recente
      if (results.length >= localResults.length) {
        localStorage.setItem(resultsKey, JSON.stringify(results));
      }
    }

    // Carregar questionários
    const questionnaires = await loadFromFirebase(userId, 'questionnaires');
    if (questionnaires && Array.isArray(questionnaires) && questionnaires.length > 0) {
      const localQuestionnaires = JSON.parse(localStorage.getItem('published_questionnaires') || '[]');
      
      // Mesclar dados
      if (questionnaires.length >= localQuestionnaires.length) {
        localStorage.setItem('published_questionnaires', JSON.stringify(questionnaires));
      }
    }

    console.log('Dados do Firebase carregados');
  } catch (error) {
    // Ignorar erros de carregamento
  }
}
