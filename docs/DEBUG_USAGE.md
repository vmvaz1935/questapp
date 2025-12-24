# Guia de Uso - Sistema de Debug FisioQ

Este guia explica como usar o sistema de debug do FisioQ para diagnosticar problemas e monitorar o estado da aplicação.

## Visão Geral

O sistema de debug do FisioQ fornece três formas principais de diagnóstico:

1. **Painel Visual de Debug** - Interface gráfica no navegador (apenas em desenvolvimento)
2. **Console de Debug** - Comandos no console do navegador (`window.fisioqDebug`)
3. **Funções Programáticas** - Utilitários TypeScript para uso em código

## Painel Visual de Debug

### Como Abrir

- **Atalho de Teclado**: Pressione `Ctrl+Shift+D` (ou `Cmd+Shift+D` no Mac)
- **Botão no ErrorBoundary**: Quando ocorre um erro, um botão "Abrir Painel de Debug" aparece automaticamente
- **Programaticamente**: Disparar evento `fisioq:open-debug-panel`

### Funcionalidades

O painel possui 7 abas principais:

#### 1. Autenticação 🔐
- Status de autenticação
- Presença de tokens (access/refresh)
- Professional ID
- Estado do Zustand store
- Status do Google Auth

#### 2. Armazenamento 💾
- Status do localStorage
- Status do IndexedDB
- Quota de armazenamento
- Contagem de dados (pacientes, resultados, questionários)
- Status de migração

#### 3. Sincronização 🔄
- Configuração Supabase/Firebase
- Status do Service Worker
- Background Sync disponível
- Fila de sincronização
- Última sincronização
- Conflitos detectados

#### 4. Rotas 🌐
- LGPD consent
- Rota atual
- Histórico de navegação

#### 5. Criptografia 🔒
- Disponibilidade Web Crypto API
- Cache de criptografia
- Derivação de chave
- Geração de salt

#### 6. Build ⚙️
- Ambiente (dev/prod)
- Versão do build
- URL da API
- Variáveis de ambiente

#### 7. Logs 📋
- Logs de debug em tempo real
- Filtros por nível (info, warn, error)
- Detalhes de cada log

### Ações Disponíveis

- **Executar Diagnóstico**: Executa diagnóstico completo e atualiza todas as abas
- **Exportar**: Baixa diagnóstico completo como arquivo JSON
- **Limpar Cache**: Remove cache de sincronização (não afeta dados do usuário)

## Console de Debug

### Inicialização

O console de debug é inicializado automaticamente em desenvolvimento. Você pode acessá-lo através de `window.fisioqDebug`.

### Comandos Disponíveis

#### Diagnóstico Rápido
```javascript
fisioqDebug.quick()
```
Executa verificação rápida de autenticação e armazenamento.

#### Verificar Autenticação
```javascript
fisioqDebug.auth()
```
Verifica estado completo de autenticação.

#### Verificar Armazenamento
```javascript
fisioqDebug.storage()
```
Verifica localStorage, IndexedDB e dados armazenados.

#### Verificar Sincronização
```javascript
fisioqDebug.sync()
```
Verifica configuração e status de sincronização.

#### Verificar Rotas
```javascript
fisioqDebug.routes()
```
Verifica rotas e navegação.

#### Verificar Criptografia
```javascript
fisioqDebug.encryption()
```
Verifica disponibilidade e status de criptografia.

#### Verificar Build
```javascript
fisioqDebug.build()
```
Verifica ambiente e variáveis de build.

#### Diagnóstico Completo
```javascript
fisioqDebug.full()
```
Executa diagnóstico completo de todos os sistemas.

#### Exportar Diagnóstico
```javascript
fisioqDebug.export()
```
Exporta diagnóstico completo como JSON e faz download do arquivo.

#### Limpar Cache
```javascript
fisioqDebug.clear()
```
Limpa cache de sincronização (com confirmação).

#### Ajuda
```javascript
fisioqDebug.help()
```
Mostra lista de todos os comandos disponíveis.

### Exemplo de Uso

```javascript
// Diagnóstico rápido
fisioqDebug.quick()

// Verificar problema específico
fisioqDebug.auth()
fisioqDebug.sync()

// Diagnóstico completo e exportar
const result = await fisioqDebug.full()
await fisioqDebug.export()
```

## Funções Programáticas

### Importar

```typescript
import {
  runDiagnostics,
  checkAuthentication,
  checkStorage,
  checkSync,
  checkRoutes,
  checkEncryption,
  checkBuild,
  exportDiagnostics,
  formatDiagnosticsForConsole,
} from './utils/debug';
```

### Funções Principais

#### `runDiagnostics()`
Executa diagnóstico completo e retorna objeto `DiagnosticResult`.

```typescript
const diagnostics = await runDiagnostics();
console.log(diagnostics);
```

#### `checkAuthentication()`
Verifica apenas autenticação.

```typescript
const auth = checkAuthentication();
console.log(auth.isAuthenticated.status); // 'ok' | 'warning' | 'error'
```

#### `checkStorage()`
Verifica armazenamento (async).

```typescript
const storage = await checkStorage();
console.log(storage.localStorage.status);
console.log(storage.indexedDB.status);
```

#### `checkSync()`
Verifica sincronização (async).

```typescript
const sync = await checkSync();
console.log(sync.supabaseConfigured.status);
console.log(sync.serviceWorker.status);
```

#### `checkRoutes()`
Verifica rotas.

```typescript
const routes = checkRoutes();
console.log(routes.lgpdConsent.status);
```

#### `checkEncryption()`
Verifica criptografia (async).

```typescript
const encryption = await checkEncryption();
console.log(encryption.webCryptoAvailable.status);
```

#### `checkBuild()`
Verifica build e ambiente.

```typescript
const build = checkBuild();
console.log(build.environment.details?.mode);
```

#### `exportDiagnostics()`
Exporta diagnóstico como JSON string.

```typescript
const json = await exportDiagnostics();
console.log(json);
```

#### `formatDiagnosticsForConsole()`
Formata diagnóstico para exibição no console.

```typescript
const diagnostics = await runDiagnostics();
formatDiagnosticsForConsole(diagnostics);
```

## Hooks React

### `useDebug()`

Hook principal para usar debug em componentes React.

```typescript
import { useDebug } from './hooks/useDebug';

function MyComponent() {
  const {
    state,
    runDiagnostic,
    exportDiagnostic,
    addLog,
    togglePanel,
  } = useDebug();
  
  // Usar funções de debug
}
```

### `useDiagnostics()`

Hook para executar diagnóstico automaticamente.

```typescript
import { useDiagnostics } from './hooks/useDebug';

function MyComponent() {
  // Executa diagnóstico a cada 30 segundos
  const { diagnostics, isLoading, error, run } = useDiagnostics(30000);
  
  // Usar diagnostics
}
```

### `useDebugLog()`

Hook para logs de debug em tempo real.

```typescript
import { useDebugLog } from './hooks/useDebug';

function MyComponent() {
  const { logs, addLog, clearLogs } = useDebugLog();
  
  addLog('info', 'category', 'Mensagem', { data: 'extra' });
}
```

## Casos de Uso Comuns

### 1. Verificar se Usuário Está Autenticado

```javascript
// No console
fisioqDebug.auth()

// Programaticamente
import { checkAuthentication } from './utils/debug';
const auth = checkAuthentication();
if (auth.isAuthenticated.status === 'ok') {
  console.log('Usuário autenticado:', auth.professionalId.details?.professionalId);
}
```

### 2. Verificar Dados Armazenados

```javascript
// No console
fisioqDebug.storage()

// Programaticamente
import { checkStorage } from './utils/debug';
const storage = await checkStorage();
console.log('Pacientes:', storage.patientsData.details?.count);
console.log('Resultados:', storage.resultsData.details?.count);
```

### 3. Verificar Problemas de Sincronização

```javascript
// No console
fisioqDebug.sync()

// Verificar fila
const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
console.log('Itens na fila:', queue.length);
```

### 4. Exportar Diagnóstico para Suporte

```javascript
// No console
fisioqDebug.export()

// Programaticamente
import { exportDiagnostics } from './utils/debug';
const json = await exportDiagnostics();
// Enviar json para suporte
```

### 5. Debug de Erros

Quando um erro ocorre:
1. O ErrorBoundary mostra botão "Abrir Painel de Debug"
2. Abra o painel e vá para a aba "Logs"
3. Execute diagnóstico completo
4. Exporte e compartilhe com desenvolvedores

## Logs de Debug nos Services

Os services críticos (`api.ts`, `supabaseSync.ts`, `firebaseSync.ts`) já incluem logs de debug prefixados com `[DEBUG]` que aparecem apenas em desenvolvimento.

Exemplos:
- `[DEBUG] Iniciando sincronização Supabase`
- `[DEBUG] Erro ao sincronizar com Firebase`
- `[DEBUG] Refresh token falhou, fazendo logout`

## Segurança

- **Apenas em Desenvolvimento**: O sistema de debug está completamente desabilitado em produção
- **Sem Dados Sensíveis**: Tokens e senhas nunca são expostos, mesmo em debug
- **Logs Filtrados**: Logs de debug não incluem informações pessoais

## Troubleshooting

### Painel não abre
- Verifique se está em modo desenvolvimento (`import.meta.env.DEV`)
- Verifique console para erros
- Tente recarregar a página

### Console de debug não disponível
- Verifique se está em desenvolvimento
- Verifique console para mensagem de inicialização
- Tente `fisioqDebug.help()` para verificar se foi inicializado

### Diagnóstico não executa
- Verifique console para erros
- Verifique se há problemas de CORS ou rede
- Tente executar verificações individuais (`fisioqDebug.auth()`, etc.)

## Referências

- **Prompt de Debug Completo**: `docs/DEBUG_PROMPT.md`
- **Arquitetura**: `docs/ARCHITECTURE.md`
- **Código Fonte**: 
  - `utils/debug.ts` - Funções de diagnóstico
  - `hooks/useDebug.ts` - Hooks React
  - `components/DebugPanel.tsx` - Painel visual
  - `utils/debugConsole.ts` - Console de debug

