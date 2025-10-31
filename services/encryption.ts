/**
 * Serviço de criptografia para dados sensíveis
 * Usa Web Crypto API com AES-GCM para criptografia em repouso
 */

// Chave derivada por usuário usando PBKDF2
let encryptionKeyCache = new Map<string, CryptoKey>();

/**
 * Deriva uma chave de criptografia usando PBKDF2
 * @param professionalId ID do profissional
 * @param salt Salt único (será gerado se não fornecido)
 * @returns Chave de criptografia e salt usado
 */
export async function deriveEncryptionKey(
  professionalId: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  // Verificar cache
  const cacheKey = `${professionalId}_${salt ? Array.from(salt).join(',') : 'new'}`;
  if (encryptionKeyCache.has(cacheKey)) {
    return {
      key: encryptionKeyCache.get(cacheKey)!,
      salt: salt || new Uint8Array(16), // Retornar salt existente ou placeholder
    };
  }

  // Gerar salt se não fornecido (primeira vez)
  if (!salt) {
    salt = crypto.getRandomValues(new Uint8Array(16));
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

  return { key, salt };
}

/**
 * Criptografa dados usando AES-GCM
 * @param data Dados a serem criptografados
 * @param professionalId ID do profissional
 * @returns Dados criptografados + IV + salt (como base64)
 */
export async function encryptData(
  data: any,
  professionalId: string
): Promise<string> {
  const { key, salt } = await deriveEncryptionKey(professionalId);
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

  // Combinar: salt (16 bytes) + IV (12 bytes) + dados criptografados
  const combined = new Uint8Array(16 + 12 + encryptedBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(encryptedBuffer), 28);

  // Converter para base64 para armazenamento
  return btoa(String.fromCharCode(...combined));
}

/**
 * Descriptografa dados usando AES-GCM
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

  // Extrair salt, IV e dados criptografados
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encryptedBuffer = combined.slice(28);

  // Derivar chave usando o salt armazenado
  const { key } = await deriveEncryptionKey(professionalId, salt);

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
  return JSON.parse(decryptedJson);
}

/**
 * Limpa o cache de chaves (útil para logout)
 */
export function clearEncryptionCache(): void {
  encryptionKeyCache.clear();
}

