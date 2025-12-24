// Serviço de sincronização entre localStorage e Firebase
// Usa imports dinâmicos para evitar erros quando Firebase não está instalado

// Tipos
interface SyncData {
  patients?: any[];
  results?: any[];
  questionnaires?: any[];
  profiles?: any[];
}

export interface VersionedData {
  data: any;
  timestamp: string;
  hash: string;
  version: number;
}

export interface ConflictData {
  dataKey: string;
  localVersion: VersionedData;
  remoteVersion: VersionedData;
}

// Função helper para gerar hash simples dos dados
function generateHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
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
      if (import.meta.env.DEV) {
        console.warn('[DEBUG] Firebase não configurado, pulando sincronização', { userId, dataKey });
      }
      return;
    }
    
    if (import.meta.env.DEV) {
      console.log('[DEBUG] Iniciando sincronização Firebase', { userId, dataKey, dataSize: JSON.stringify(data).length });
    }

    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    const timestamp = new Date().toISOString();
    const hash = generateHash(data);
    
    // Criar versão dos dados
    const versionedData: VersionedData = {
      data,
      timestamp,
      hash,
      version: userDoc.exists() ? (userDoc.data().version || 0) + 1 : 1,
    };
    
    const updateData: any = {};
    updateData[dataKey] = versionedData;
    updateData[`${dataKey}_metadata`] = {
      timestamp,
      hash,
      version: versionedData.version,
    };
    updateData.lastUpdated = timestamp;

    if (userDoc.exists()) {
      // Atualizar documento existente
      await updateDoc(userDocRef, updateData);
    } else {
      // Criar novo documento
      await setDoc(userDocRef, {
        userId,
        createdAt: timestamp,
        version: 1,
        ...updateData
      });
    }
  } catch (error) {
    // Firebase não instalado ou erro de conexão - ignorar
    // Os dados ainda estão salvos no localStorage
    if (import.meta.env.DEV) {
      console.error('[DEBUG] Erro ao sincronizar com Firebase', { userId, dataKey, error });
    }
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
      const docData = userDoc.data();
      const versionedData = docData[dataKey];
      
      // Se for dados versionados, retornar apenas os dados
      if (versionedData && versionedData.data !== undefined) {
        return versionedData;
      }
      
      // Compatibilidade com dados antigos
      return versionedData || null;
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
 * Detecta conflitos entre dados locais e remotos
 */
export async function detectConflicts(userId: string): Promise<ConflictData[]> {
  if (!userId) {
    return [];
  }

  const conflicts: ConflictData[] = [];
  const dataKeys = ['patients', 'results', 'questionnaires', 'profiles'];

  try {
    const [firebaseConfig, firebaseFirestore] = await Promise.all([
      import('../config/firebaseConfig').catch(() => null),
      import(/* @vite-ignore */ 'firebase/firestore').catch(() => null)
    ]);

    if (!firebaseConfig || !firebaseFirestore) {
      return [];
    }

    const { db, isFirebaseConfigured } = firebaseConfig;
    const { doc, getDoc } = firebaseFirestore;

    if (!isFirebaseConfigured || !db) {
      return [];
    }

    for (const dataKey of dataKeys) {
      // Carregar versão remota
      const remoteVersioned = await loadFromFirebase(userId, dataKey);
      if (!remoteVersioned) continue;

      // Carregar versão local
      const storageKey = dataKey === 'questionnaires' 
        ? 'published_questionnaires' 
        : `${dataKey}_${userId}`;
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      if (!localData || (Array.isArray(localData) && localData.length === 0)) {
        continue;
      }

      const localTimestamp = localStorage.getItem(`${storageKey}_timestamp`) || new Date(0).toISOString();
      const localHash = generateHash(localData);
      const remoteHash = remoteVersioned.hash || generateHash(remoteVersioned.data || remoteVersioned);

      // Detectar conflito: hashes diferentes e timestamps diferentes
      if (localHash !== remoteHash && localTimestamp !== remoteVersioned.timestamp) {
        conflicts.push({
          dataKey,
          localVersion: {
            data: localData,
            timestamp: localTimestamp,
            hash: localHash,
            version: parseInt(localStorage.getItem(`${storageKey}_version`) || '0', 10),
          },
          remoteVersion: {
            data: remoteVersioned.data || remoteVersioned,
            timestamp: remoteVersioned.timestamp,
            hash: remoteHash,
            version: remoteVersioned.version || 0,
          },
        });
      }
    }
  } catch (error) {
    console.error('Erro ao detectar conflitos:', error);
  }

  return conflicts;
}

/**
 * Resolve um conflito mantendo uma versão específica
 */
export function resolveConflict(
  dataKey: string,
  keepVersion: 'local' | 'remote' | 'merge',
  conflict: ConflictData
): void {
  const storageKey = dataKey === 'questionnaires' 
    ? 'published_questionnaires' 
    : `${dataKey}_${conflict.dataKey.includes('_') ? conflict.dataKey.split('_')[1] : ''}`;

  let finalData: any;
  let finalTimestamp: string;
  let finalVersion: number;

  switch (keepVersion) {
    case 'local':
      finalData = conflict.localVersion.data;
      finalTimestamp = conflict.localVersion.timestamp;
      finalVersion = conflict.localVersion.version;
      break;
    case 'remote':
      finalData = conflict.remoteVersion.data;
      finalTimestamp = conflict.remoteVersion.timestamp;
      finalVersion = conflict.remoteVersion.version;
      break;
    case 'merge':
      // Merge inteligente: combinar arrays únicos por ID
      if (Array.isArray(conflict.localVersion.data) && Array.isArray(conflict.remoteVersion.data)) {
        const localMap = new Map(conflict.localVersion.data.map((item: any) => [item.id, item]));
        const remoteMap = new Map(conflict.remoteVersion.data.map((item: any) => [item.id, item]));
        
        // Combinar: remoto tem prioridade em caso de IDs duplicados
        const merged = [...conflict.localVersion.data];
        conflict.remoteVersion.data.forEach((item: any) => {
          if (!localMap.has(item.id)) {
            merged.push(item);
          } else {
            // Atualizar item existente com versão mais recente
            const index = merged.findIndex((m: any) => m.id === item.id);
            if (index >= 0) {
              merged[index] = item;
            }
          }
        });
        finalData = merged;
      } else {
        // Para objetos não-array, usar versão mais recente
        finalData = new Date(conflict.remoteVersion.timestamp) > new Date(conflict.localVersion.timestamp)
          ? conflict.remoteVersion.data
          : conflict.localVersion.data;
      }
      finalTimestamp = new Date().toISOString();
      finalVersion = Math.max(conflict.localVersion.version, conflict.remoteVersion.version) + 1;
      break;
  }

  // Salvar versão escolhida
  localStorage.setItem(storageKey, JSON.stringify(finalData));
  localStorage.setItem(`${storageKey}_timestamp`, finalTimestamp);
  localStorage.setItem(`${storageKey}_version`, finalVersion.toString());
  
  // Salvar backup da versão descartada
  const backupKey = `${storageKey}_backup_${Date.now()}`;
  const discardedVersion = keepVersion === 'local' ? conflict.remoteVersion : conflict.localVersion;
  localStorage.setItem(backupKey, JSON.stringify({
    data: discardedVersion.data,
    timestamp: discardedVersion.timestamp,
    version: discardedVersion.version,
    reason: `Descartado em favor de versão ${keepVersion}`,
  }));
}

/**
 * Carrega todos os dados do usuário do Firebase para localStorage
 * Agora com detecção de conflitos
 */
export async function loadAllDataFromFirebase(userId: string): Promise<ConflictData[]> {
  if (!userId) {
    return [];
  }

  // Detectar conflitos antes de carregar
  const conflicts = await detectConflicts(userId);
  
  // Se houver conflitos, retornar para resolução pelo usuário
  if (conflicts.length > 0) {
    return conflicts;
  }

  try {
    // Carregar pacientes
    const patientsVersioned = await loadFromFirebase(userId, 'patients');
    if (patientsVersioned) {
      const patientsKey = `patients_${userId}`;
      const patients = patientsVersioned.data || patientsVersioned;
      if (Array.isArray(patients) && patients.length > 0) {
        localStorage.setItem(patientsKey, JSON.stringify(patients));
        localStorage.setItem(`${patientsKey}_timestamp`, patientsVersioned.timestamp);
        localStorage.setItem(`${patientsKey}_version`, String(patientsVersioned.version || 1));
      }
    }

    // Carregar resultados
    const resultsVersioned = await loadFromFirebase(userId, 'results');
    if (resultsVersioned) {
      const resultsKey = `results_${userId}`;
      const results = resultsVersioned.data || resultsVersioned;
      if (Array.isArray(results) && results.length > 0) {
        localStorage.setItem(resultsKey, JSON.stringify(results));
        localStorage.setItem(`${resultsKey}_timestamp`, resultsVersioned.timestamp);
        localStorage.setItem(`${resultsKey}_version`, String(resultsVersioned.version || 1));
      }
    }

    // Carregar questionários
    const questionnairesVersioned = await loadFromFirebase(userId, 'questionnaires');
    if (questionnairesVersioned) {
      const questionnaires = questionnairesVersioned.data || questionnairesVersioned;
      if (Array.isArray(questionnaires) && questionnaires.length > 0) {
        localStorage.setItem('published_questionnaires', JSON.stringify(questionnaires));
        localStorage.setItem('published_questionnaires_timestamp', questionnairesVersioned.timestamp);
        localStorage.setItem('published_questionnaires_version', String(questionnairesVersioned.version || 1));
      }
    }

    console.log('Dados do Firebase carregados');
  } catch (error) {
    console.error('Erro ao carregar dados do Firebase:', error);
  }

  return [];
}
