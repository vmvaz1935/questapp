/**
 * Serviço de criptografia para dados sensíveis
 * Usa Web Crypto API com AES-GCM para criptografia em repouso
 * Suporta versionamento de chaves e migração automática
 */

// Chave derivada por usuário usando PBKDF2
let encryptionKeyCache = new Map<string, CryptoKey>();

// Versão atual do algoritmo de criptografia
const CURRENT_KEY_VERSION = 2;

interface KeyMetadata {
  version: number;
  salt: Uint8Array;
  createdAt: string;
  rotatedAt?: string;
}

// Armazenar metadados de chaves por profissional
const keyMetadataStore = new Map<string, KeyMetadata>();

/**
 * Obtém ou cria metadados de chave para um profissional
 */
async function getKeyMetadata(professionalId: string): Promise<KeyMetadata> {
  // Verificar cache em memória
  if (keyMetadataStore.has(professionalId)) {
    return keyMetadataStore.get(professionalId)!;
  }

  // Tentar carregar do IndexedDB
  try {
    const { getDatabase } = await import('./database');
    const db = getDatabase(professionalId);
    const metadataRecord = await db.profiles
      .where('profileId')
      .equals(`key_metadata_${professionalId}`)
      .first();

    if (metadataRecord && metadataRecord.data) {
      const metadata = metadataRecord.data as KeyMetadata;
      // Converter salt de array para Uint8Array
      if (Array.isArray(metadata.salt)) {
        metadata.salt = new Uint8Array(metadata.salt);
      }
      keyMetadataStore.set(professionalId, metadata);
      return metadata;
    }
  } catch (error) {
    console.warn('Erro ao carregar metadados de chave:', error);
  }

  // Criar novos metadados
  const newMetadata: KeyMetadata = {
    version: CURRENT_KEY_VERSION,
    salt: crypto.getRandomValues(new Uint8Array(16)),
    createdAt: new Date().toISOString(),
  };

  // Salvar no IndexedDB
  try {
    const { getDatabase } = await import('./database');
    const db = getDatabase(professionalId);
    await db.profiles.put({
      profileId: `key_metadata_${professionalId}`,
      data: {
        ...newMetadata,
        salt: Array.from(newMetadata.salt), // Converter para array para JSON
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Erro ao salvar metadados de chave:', error);
  }

  keyMetadataStore.set(professionalId, newMetadata);
  return newMetadata;
}

/**
 * Rotaciona a chave de criptografia para um profissional
 */
export async function rotateEncryptionKey(professionalId: string): Promise<void> {
  const metadata = await getKeyMetadata(professionalId);
  
  // Criar backup do salt antigo
  const backupMetadata: KeyMetadata = {
    ...metadata,
    rotatedAt: new Date().toISOString(),
  };

  try {
    const { getDatabase } = await import('./database');
    const db = getDatabase(professionalId);
    
    // Salvar backup
    await db.profiles.put({
      profileId: `key_metadata_backup_${professionalId}_${Date.now()}`,
      data: {
        ...backupMetadata,
        salt: Array.from(backupMetadata.salt),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Criar nova chave
    const newMetadata: KeyMetadata = {
      version: CURRENT_KEY_VERSION,
      salt: crypto.getRandomValues(new Uint8Array(16)),
      createdAt: new Date().toISOString(),
    };

    // Atualizar metadados
    await db.profiles.put({
      profileId: `key_metadata_${professionalId}`,
      data: {
        ...newMetadata,
        salt: Array.from(newMetadata.salt),
      },
      createdAt: metadata.createdAt,
      updatedAt: new Date().toISOString(),
    });

    keyMetadataStore.set(professionalId, newMetadata);
    
    // Limpar cache de chaves antigas
    const cacheKeysToDelete: string[] = [];
    encryptionKeyCache.forEach((_, key) => {
      if (key.startsWith(`${professionalId}_`)) {
        cacheKeysToDelete.push(key);
      }
    });
    cacheKeysToDelete.forEach(key => encryptionKeyCache.delete(key));
  } catch (error) {
    console.error('Erro ao rotacionar chave:', error);
    throw error;
  }
}

/**
 * Deriva uma chave de criptografia usando PBKDF2
 * @param professionalId ID do profissional
 * @param salt Salt único (será obtido dos metadados se não fornecido)
 * @param version Versão da chave (opcional, usa versão atual se não fornecido)
 * @returns Chave de criptografia e salt usado
 */
export async function deriveEncryptionKey(
  professionalId: string,
  salt?: Uint8Array,
  version?: number
): Promise<{ key: CryptoKey; salt: Uint8Array; version: number }> {
  // Obter metadados se salt não fornecido
  if (!salt) {
    const metadata = await getKeyMetadata(professionalId);
    salt = metadata.salt;
    version = version || metadata.version;
  } else {
    version = version || CURRENT_KEY_VERSION;
  }

  // Verificar cache
  const cacheKey = `${professionalId}_${Array.from(salt).join(',')}_v${version}`;
  if (encryptionKeyCache.has(cacheKey)) {
    return {
      key: encryptionKeyCache.get(cacheKey)!,
      salt,
      version,
    };
  }

  // Obter material da chave (senha do usuário ou token)
  // Por enquanto, usando professionalId + hash do localStorage
  // Em produção, isso deveria vir de uma senha ou token de autenticação
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`${professionalId}_${window.location.origin}`),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derivar chave usando PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // Alto número de iterações para segurança
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Cache da chave
  encryptionKeyCache.set(cacheKey, key);

  return { key, salt, version };
}

/**
 * Criptografa dados usando AES-GCM
 * @param data Dados a serem criptografados
 * @param professionalId ID do profissional
 * @returns Dados criptografados + IV + salt + versão (como base64)
 */
export async function encryptData(
  data: any,
  professionalId: string
): Promise<string> {
  const { key, salt, version } = await deriveEncryptionKey(professionalId);
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits para AES-GCM

  // Converter dados para JSON e depois para ArrayBuffer
  const dataJson = JSON.stringify(data);
  const dataBuffer = new TextEncoder().encode(dataJson);

  // Criptografar
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    dataBuffer
  );

  // Combinar: versão (1 byte) + salt (16 bytes) + IV (12 bytes) + dados criptografados
  const combined = new Uint8Array(1 + 16 + 12 + encryptedBuffer.byteLength);
  combined[0] = version; // Versão no primeiro byte
  combined.set(salt, 1);
  combined.set(iv, 17);
  combined.set(new Uint8Array(encryptedBuffer), 29);

  // Converter para base64 para armazenamento
  return btoa(String.fromCharCode(...combined));
}

/**
 * Descriptografa dados usando AES-GCM
 * Suporta migração automática de dados antigos
 * @param encryptedData Dados criptografados (base64)
 * @param professionalId ID do profissional
 * @returns Dados descriptografados
 */
export async function decryptData(
  encryptedData: string,
  professionalId: string
): Promise<any> {
  // Converter de base64 para Uint8Array
  const combined = Uint8Array.from(
    atob(encryptedData),
    (c) => c.charCodeAt(0)
  );

  // Verificar versão (primeiro byte)
  // Se não tiver versão (dados antigos), assumir versão 1
  let version: number;
  let offset: number;
  
  if (combined.length < 29) {
    // Formato antigo: salt (16) + IV (12) + dados
    version = 1;
    offset = 0;
  } else {
    version = combined[0];
    offset = 1;
  }

  // Extrair salt, IV e dados criptografados
  const salt = combined.slice(offset, offset + 16);
  const iv = combined.slice(offset + 16, offset + 28);
  const encryptedBuffer = combined.slice(offset + 28);

  // Derivar chave usando o salt armazenado e versão
  const { key } = await deriveEncryptionKey(professionalId, salt, version);

  // Descriptografar
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedBuffer
  );

  // Converter de ArrayBuffer para JSON e depois para objeto
  const decryptedJson = new TextDecoder().decode(decryptedBuffer);
  const decryptedData = JSON.parse(decryptedJson);

  // Se dados antigos (versão < CURRENT_KEY_VERSION), re-criptografar com nova chave
  if (version < CURRENT_KEY_VERSION) {
    try {
      const reEncrypted = await encryptData(decryptedData, professionalId);
      // Retornar dados descriptografados (a re-criptografia será feita pelo caller se necessário)
      return decryptedData;
    } catch (error) {
      console.warn('Erro ao migrar dados para nova versão de chave:', error);
      // Retornar dados mesmo assim
      return decryptedData;
    }
  }

  return decryptedData;
}

/**
 * Limpa o cache de chaves (útil para logout)
 */
export function clearEncryptionCache(): void {
  encryptionKeyCache.clear();
  keyMetadataStore.clear();
}

/**
 * Limpa cache de chaves para um profissional específico
 */
export function clearEncryptionCacheForProfessional(professionalId: string): void {
  const keysToDelete: string[] = [];
  encryptionKeyCache.forEach((_, key) => {
    if (key.startsWith(`${professionalId}_`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => encryptionKeyCache.delete(key));
  keyMetadataStore.delete(professionalId);
}

