/**
 * Testes unitários para sistema de debug
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkAuthentication,
  checkRoutes,
  checkBuild,
} from '../../utils/debug';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Sistema de Debug', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('checkAuthentication', () => {
    it('deve detectar usuário não autenticado', () => {
      const result = checkAuthentication();
      expect(result.isAuthenticated.status).toBe('error');
      expect(result.professionalId.status).toBe('error');
      expect(result.accessToken.status).toBe('error');
    });

    it('deve detectar usuário autenticado', () => {
      localStorageMock.setItem('accessToken', 'test-token');
      localStorageMock.setItem('refreshToken', 'test-refresh');
      localStorageMock.setItem('current_professional_id', 'test-id');
      
      const result = checkAuthentication();
      expect(result.isAuthenticated.status).toBe('ok');
      expect(result.professionalId.status).toBe('ok');
      expect(result.accessToken.status).toBe('ok');
      expect(result.professionalId.details?.professionalId).toBe('test-id');
    });

    it('deve detectar Google Auth quando configurado', () => {
      localStorageMock.setItem('is_google_auth', 'true');
      const result = checkAuthentication();
      expect(result.googleAuth.status).toBe('ok');
    });
  });

  describe('checkRoutes', () => {
    it('deve verificar rota atual', () => {
      const result = checkRoutes();
      expect(result.currentRoute.status).toBe('ok');
      expect(result.currentRoute.details?.pathname).toBe(window.location.pathname);
    });

    it('deve detectar LGPD consent não aceito', () => {
      const result = checkRoutes();
      expect(result.lgpdConsent.status).toBe('warning');
    });

    it('deve detectar LGPD consent aceito', () => {
      localStorageMock.setItem('lgpd_consent', JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }));
      const result = checkRoutes();
      expect(result.lgpdConsent.status).toBe('ok');
    });
  });

  describe('checkBuild', () => {
    it('deve verificar ambiente', () => {
      const result = checkBuild();
      expect(result.environment.status).toBe('ok');
      expect(result.environment.details?.mode).toBeDefined();
    });

    it('deve verificar variáveis de ambiente', () => {
      const result = checkBuild();
      expect(result.envVariables.status).toBe('ok');
      expect(result.envVariables.details).toBeDefined();
    });
  });

  describe('Integração', () => {
    it('deve funcionar com localStorage vazio', () => {
      localStorageMock.clear();
      const auth = checkAuthentication();
      const routes = checkRoutes();
      const build = checkBuild();
      
      expect(auth).toBeDefined();
      expect(routes).toBeDefined();
      expect(build).toBeDefined();
    });

    it('deve funcionar com dados completos', () => {
      localStorageMock.setItem('accessToken', 'token');
      localStorageMock.setItem('refreshToken', 'refresh');
      localStorageMock.setItem('current_professional_id', 'id-123');
      localStorageMock.setItem('lgpd_consent', JSON.stringify({ accepted: true }));
      
      const auth = checkAuthentication();
      const routes = checkRoutes();
      
      expect(auth.isAuthenticated.status).toBe('ok');
      expect(routes.lgpdConsent.status).toBe('ok');
    });
  });
});

