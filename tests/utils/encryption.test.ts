import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encryptData, decryptData, clearEncryptionCache } from '../../services/encryption';

// Mock do Web Crypto API
const mockCrypto = {
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
  subtle: {
    importKey: vi.fn(),
    deriveKey: vi.fn(),
    encrypt: vi.fn(),
    decrypt: vi.fn(),
  },
};

beforeEach(() => {
  clearEncryptionCache();
  vi.clearAllMocks();
  
  // Setup mocks básicos do crypto
  Object.defineProperty(global, 'crypto', {
    value: mockCrypto,
    writable: true,
  });
});

describe('encryption', () => {
  const testData = { name: 'Test', value: 123 };
  const professionalId = 'test-professional-id';

  describe('encryptData', () => {
    it('deve encriptar dados com sucesso', async () => {
      // Mock das funções do crypto
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(
        new ArrayBuffer(16)
      );

      const encrypted = await encryptData(testData, professionalId);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
    });

    it('deve usar salt único', async () => {
      mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue({} as CryptoKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

      const encrypted1 = await encryptData(testData, professionalId);
      clearEncryptionCache();
      const encrypted2 = await encryptData(testData, professionalId);

      // Com salt diferente, os resultados devem ser diferentes
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decryptData', () => {
    it('deve descriptografar dados corretamente', async () => {
      // Setup mocks
      const mockKey = {} as CryptoKey;
      const mockEncrypted = new ArrayBuffer(16);
      
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.deriveKey.mockResolvedValue(mockKey);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted);
      mockCrypto.subtle.decrypt.mockResolvedValue(
        new TextEncoder().encode(JSON.stringify(testData)).buffer
      );

      const encrypted = await encryptData(testData, professionalId);
      clearEncryptionCache();
      const decrypted = await decryptData(encrypted, professionalId);

      expect(decrypted).toEqual(testData);
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });
  });
});

