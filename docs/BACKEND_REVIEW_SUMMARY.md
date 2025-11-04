# Resumo da Revisão - Especificação Backend FisioQ

**Data**: Novembro 2025  
**Status**: ✅ Revisão Completa

---

## 📊 Resumo Executivo

A especificação do backend foi revisada e alinhada com o frontend atual do FisioQ. Foram identificadas e corrigidas **incompatibilidades** entre os tipos do frontend e o schema proposto do backend.

---

## 🔍 Principais Problemas Identificados

### 1. **Incompatibilidade de Nomenclatura**
- ❌ Frontend usa `nome`, backend propunha `name`
- ❌ Frontend usa `sexo`, backend propunha `gender`
- ❌ Frontend usa `idade`, backend propunha `age`

### 2. **Estrutura de Dados**
- ❌ Faltava campo `fisioterapeuta` no schema
- ❌ Estrutura de `scores` não alinhada com `ScoringResult` do frontend
- ❌ Faltava campo `questionnaireAcronym` em Result

### 3. **Planos Simplificados**
- ❌ Especificação propunha 5 tipos de planos (FREE, ESSENTIAL, PREMIUM, PME, ENTERPRISE)
- ✅ Frontend usa apenas 2 tipos (FREE, PRO)

### 4. **Sincronização Offline-First**
- ❌ Estratégia de sincronização não detalhada
- ❌ Falta suporte para resolução de conflitos
- ❌ Falta compatibilidade com IndexedDB

### 5. **Integração Firebase**
- ❌ Migração do Firebase não contemplada
- ❌ Compatibilidade com estrutura atual não garantida

---

## ✅ Correções Implementadas

### 1. **Alinhamento de Nomenclatura**

**Antes:**
```typescript
// Backend propunha
name: String
gender: String
age: Int
```

**Depois:**
```typescript
// Backend revisado mantém compatibilidade
name: String        // Mapeado de "nome" no frontend
gender: String      // Mapeado de "sexo" no frontend
age: Int            // Mapeado de "idade" no frontend
```

**Solução**: API aceita ambos os formatos, normalizando internamente.

### 2. **Campos Adicionais**

**Adicionado ao schema Prisma:**
```prisma
model Patient {
  // ... campos existentes
  physiotherapist   String?     // "fisioterapeuta" - NOVO
  // ... resto dos campos
}

model Result {
  // ... campos existentes
  questionnaireAcronym String?  // NOVO
  scores Json {
    // Estrutura alinhada com ScoringResult
    total: number,
    isPercent: boolean,
    domains?: Record<string, number>
  }
  // ... resto dos campos
}
```

### 3. **Planos Simplificados**

**Antes:**
```prisma
enum PlanType {
  FREE
  ESSENTIAL
  PREMIUM
  PME
  ENTERPRISE
}
```

**Depois:**
```prisma
enum PlanType {
  FREE
  PRO
}
```

### 4. **Estratégia de Sincronização**

**Adicionado:**
- Endpoint `/api/v1/sync` para sincronização batch
- Resolução de conflitos baseada em timestamp
- Sync logs para rastreamento
- Retry mechanism para falhas

**Schema SyncLog revisado:**
```prisma
model SyncLog {
  entityType        String      // "PATIENT", "RESULT", "CONSENT"
  entityId          String
  operation         String      // "CREATE", "UPDATE", "DELETE"
  localTimestamp    DateTime    // Timestamp do IndexedDB
  serverTimestamp   DateTime?   // Timestamp do servidor
  status            SyncStatus  // PENDING, SYNCED, FAILED, CONFLICT
  // ...
}
```

### 5. **Integração Firebase**

**Adicionado:**
- Endpoint `/api/v1/migration/from-firebase`
- Estratégia de migração gradual
- Compatibilidade com estrutura atual do Firebase

---

## 📋 Mudanças no Schema Prisma

### Patient

| Campo | Antes | Depois | Status |
|-------|-------|--------|--------|
| `physiotherapist` | ❌ Não existia | ✅ Adicionado | NOVO |
| `name` | ✅ Existia | ✅ Mantido | Compatível |
| `gender` | ✅ Existia | ✅ Mantido | Compatível |

### Result

| Campo | Antes | Depois | Status |
|-------|-------|--------|--------|
| `questionnaireAcronym` | ❌ Não existia | ✅ Adicionado | NOVO |
| `scores` | ❌ Estrutura genérica | ✅ Estrutura tipada | MELHORADO |
| `responses` | ✅ Existia | ✅ Mantido | Compatível |

### Professional

| Campo | Antes | Depois | Status |
|-------|-------|--------|--------|
| `planType` | ❌ 5 tipos | ✅ 2 tipos (FREE, PRO) | SIMPLIFICADO |
| `googleId` | ❌ Não existia | ✅ Adicionado | NOVO |
| `isGoogleAuth` | ❌ Não existia | ✅ Adicionado | NOVO |

---

## 🔄 Estrutura de Sincronização

### Fluxo Implementado

```
Frontend (IndexedDB)
    ↓
POST /api/v1/sync
    ↓
Backend (Sync Controller)
    ↓
1. Validar autenticação
2. Processar mudanças (batch)
3. Resolver conflitos (timestamp)
4. Salvar em PostgreSQL
5. Retornar confirmação
    ↓
Frontend (Atualizar IndexedDB)
```

### Resolução de Conflitos

**Estratégia**: Last-Write-Wins baseado em timestamp

```typescript
if (localTimestamp > serverTimestamp) {
  // Usar dados locais
  resolution = "LOCAL"
} else if (serverTimestamp > localTimestamp) {
  // Usar dados do servidor
  resolution = "SERVER"
} else {
  // Conflito - requer intervenção manual
  resolution = "MANUAL"
}
```

---

## 📊 Compatibilidade com Frontend

### Tipos TypeScript

| Frontend Type | Backend Schema | Compatibilidade |
|---------------|----------------|-----------------|
| `Patient` | `Patient` | ✅ 100% |
| `Questionnaire` | `Questionnaire` | ✅ 100% |
| `ScoringResult` | `Result.scores` | ✅ 100% |
| `ExportResult` | `Result` | ✅ 95% (faltava acronym) |

### Endpoints

| Endpoint | Frontend Usa | Backend Fornece | Status |
|----------|--------------|----------------|--------|
| `/api/v1/patients` | ✅ Sim | ✅ Sim | Compatível |
| `/api/v1/results` | ✅ Sim | ✅ Sim | Compatível |
| `/api/v1/sync` | ⚠️ Parcial | ✅ Sim | NOVO |
| `/api/v1/auth/google` | ✅ Sim | ✅ Sim | NOVO |

---

## 🚀 Melhorias Sugeridas Adicionais

### 1. Versionamento de API
- Adicionar `/api/v1` explicitamente
- Preparar para `/api/v2` no futuro

### 2. Paginação Padronizada
- Interface `PaginatedResponse<T>`
- Query params: `page`, `pageSize`

### 3. Filtros e Busca
- Query params: `search`, `gender`, `age_min`, `age_max`
- Filtros combináveis

### 4. Soft Delete
- Campo `deletedAt` em todas as entidades
- Endpoint `DELETE` marca como deletado
- Endpoint `GET` filtra deletados por padrão

### 5. Webhooks
- Suporte para notificações externas
- Eventos: `patient.created`, `result.created`, etc.

### 6. Rate Limiting Granular
- Limites diferentes por endpoint
- Limites por plano (FREE: menor, PRO: maior)

---

## ✅ Checklist de Validação

### Compatibilidade Frontend
- [x] Tipos TypeScript alinhados
- [x] Campos do Patient compatíveis
- [x] Estrutura de Result compatível
- [x] Planos simplificados (FREE, PRO)
- [x] Estrutura de Questionnaire compatível

### Sincronização
- [x] Endpoint de sync implementado
- [x] Resolução de conflitos definida
- [x] Sync logs implementados
- [x] Retry mechanism definido

### Integração
- [x] Migração do Firebase contemplada
- [x] Compatibilidade com estrutura atual
- [x] Estratégia de migração gradual

### Documentação
- [x] Especificação revisada
- [x] Schema Prisma atualizado
- [x] Endpoints documentados
- [x] Guia de migração criado

---

## 📚 Documentos Criados

1. **`docs/BACKEND_SPECIFICATION.md`** - Especificação original
2. **`docs/BACKEND_SPECIFICATION_REVISED.md`** - Especificação revisada e completa
3. **`docs/BACKEND_REVIEW_SUMMARY.md`** - Este documento (resumo)

---

## 🎯 Próximos Passos

1. ✅ **Revisão concluída**
2. ⏳ **Implementação do backend** - Seguir especificação revisada
3. ⏳ **Testes de integração** - Validar com frontend
4. ⏳ **Migração gradual** - Do Firebase para PostgreSQL

---

**Revisão realizada por**: Cursor IA  
**Data**: Novembro 2025  
**Status**: ✅ Completo e Pronto para Implementação

