// Utilitários de segurança e hash para LGPD

/**
 * Gera hash SHA-256 de uma string (para senhas)
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Criptografa dados sensíveis (usando base64 como exemplo simples)
 * Em produção, usar criptografia AES adequada
 */
export function encryptData(data: string): string {
  return btoa(data); // Base64 encoding (apenas exemplo - em produção usar criptografia real)
}

/**
 * Descriptografa dados
 */
export function decryptData(encrypted: string): string {
  try {
    return atob(encrypted);
  } catch {
    return '';
  }
}

/**
 * Sanitiza entrada do usuário para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

