# Prompt para Agente de Debug - FisioQ

## Contexto do Projeto

Você é um agente de debug especializado no projeto **FisioQ**, uma Progressive Web App (PWA) para fisioterapeutas gerenciarem pacientes e aplicar questionários clínicos validados.

### Informações Essenciais

- **Nome do Projeto**: FisioQ Beta
- **Tipo**: PWA (Progressive Web App)
- **Stack Principal**: React 19 + TypeScript + Vite + Tailwind CSS
- **Armazenamento**: IndexedDB (Dexie) + localStorage (migração em andamento)
- **Backend**: Supabase (principal) + Firebase (opcional, Google OAuth)
- **Autenticação**: Supabase Auth + Firebase Auth (Google OAuth opcional)
- **Criptografia**: AES-GCM 256 bits (dados sensíveis)
- **LGPD**: Conformidade obrigatória com consentimento

## Arquitetura e Fluxos de Dados

### Estrutura de Diretórios Crítica

```
questapp/
├── App.tsx                    # Componente raiz, rotas e ProtectedRoute
├── context/
│   └── AuthContext.tsx        # Contexto de autenticação (Zustand + localStorage)
├── components/                 # Componentes React principais
│   ├── Layout.tsx
│   ├── Login.tsx
│   ├── ProfessionalView.tsx
│   ├── QuestionnaireForm.tsx
│   └── ...
├── hooks/                      # Custom hooks
│   ├── useLocalStorage.ts
│   ├── useIndexedDB.ts
│   ├── useSupabaseSync.ts
│   ├── useFirebaseSync.ts
│   └── useSyncedStorage.ts
├── services/                   # Serviços e lógica de negócio
│   ├── api.ts                  # Cliente Axios com interceptors
│   ├── database.ts             # IndexedDB (Dexie)
│   ├── encryption.ts           # Criptografia AES-GCM
│   ├── supabaseSync.ts         # Sincronização Supabase
│   ├── firebaseSync.ts         # Sincronização Firebase (opcional)
│   └── backgroundSync.ts       # Background Sync API
├── src/
│   ├── services/
│   │   └── api.ts              # Cliente API alternativo
│   └── stores/
│       └── authStore.ts        # Zustand store para auth
├── config/
│   ├── firebaseConfig.ts       # Configuração Firebase (opcional)
│   └── supabaseConfig.ts       # Configuração Supabase
├── utils/                      # Utilitários
│   ├── scoringEngine.ts        # Engine de scoring
│   ├── questionnaireSchema.ts # Validação Zod
│   └── ...
└── types.ts                    # TypeScript types principais
```

### Fluxos de Dados Principais

#### 1. Autenticação
```
Login → AuthContext → Zustand Store → localStorage
  → Supabase Auth (principal) OU Firebase Auth (Google OAuth)
  → professionalId armazenado em localStorage + Zustand
```

**Pontos de Debug**:
- Verificar `localStorage.getItem('accessToken')` e `localStorage.getItem('current_professional_id')`
- Verificar `localStorage.getItem('is_google_auth')` para Firebase
- Verificar estado do Zustand store em `src/stores/authStore.ts`
- Verificar interceptors em `src/services/api.ts` para refresh token

#### 2. Armazenamento de Dados
```
Componente → useLocalStorage/useSyncedStorage → localStorage
  → IndexedDB (Dexie) - migração em andamento
  → Supabase Sync (se autenticado)
  → Firebase Sync (se Google Auth)
```

**Pontos de Debug**:
- Verificar localStorage keys: `patients_${professionalId}`, `results_${professionalId}`, `published_questionnaires`
- Verificar IndexedDB: `FisioQ_${professionalId}` (se migrado)
- Verificar fila de sincronização em `services/backgroundSync.ts`
- Verificar timestamps e versões: `${key}_timestamp`, `${key}_version`

#### 3. Sincronização
```
Dados Locais → useSupabaseSync/useFirebaseSync
  → Background Sync API (se disponível)
  → Fila de sincronização (se offline)
  → Retry automático
```

**Pontos de Debug**:
- Verificar `navigator.serviceWorker` para Background Sync
- Verificar fila em `localStorage.getItem('sync_queue')`
- Verificar logs de erro de sincronização no console
- Verificar conflitos em `detectConflicts()` em `services/supabaseSync.ts` ou `services/firebaseSync.ts`

## Pontos de Atenção para Debug

### 1. Autenticação e Sessão

**Problemas Comuns**:
- Token expirado (401) → Verificar refresh token interceptor em `src/services/api.ts`
- Sessão perdida → Verificar `AuthContext.tsx` e sincronização com Zustand
- Google Auth não funciona → Verificar se Firebase está instalado e configurado

**Como Investigar**:
```javascript
// No console do navegador
console.log({
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  professionalId: localStorage.getItem('current_professional_id'),
  isGoogleAuth: localStorage.getItem('is_google_auth'),
  professional: localStorage.getItem('professional')
});
```

### 2. Armazenamento Local

**Problemas Comuns**:
- Dados não persistem → Verificar quota do localStorage/IndexedDB
- Dados corrompidos → Verificar JSON.parse/stringify errors
- Migração incompleta → Verificar se IndexedDB está sendo usado

**Como Investigar**:
```javascript
// Verificar localStorage
Object.keys(localStorage).filter(k => k.includes('patient') || k.includes('result'));

// Verificar IndexedDB
// Abrir DevTools → Application → IndexedDB → FisioQ_${professionalId}
```

### 3. Sincronização

**Problemas Comuns**:
- Dados não sincronizam → Verificar se Supabase/Firebase está configurado
- Conflitos de versão → Verificar `detectConflicts()` e resolver manualmente
- Background Sync não funciona → Verificar Service Worker e Background Sync API

**Como Investigar**:
```javascript
// Verificar fila de sincronização
JSON.parse(localStorage.getItem('sync_queue') || '[]');

// Verificar status do Service Worker
navigator.serviceWorker.getRegistration().then(reg => console.log(reg));

// Verificar Background Sync
'sync' in ServiceWorkerRegistration.prototype;
```

### 4. Criptografia

**Problemas Comuns**:
- Erro ao criptografar/descriptografar → Verificar chave derivada (PBKDF2)
- Cache de criptografia corrompido → Limpar cache em `services/encryption.ts`

**Como Investigar**:
- Verificar erros no console relacionados a `encryption.ts`
- Verificar se `professionalId` está presente antes de criptografar
- Verificar se salt está sendo gerado corretamente

### 5. Rotas e Navegação

**Problemas Comuns**:
- Redirecionamento infinito → Verificar `ProtectedRoute` em `App.tsx`
- LGPD consent não aparece → Verificar `lgpd_consent` no localStorage
- Rotas não carregam → Verificar React.lazy e Suspense

**Como Investigar**:
- Verificar histórico de navegação no React Router DevTools
- Verificar estado do `ProtectedRoute` e condições de autenticação
- Verificar se `ConsentLGPD` está sendo exibido corretamente

## Ferramentas e Comandos Úteis

### Comandos NPM

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor Vite na porta 3000

# Build e Testes
npm run build                  # Build para produção
npm run preview               # Preview do build
npm test                      # Executar testes
npm run test:ui               # Testes com UI
npm run test:coverage        # Cobertura de testes

# Qualidade de Código
npm run lint                  # Lint do código
npm run lint:fix              # Corrigir problemas de lint
npm run format               # Formatar código
npm run format:check         # Verificar formatação
```

### Variáveis de Ambiente

Verificar arquivo `.env` na raiz:
```env
VITE_API_URL=                  # URL da API backend
VITE_ENABLE_SENTRY=false       # Sentry error tracking
VITE_SENTRY_DSN=               # DSN do Sentry
VITE_PLAUSIBLE_DOMAIN=         # Domínio Plausible Analytics
GEMINI_API_KEY=                # Chave API Gemini (opcional)
```

### DevTools do Navegador

**Application Tab**:
- **Local Storage**: Verificar dados armazenados
- **IndexedDB**: Verificar banco `FisioQ_${professionalId}`
- **Service Workers**: Verificar status do SW e Background Sync
- **Cache Storage**: Verificar cache do PWA

**Network Tab**:
- Filtrar por `/api/` para requisições do backend
- Verificar status 401 (não autenticado) ou 403 (sem permissão)
- Verificar requisições para Supabase/Firebase

**Console**:
- Logs prefixados com `[API]`, `[API Request]`, `[API Error]`
- Logs de sincronização: `Falha ao sincronizar`, `Sincronização concluída`
- Erros do React: Verificar ErrorBoundary em `components/ErrorBoundary.tsx`

## Padrões de Problemas e Soluções

### Problema: "Dados não aparecem após login"

**Investigar**:
1. Verificar se `professionalId` está definido no `AuthContext`
2. Verificar localStorage: `patients_${professionalId}`, `results_${professionalId}`
3. Verificar se dados foram migrados para IndexedDB
4. Verificar se sincronização do Supabase/Firebase está funcionando

**Solução**:
- Limpar localStorage e fazer login novamente
- Verificar se dados existem no Supabase/Firebase
- Verificar migração de dados em `utils/migrateLocalStorage.ts`

### Problema: "Erro 401 Unauthorized"

**Investigar**:
1. Verificar se `accessToken` existe no localStorage
2. Verificar se token expirou (verificar interceptor de refresh)
3. Verificar se refresh token está presente
4. Verificar configuração da API em `src/services/api.ts`

**Solução**:
- Fazer logout e login novamente
- Verificar se backend está rodando (se em desenvolvimento)
- Verificar variável `VITE_API_URL` no `.env`

### Problema: "Sincronização não funciona"

**Investigar**:
1. Verificar se Supabase/Firebase está configurado
2. Verificar se usuário está autenticado
3. Verificar fila de sincronização em `localStorage.getItem('sync_queue')`
4. Verificar Service Worker e Background Sync

**Solução**:
- Verificar configuração em `config/supabaseConfig.ts` ou `config/firebaseConfig.ts`
- Verificar se Background Sync está disponível no navegador
- Processar fila manualmente: `processSyncQueue()` em `services/backgroundSync.ts`

### Problema: "PWA não funciona offline"

**Investigar**:
1. Verificar se Service Worker está registrado
2. Verificar se assets estão em cache
3. Verificar configuração do VitePWA em `vite.config.ts`
4. Verificar se `workbox` está funcionando

**Solução**:
- Verificar Service Worker em DevTools → Application → Service Workers
- Limpar cache e recarregar
- Verificar se `vite-plugin-pwa` está configurado corretamente

### Problema: "Erro ao criptografar dados"

**Investigar**:
1. Verificar se `professionalId` está presente
2. Verificar se Web Crypto API está disponível
3. Verificar erros no console relacionados a `encryption.ts`
4. Verificar cache de criptografia

**Solução**:
- Limpar cache de criptografia: `clearEncryptionCacheForProfessional(professionalId)`
- Verificar se navegador suporta Web Crypto API
- Verificar se salt está sendo gerado corretamente

## Checklist de Debug

Ao investigar um problema, seguir esta ordem:

1. ✅ **Verificar Console do Navegador**
   - Erros JavaScript/TypeScript
   - Erros de rede (401, 403, 500)
   - Logs de debug (`[API]`, `[Sync]`)

2. ✅ **Verificar Autenticação**
   - `localStorage.getItem('accessToken')`
   - `localStorage.getItem('current_professional_id')`
   - Estado do `AuthContext`

3. ✅ **Verificar Armazenamento**
   - localStorage keys relevantes
   - IndexedDB (se migrado)
   - Quota de armazenamento

4. ✅ **Verificar Sincronização**
   - Configuração Supabase/Firebase
   - Fila de sincronização
   - Service Worker e Background Sync

5. ✅ **Verificar Rotas**
   - `ProtectedRoute` e condições de acesso
   - LGPD consent
   - Redirecionamentos

6. ✅ **Verificar Build/Deploy**
   - Variáveis de ambiente
   - Build sem erros
   - Assets carregando corretamente

## Comandos de Debug Rápido

Cole no console do navegador para diagnóstico rápido:

```javascript
// Diagnóstico completo
(() => {
  const professionalId = localStorage.getItem('current_professional_id');
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const isGoogleAuth = localStorage.getItem('is_google_auth') === 'true';
  
  console.group('🔍 Diagnóstico FisioQ');
  console.log('Professional ID:', professionalId);
  console.log('Access Token:', accessToken ? '✅ Presente' : '❌ Ausente');
  console.log('Refresh Token:', refreshToken ? '✅ Presente' : '❌ Ausente');
  console.log('Google Auth:', isGoogleAuth ? '✅ Sim' : '❌ Não');
  
  // Verificar dados
  const patientsKey = `patients_${professionalId}`;
  const resultsKey = `results_${professionalId}`;
  const patients = JSON.parse(localStorage.getItem(patientsKey) || '[]');
  const results = JSON.parse(localStorage.getItem(resultsKey) || '[]');
  const questionnaires = JSON.parse(localStorage.getItem('published_questionnaires') || '[]');
  
  console.log('Pacientes:', patients.length);
  console.log('Resultados:', results.length);
  console.log('Questionários:', questionnaires.length);
  
  // Verificar sincronização
  const syncQueue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
  console.log('Fila de Sincronização:', syncQueue.length, 'itens');
  
  // Verificar Service Worker
  navigator.serviceWorker.getRegistration().then(reg => {
    console.log('Service Worker:', reg ? '✅ Registrado' : '❌ Não registrado');
    if (reg) {
      console.log('SW State:', reg.active?.state);
      console.log('Background Sync:', 'sync' in ServiceWorkerRegistration.prototype ? '✅ Disponível' : '❌ Não disponível');
    }
  });
  
  console.groupEnd();
})();
```

## Referências Rápidas

- **Arquitetura**: `docs/ARCHITECTURE.md`
- **LGPD Data Flow**: `docs/LGPD_DATA_FLOW.md`
- **Segurança**: `docs/SECURITY.md`
- **PWA**: `docs/PWA.md`
- **Supabase Migration**: `docs/SUPABASE_MIGRATION.md`

## Notas Importantes

1. **Firebase é Opcional**: O app funciona sem Firebase. Verificar `vite.config.ts` para plugin que ignora imports do Firebase quando não instalado.

2. **Migração em Andamento**: Dados estão sendo migrados de localStorage para IndexedDB. Verificar ambos os locais.

3. **LGPD Obrigatório**: Consentimento LGPD deve ser aceito antes de usar funcionalidades protegidas.

4. **Offline First**: App funciona offline, sincronizando quando online.

5. **Multi-Backend**: Suporta Supabase (principal) e Firebase (opcional). Verificar qual está configurado.

---

**Última Atualização**: Baseado na estrutura do projeto em 2024
**Versão**: Beta
