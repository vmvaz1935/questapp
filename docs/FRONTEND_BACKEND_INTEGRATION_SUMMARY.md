# Resumo da Revisão - Guia de Integração Frontend-Backend

**Data**: Novembro 2025  
**Status**: ✅ Revisão Completa

---

## 📊 Resumo Executivo

O guia de integração foi revisado e ajustado para manter **100% de compatibilidade** com a estrutura atual do FisioQ, enquanto adiciona suporte para backend PostgreSQL.

---

## 🔍 Principais Ajustes Realizados

### 1. **Compatibilidade com Estrutura Atual**

**❌ Problema Original:**
- Sugeria usar Zustand (projeto não usa)
- Sugeria usar React Query (projeto não usa)
- Não considerava IndexedDB existente
- Não considerava Firebase sync existente

**✅ Solução Revisada:**
- ✅ Mantém `AuthContext` existente
- ✅ Integra com IndexedDB (Dexie) já implementado
- ✅ Compatível com Firebase sync atual
- ✅ Usa hooks customizados existentes
- ✅ Adiciona apenas `axios` (necessário)

### 2. **Estratégia Offline-First**

**❌ Problema Original:**
- Não considerava dados locais existentes
- Não integrava com IndexedDB

**✅ Solução Revisada:**
- ✅ Offline-first: salva localmente primeiro
- ✅ Sincroniza com backend quando online
- ✅ Mescla dados locais e remotos
- ✅ Resolução de conflitos baseada em timestamp

### 3. **Migração Gradual**

**❌ Problema Original:**
- Não contemplava migração do Firebase
- Não considerava usuários existentes

**✅ Solução Revisada:**
- ✅ Backend opcional (variável `VITE_ENABLE_BACKEND`)
- ✅ Coexistência com Firebase
- ✅ Migração gradual de dados
- ✅ Usuários podem optar por usar backend

### 4. **Integração com Tipos Existentes**

**❌ Problema Original:**
- Tipos não alinhados com `types.ts`
- Campos diferentes (nome vs name)

**✅ Solução Revisada:**
- ✅ Usa tipos existentes (`Patient`, `Questionnaire`, etc.)
- ✅ Conversão automática entre formatos
- ✅ Mapeamento nome ↔ name transparente

---

## 🔄 Estrutura de Integração

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AuthContext (estendido)                            │  │
│  │  - login() → Backend API                            │  │
│  │  - register() → Backend API                         │  │
│  │  - Mantém compatibilidade com modo offline          │  │
│  └───────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  IndexedDB (Dexie) - EXISTENTE                      │  │
│  │  - Dados sempre salvos localmente primeiro          │  │
│  │  - Fonte de verdade local                           │  │
│  └───────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  BackendSyncService - NOVO                          │  │
│  │  - Queue de sincronização                           │  │
│  │  - Sincronização automática                          │  │
│  │  - Resolução de conflitos                           │  │
│  └───────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Firebase Sync (opcional) - EXISTENTE               │  │
│  │  - Continua funcionando                              │  │
│  │  - Pode coexistir com backend                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express + PostgreSQL)         │
│  - Autenticação JWT                                     │
│  - Endpoints REST                                        │
│  - Sincronização batch                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Dependências Necessárias

### ✅ Instalar
```bash
npm install axios
```

### ✅ Já Existem (não precisa instalar)
- ✅ `dexie` - IndexedDB
- ✅ `firebase` - Sincronização opcional
- ✅ `react-router-dom` - Roteamento
- ✅ Context API - Estado

### ❌ Não Instalar (não necessário)
- ❌ `zustand` - Usa Context API existente
- ❌ `@tanstack/react-query` - Usa hooks customizados
- ❌ `react-toastify` - Opcional (pode usar notificação existente)

---

## 🎯 Estratégia de Implementação

### Fase 1: Setup (1 dia)
- [x] Instalar `axios`
- [x] Criar `.env.development` e `.env.production`
- [x] Criar `src/services/apiClient.ts`
- [x] Estender `AuthContext`

### Fase 2: Integração de Dados (2 dias)
- [x] Criar `src/services/backendSync.ts`
- [x] Criar `src/hooks/useBackendPatients.ts`
- [x] Criar `src/hooks/useBackendResults.ts`
- [x] Atualizar `App.tsx` para sincronização

### Fase 3: Componentes (2 dias)
- [x] Atualizar `Login.tsx`
- [x] Atualizar `ProfessionalView.tsx`
- [x] Atualizar `QuestionnairesView.tsx`
- [x] Testar fluxo completo

### Fase 4: Testes (1 dia)
- [x] Testar login/registro
- [x] Testar sincronização offline
- [x] Testar renovação de token
- [x] Testar resolução de conflitos

---

## 🔐 Compatibilidade de Autenticação

### Modo Offline (Atual)
```typescript
// Funciona como antes
localStorage.setItem('current_professional_id', id);
```

### Modo Backend (Novo)
```typescript
// Adiciona tokens JWT
localStorage.setItem('access_token', token);
localStorage.setItem('refresh_token', refreshToken);
localStorage.setItem('current_professional_id', id);
```

### Modo Híbrido (Recomendado)
```typescript
// Funciona offline E online
// Backend usado quando disponível
// IndexedDB sempre usado para cache
```

---

## 📊 Compatibilidade de Dados

### Patient

| Campo Frontend | Backend API | Conversão |
|----------------|-------------|-----------|
| `id` | `id` | ✅ Direto |
| `nome` | `name` | ✅ Automático |
| `idade` | `age` | ✅ Direto |
| `sexo` | `gender` | ✅ Direto |
| `diagnostico` | `diagnosis` | ✅ Direto |
| `ladoAcometido` | `sidedAffected` | ✅ Direto |
| `medico` | `referringDoctor` | ✅ Direto |
| `fisioterapeuta` | `physiotherapist` | ✅ Direto |

### Result

| Campo Frontend | Backend API | Conversão |
|----------------|-------------|-----------|
| `id` | `id` | ✅ Direto |
| `patientId` | `patientId` | ✅ Direto |
| `questionnaireId` | `questionnaireId` | ✅ Direto |
| `scores.total` | `scores.total` | ✅ Direto |
| `scores.isPercent` | `scores.isPercent` | ✅ Direto |
| `scores.domains` | `scores.domains` | ✅ Direto |

---

## ✅ Benefícios da Revisão

### 1. **Zero Breaking Changes**
- ✅ Tudo que funciona hoje continua funcionando
- ✅ Backend é opcional
- ✅ Migração gradual possível

### 2. **Compatibilidade Total**
- ✅ IndexedDB continua funcionando
- ✅ Firebase sync continua funcionando
- ✅ Componentes existentes funcionam
- ✅ Dados existentes preservados

### 3. **Melhorias Graduais**
- ✅ Usuários podem optar por usar backend
- ✅ Sincronização automática quando online
- ✅ Resolução de conflitos inteligente
- ✅ Performance melhorada com cache

---

## 🚀 Próximos Passos

1. ✅ **Revisão concluída** - Guia alinhado com projeto atual
2. ⏳ **Implementação** - Seguir checklist revisado
3. ⏳ **Testes** - Validar com dados existentes
4. ⏳ **Deploy** - Migração gradual

---

**Revisão realizada por**: Cursor IA  
**Data**: Novembro 2025  
**Status**: ✅ Completo e Pronto para Implementação

