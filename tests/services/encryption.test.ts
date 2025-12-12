import { describe, it, expect, beforeEach } from 'vitest';
import { encryptData, decryptData, clearEncryptionCache } from '../../services/encryption';

describe('encryption', () => {
  const professionalId = 'test-professional-123';

  beforeEach(() => {
    clearEncryptionCache();
  });

  describe('encryptData e decryptData', () => {
    it('deve criptografar e descriptografar dados corretamente', async () => {
      const originalData = { nome: 'Teste', idade: 30 };

      const encrypted = await encryptData(originalData, professionalId);
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toContain('Teste');

      const decrypted = await decryptData(encrypted, professionalId);
      expect(decrypted).toEqual(originalData);
    });

    it('deve falhar ao descriptografar com professionalId diferente', async () => {
      const originalData = { nome: 'Teste', idade: 30 };
      const encrypted = await encryptData(originalData, professionalId);

      await expect(decryptData(encrypted, 'different-id')).rejects.toThrow();
    });

    it('deve suportar arrays e objetos complexos', async () => {
      const complexData = {
        pacientes: [
          { id: '1', nome: 'Paciente 1' },
          { id: '2', nome: 'Paciente 2' },
        ],
        metadata: {
          total: 2,
          createdAt: new Date().toISOString(),
        },
      };

      const encrypted = await encryptData(complexData, professionalId);
      const decrypted = await decryptData(encrypted, professionalId);

      expect(decrypted.pacientes).toHaveLength(2);
      expect(decrypted.pacientes[0].nome).toBe('Paciente 1');
    });
  });

  describe('clearEncryptionCache', () => {
    it('deve limpar cache de chaves', async () => {
      // Criar chave para popular cache
      await encryptData({ test: 'data' }, professionalId);

      clearEncryptionCache();

      // Nova criptografia deve funcionar (nova chave será criada)
      const encrypted = await encryptData({ test: 'data2' }, professionalId);
      expect(encrypted).toBeDefined();
    });
  });
});

