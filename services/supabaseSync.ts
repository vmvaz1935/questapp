// Serviço de sincronização entre localStorage/IndexedDB e Supabase
import { getSupabaseClient, getCurrentUserId } from '../config/supabaseConfig';

// Tipos
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
 * Salva dados no Supabase
 */
export async function saveToSupabase(
  userId: string,
  dataKey: string,
  data: any
): Promise<void> {
  if (!userId) {
    return;
  }

  const client = getSupabaseClient();
  if (!client) {
    console.warn('Supabase não configurado, pulando sincronização');
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const hash = generateHash(data);

    // Mapear dataKey para tabela Supabase
    const tableMap: Record<string, string> = {
      patients: 'fisioq_patients',
      results: 'fisioq_results',
      questionnaires: 'fisioq_questionnaires',
      drafts: 'fisioq_drafts',
    };

    const tableName = tableMap[dataKey];
    if (!tableName) {
      console.warn(`Tabela não encontrada para dataKey: ${dataKey}`);
      return;
    }

    // Preparar dados para inserção/atualização
    const payload: any = {
      user_id: userId,
      updated_at: timestamp,
      data_version: 1,
      data_hash: hash,
    };

    if (dataKey === 'patients') {
      // Para pacientes, salvar cada paciente individualmente
      if (Array.isArray(data)) {
        for (const patient of data) {
          const { id, nome, idade, sexo, diagnostico, ladoAcometido, fisioterapeuta, medico, ...otherData } = patient;
          
          // Mapear campos do Patient para colunas do Supabase
          const patientRecord: any = {
            id: patient.id || `patient_${Date.now()}_${Math.random()}`,
            user_id: userId,
            name: nome, // Mapear 'nome' para 'name'
            birth_date: idade ? new Date(new Date().getFullYear() - idade, 0, 1).toISOString().split('T')[0] : null,
            gender: sexo,
            notes: diagnostico || otherData.notes || null,
            updated_at: timestamp,
            data_version: 1,
            data_hash: hash,
          };
          
          // Adicionar campos extras como JSON se necessário
          if (ladoAcometido || fisioterapeuta || medico) {
            patientRecord.notes = JSON.stringify({
              diagnostico,
              ladoAcometido,
              fisioterapeuta,
              medico,
              ...otherData,
            });
          }
          
          await client
            .from(tableName)
            .upsert(patientRecord, {
              onConflict: 'id',
            });
        }
      }
    } else if (dataKey === 'results') {
      // Para resultados, salvar cada resultado individualmente
      if (Array.isArray(data)) {
        for (const result of data) {
          const { id, ...resultData } = result;
          await client
            .from(tableName)
            .upsert({
              id: result.id || `result_${Date.now()}_${Math.random()}`,
              ...payload,
              ...resultData,
            }, {
              onConflict: 'id',
            });
        }
      }
    } else if (dataKey === 'questionnaires') {
      // Para questionários, salvar como JSONB
      if (Array.isArray(data)) {
        for (const questionnaire of data) {
          const { id, ...questionnaireData } = questionnaire;
          await client
            .from(tableName)
            .upsert({
              id: questionnaire.id || `questionnaire_${Date.now()}_${Math.random()}`,
              ...payload,
              questionnaire_data: questionnaireData,
            }, {
              onConflict: 'id',
            });
        }
      }
    } else if (dataKey === 'drafts') {
      // Para rascunhos, salvar cada rascunho individualmente
      if (Array.isArray(data)) {
        for (const draft of data) {
          const { id, ...draftData } = draft;
          await client
            .from(tableName)
            .upsert({
              id: draft.id || `draft_${Date.now()}_${Math.random()}`,
              ...payload,
              ...draftData,
            }, {
              onConflict: 'id',
            });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao salvar no Supabase:', error);
    throw error;
  }
}

/**
 * Carrega dados do Supabase
 */
export async function loadFromSupabase(
  userId: string,
  dataKey: string
): Promise<any | null> {
  if (!userId) {
    return null;
  }

  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const tableMap: Record<string, string> = {
      patients: 'fisioq_patients',
      results: 'fisioq_results',
      questionnaires: 'fisioq_questionnaires',
      drafts: 'fisioq_drafts',
    };

    const tableName = tableMap[dataKey];
    if (!tableName) {
      return null;
    }

    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar do Supabase:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Transformar dados do Supabase para formato local
    if (dataKey === 'questionnaires') {
      return data.map((item: any) => ({
        ...item.questionnaire_data,
        id: item.id,
        _supabase_metadata: {
          timestamp: item.updated_at,
          version: item.data_version,
          hash: item.data_hash,
        },
      }));
    }

    if (dataKey === 'patients') {
      // Mapear colunas do Supabase de volta para formato Patient
      return data.map((item: any) => {
        const { _supabase_metadata, user_id, name, birth_date, gender, notes, ...otherFields } = item;
        
        // Tentar parsear notes como JSON se for string
        let parsedNotes = notes;
        try {
          if (typeof notes === 'string' && notes.startsWith('{')) {
            parsedNotes = JSON.parse(notes);
          }
        } catch {
          // Se não for JSON válido, usar como string
        }
        
        const patient: any = {
          id: item.id,
          nome: name, // Mapear 'name' de volta para 'nome'
          idade: birth_date ? new Date().getFullYear() - new Date(birth_date).getFullYear() : undefined,
          sexo: gender || 'Prefiro não informar',
          diagnostico: typeof parsedNotes === 'string' ? parsedNotes : parsedNotes?.diagnostico || '',
          ladoAcometido: parsedNotes?.ladoAcometido,
          fisioterapeuta: parsedNotes?.fisioterapeuta,
          medico: parsedNotes?.medico,
          ...otherFields,
        };
        
        return {
          ...patient,
          _supabase_metadata: {
            timestamp: item.updated_at,
            version: item.data_version,
            hash: item.data_hash,
          },
        };
      });
    }

    return data.map((item: any) => {
      const { _supabase_metadata, user_id, ...itemData } = item;
      return {
        ...itemData,
        _supabase_metadata: {
          timestamp: item.updated_at,
          version: item.data_version,
          hash: item.data_hash,
        },
      };
    });
  } catch (error) {
    console.error('Erro ao carregar do Supabase:', error);
    return null;
  }
}

/**
 * Sincroniza todos os dados do usuário entre localStorage e Supabase
 */
export async function syncAllData(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    // Sincronizar pacientes
    const patientsKey = `patients_${userId}`;
    const patients = JSON.parse(localStorage.getItem(patientsKey) || '[]');
    if (patients.length > 0) {
      await saveToSupabase(userId, 'patients', patients);
    }

    // Sincronizar resultados
    const resultsKey = `results_${userId}`;
    const results = JSON.parse(localStorage.getItem(resultsKey) || '[]');
    if (results.length > 0) {
      await saveToSupabase(userId, 'results', results);
    }

    // Sincronizar questionários publicados
    const questionnaires = JSON.parse(localStorage.getItem('published_questionnaires') || '[]');
    if (questionnaires.length > 0) {
      await saveToSupabase(userId, 'questionnaires', questionnaires);
    }

    console.log('Sincronização com Supabase concluída');
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    throw error;
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
  const dataKeys = ['patients', 'results', 'questionnaires'];

  try {
    for (const dataKey of dataKeys) {
      // Carregar versão remota
      const remoteData = await loadFromSupabase(userId, dataKey);
      if (!remoteData || remoteData.length === 0) continue;

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
      
      // Comparar com dados remotos
      const remoteItem = remoteData[0];
      const remoteHash = remoteItem._supabase_metadata?.hash || generateHash(remoteData);
      const remoteTimestamp = remoteItem._supabase_metadata?.timestamp || new Date(0).toISOString();

      // Detectar conflito: hashes diferentes e timestamps diferentes
      if (localHash !== remoteHash && localTimestamp !== remoteTimestamp) {
        conflicts.push({
          dataKey,
          localVersion: {
            data: localData,
            timestamp: localTimestamp,
            hash: localHash,
            version: parseInt(localStorage.getItem(`${storageKey}_version`) || '0', 10),
          },
          remoteVersion: {
            data: remoteData,
            timestamp: remoteTimestamp,
            hash: remoteHash,
            version: remoteItem._supabase_metadata?.version || 0,
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
 * Carrega todos os dados do usuário do Supabase para localStorage
 * Agora com detecção de conflitos
 */
export async function loadAllDataFromSupabase(userId: string): Promise<ConflictData[]> {
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
    const patientsData = await loadFromSupabase(userId, 'patients');
    if (patientsData && patientsData.length > 0) {
      const patientsKey = `patients_${userId}`;
      const patients = patientsData.map((p: any) => {
        const { _supabase_metadata, ...patientData } = p;
        return patientData;
      });
      localStorage.setItem(patientsKey, JSON.stringify(patients));
      if (patientsData[0]?._supabase_metadata) {
        localStorage.setItem(`${patientsKey}_timestamp`, patientsData[0]._supabase_metadata.timestamp);
        localStorage.setItem(`${patientsKey}_version`, String(patientsData[0]._supabase_metadata.version || 1));
      }
    }

    // Carregar resultados
    const resultsData = await loadFromSupabase(userId, 'results');
    if (resultsData && resultsData.length > 0) {
      const resultsKey = `results_${userId}`;
      const results = resultsData.map((r: any) => {
        const { _supabase_metadata, ...resultData } = r;
        return resultData;
      });
      localStorage.setItem(resultsKey, JSON.stringify(results));
      if (resultsData[0]?._supabase_metadata) {
        localStorage.setItem(`${resultsKey}_timestamp`, resultsData[0]._supabase_metadata.timestamp);
        localStorage.setItem(`${resultsKey}_version`, String(resultsData[0]._supabase_metadata.version || 1));
      }
    }

    // Carregar questionários
    const questionnairesData = await loadFromSupabase(userId, 'questionnaires');
    if (questionnairesData && questionnairesData.length > 0) {
      const questionnaires = questionnairesData.map((q: any) => {
        const { _supabase_metadata, ...questionnaireData } = q;
        return questionnaireData;
      });
      localStorage.setItem('published_questionnaires', JSON.stringify(questionnaires));
      if (questionnairesData[0]?._supabase_metadata) {
        localStorage.setItem('published_questionnaires_timestamp', questionnairesData[0]._supabase_metadata.timestamp);
        localStorage.setItem('published_questionnaires_version', String(questionnairesData[0]._supabase_metadata.version || 1));
      }
    }

    console.log('Dados do Supabase carregados');
  } catch (error) {
    console.error('Erro ao carregar dados do Supabase:', error);
  }

  return [];
}

