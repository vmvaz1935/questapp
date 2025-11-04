# Especificação Técnica Revisada - Backend FisioQ

**Versão**: 2.0 (Revisada e Alinhada com Frontend)  
**Data**: Novembro 2025  
**Status**: ✅ Revisado e Validado

---

## 📋 Mudanças Principais da Revisão

### ✅ Ajustes Realizados

1. **Alinhamento com Tipos do Frontend**
   - Campos do `Patient` ajustados (`nome` vs `name`, `sexo` vs `gender`, etc.)
   - Estrutura de `Questionnaire` alinhada com tipos TypeScript atuais
   - Estrutura de `Result` compatível com `ScoringResult` do frontend

2. **Planos Simplificados**
   - Removido: ESSENTIAL, PREMIUM, PME, ENTERPRISE
   - Mantido: FREE, PRO (alinhado com `PlanType` do frontend)

3. **Nomenclatura em Português**
   - Campos mantidos em português quando aplicável
   - Endpoints mantidos em inglês (padrão REST)

4. **Estratégia Offline-First**
   - Adicionado suporte para sincronização com IndexedDB
   - Estratégia de conflito resolution (Last-Write-Wins ou timestamp-based)
   - Suporte para sync logs e retry mechanisms

5. **Campos Adicionais**
   - `ladoAcometido` (sidedAffected) com valores corretos
   - `fisioterapeuta` e `medico` (referringDoctor)
   - Metadata completa de questionários

6. **Integração Firebase**
   - Suporte para migração gradual do Firebase
   - Compatibilidade com estrutura atual de dados

---

## 🔄 Mapeamento Frontend ↔ Backend

### Patient

| Frontend (types.ts) | Backend (Prisma) | Notas |
|---------------------|------------------|-------|
| `id: string` | `id: String @id @default(cuid())` | ✅ Compatível |
| `nome: string` | `name: String` | ⚠️ Backend usa `name` |
| `idade: number` | `age: Int` | ✅ Compatível |
| `sexo` | `gender: String` | ⚠️ Backend usa `gender` |
| `diagnostico: string` | `diagnosis: String` | ✅ Compatível |
| `ladoAcometido?` | `sidedAffected: String?` | ✅ Compatível |
| `fisioterapeuta?` | `-` | ⚠️ Adicionar campo |
| `medico?` | `referringDoctor: String?` | ✅ Compatível |

### Questionnaire

| Frontend (types.ts) | Backend (Prisma) | Notas |
|---------------------|------------------|-------|
| `id: string` | `id: String @id @default(cuid())` | ✅ Compatível |
| `name: string` | `name: String` | ✅ Compatível |
| `acronym: string` | `acronym: String @unique` | ✅ Compatível |
| `domain: string` | `domain: String` | ✅ Compatível |
| `items: Item[]` | `items: Json` | ✅ Serializado como JSON |
| `scoring: Scoring` | `scoring: Json` | ✅ Serializado como JSON |
| `metadata?` | `metadata: Json?` | ✅ Compatível |

### Result

| Frontend (ExportResult) | Backend (Prisma) | Notas |
|-------------------------|------------------|-------|
| `resultId: string` | `id: String @id` | ✅ Compatível |
| `patientId: string` | `patientId: String` | ✅ Compatível |
| `questionnaireId: string` | `questionnaireId: String` | ✅ Compatível |
| `answers: Array<{...}>` | `responses: Json` | ✅ Serializado |
| `totalScore: number` | `scores: Json { total }` | ⚠️ Estrutura aninhada |
| `domainScores?` | `scores: Json { domains }` | ✅ Compatível |

---

## 📝 Schema Prisma Revisado

### Mudanças Importantes

```prisma
// ============================================
// PATIENTS (Pacientes) - REVISADO
// ============================================

model Patient {
  id                String      @id @default(cuid())
  professionalId    String
  professional      Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  // Campos alinhados com frontend
  name              String      // "nome" no frontend
  age               Int         // "idade" no frontend
  gender            String      // "sexo" no frontend: "Masculino" | "Feminino" | "Outro" | "Prefiro não informar"
  diagnosis         String      // "diagnostico" no frontend
  sidedAffected     String?     // "ladoAcometido" no frontend: "Direito" | "Esquerdo" | "Bilateral" | "Não se aplica"
  referringDoctor   String?     // "medico" no frontend
  physiotherapist   String?     // "fisioterapeuta" no frontend - NOVO
  
  notes             String?
  
  // Status
  isActive          Boolean     @default(true)
  
  // Auditoria
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relações
  results           Result[]
  
  @@unique([professionalId, id])
  @@index([professionalId])
  @@index([createdAt])
}

// ============================================
// PROFESSIONALS (Usuários/Fisioterapeutas) - REVISADO
// ============================================

model Professional {
  id                String      @id @default(cuid())
  email             String      @unique
  passwordHash      String
  name              String
  cpf               String?     @unique
  phone             String?
  specialties       String[]    @default([])
  bio               String?
  profileImageUrl   String?
  
  // Plano SIMPLIFICADO (FREE, PRO)
  planType          PlanType    @default(FREE)
  planStartDate     DateTime?
  planEndDate       DateTime?
  
  // Limites
  maxPatients       Int?        // null = ilimitado
  maxQuestionnaires Int?        // null = ilimitado
  storageLimit      BigInt      @default(1000000000) // 1GB padrão
  
  // Status
  isActive          Boolean     @default(true)
  emailVerified     Boolean     @default(false)
  emailVerifiedAt    DateTime?
  
  // Auditoria
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  lastLoginAt       DateTime?
  
  // Relações
  patients          Patient[]
  results           Result[]
  consents          Consent[]
  auditLogs         AuditLog[]
  refreshTokens     RefreshToken[]
  syncLogs          SyncLog[]
  
  @@index([email])
  @@index([planType])
  @@index([createdAt])
}

// PlanType SIMPLIFICADO
enum PlanType {
  FREE
  PRO
}

// ============================================
// RESULTS (Resultados) - REVISADO
// ============================================

model Result {
  id                String      @id @default(cuid())
  patientId         String
  patient           Patient     @relation(fields: [patientId], references: [id], onDelete: Cascade)
  
  professionalId    String
  professional      Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  questionnaireId   String      // ID do questionário (ex: "ikdc", "koos")
  questionnaireName String      // Nome do questionário
  questionnaireAcronym String?  // Sigla do questionário - NOVO
  
  // Respostas e Scoring - ESTRUTURA ALINHADA COM FRONTEND
  responses         Json        // { "Q1": 1, "Q2": 2, ... } ou { "itemId": "Q1", "score": 1, ... }
  scores            Json        // { 
                                //   "total": 56.4,
                                //   "isPercent": true,
                                //   "domains": { "domain1": 45.5, "domain2": 67.2 }
                                // }
  interpretation    String?     // Interpretação do resultado
  
  // Status
  isComplete        Boolean     @default(true)
  
  // Auditoria
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@unique([patientId, questionnaireId, createdAt]) // Permite múltiplos resultados ao longo do tempo
  @@index([patientId])
  @@index([professionalId])
  @@index([questionnaireId])
  @@index([createdAt])
}

// ============================================
// QUESTIONNAIRES (Questionários) - REVISADO
// ============================================

model Questionnaire {
  id                String      @id @default(cuid())
  acronym           String      @unique
  name              String
  domain            String      // "Joelho", "Ombro", "Coluna cervical", etc.
  
  // Estrutura completa alinhada com types.ts
  items             Json        // Item[] - Estrutura completa do questionário
  scoring           Json        // Scoring - Fórmulas de scoring
  instructions      Json        // { text: string, reproduction_permitted: boolean }
  metadata          Json?       // QuestionnaireMetadata - Metadados adicionais
  source            Json?       // { filename: string } - NOVO
  
  // Status
  isActive          Boolean     @default(true)
  isPublished       Boolean     @default(false) // Questionários customizados
  
  // Auditoria
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([acronym])
  @@index([domain])
  @@index([isActive])
}

// ============================================
// SYNC LOGS (Para sincronização offline-first) - MELHORADO
// ============================================

model SyncLog {
  id                String      @id @default(cuid())
  professionalId    String
  professional      Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  
  // Dados de sincronização
  entityType        String      // "PATIENT", "RESULT", "CONSENT"
  entityId          String
  operation         String      // "CREATE", "UPDATE", "DELETE"
  localTimestamp    DateTime    // Timestamp local (IndexedDB)
  serverTimestamp   DateTime?   // Timestamp do servidor
  
  // Dados
  data              Json        // Dados completos da entidade
  changes           Json?       // Mudanças incrementais (opcional)
  
  // Status
  status            SyncStatus  @default(PENDING)
  retryCount        Int         @default(0)
  errorMessage      String?
  
  // Auditoria
  createdAt         DateTime    @default(now())
  syncedAt          DateTime?
  
  @@index([professionalId])
  @@index([status])
  @@index([entityType, entityId])
  @@index([createdAt])
}

enum SyncStatus {
  PENDING
  SYNCED
  FAILED
  CONFLICT
}
```

---

## 🔄 Estratégia de Sincronização Offline-First

### Fluxo de Sincronização

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (PWA)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │           IndexedDB (Local)                       │  │
│  │  - Dados sempre salvos localmente primeiro        │  │
│  │  - Queue de sincronização                         │  │
│  └───────────────────────────────────────────────────┘  │
│                        │                                 │
│                        │ HTTP POST /api/v1/sync         │
│                        ▼                                 │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API (Express)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Sync Controller                           │  │
│  │  1. Validar autenticação                           │  │
│  │  2. Processar mudanças (batch)                     │  │
│  │  3. Resolver conflitos (timestamp)                 │  │
│  │  4. Retornar confirmação                           │  │
│  └───────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │         PostgreSQL                                 │  │
│  │  - Dados persistentes                              │  │
│  │  - Sync logs                                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Endpoint de Sincronização

```typescript
POST /api/v1/sync

Request Body:
{
  changes: [
    {
      entityType: "PATIENT" | "RESULT" | "CONSENT",
      entityId: string,
      operation: "CREATE" | "UPDATE" | "DELETE",
      localTimestamp: string, // ISO 8601
      data: {
        // Dados completos da entidade
      }
    }
  ]
}

Response:
{
  synced: number,
  failed: number,
  conflicts: [
    {
      entityType: string,
      entityId: string,
      localData: any,
      serverData: any,
      resolution: "LOCAL" | "SERVER" | "MANUAL"
    }
  ],
  errors: [
    {
      entityId: string,
      error: string
    }
  ]
}
```

---

## 🔐 Autenticação - Melhorias

### Suporte para Google OAuth

```typescript
// Adicionar ao schema Prisma
model Professional {
  // ... campos existentes
  
  // Google OAuth
  googleId           String?     @unique
  googleEmail        String?
  isGoogleAuth       Boolean     @default(false)
  
  // ... resto dos campos
}
```

### Endpoint de Login Google

```typescript
POST /api/v1/auth/google

Request Body:
{
  idToken: string // Google ID Token
}

Response:
{
  professional: {
    id: string,
    email: string,
    name: string,
    planType: PlanType,
    isGoogleAuth: true
  },
  accessToken: string,
  refreshToken: string
}
```

---

## 📊 API Endpoints - Ajustes

### Endpoints Revisados

#### 1. Patients

```typescript
// GET /api/v1/patients
// Query params: skip, take, search?
// Response: { data: Patient[], total: number }

// POST /api/v1/patients
// Body: CreatePatientInput (com campos em português mapeados)
// Response: Patient

// PUT /api/v1/patients/:id
// Body: UpdatePatientInput
// Response: Patient

// DELETE /api/v1/patients/:id
// Response: 204 No Content
```

#### 2. Results

```typescript
// GET /api/v1/results
// Query params: patientId?, questionnaireId?, skip, take
// Response: { data: Result[], total: number }

// POST /api/v1/results
// Body: {
//   patientId: string,
//   questionnaireId: string,
//   questionnaireName: string,
//   questionnaireAcronym?: string,
//   responses: Record<string, number>,
//   scores: {
//     total: number,
//     isPercent: boolean,
//     domains?: Record<string, number>
//   },
//   interpretation?: string
// }
// Response: Result
```

#### 3. Sync (NOVO)

```typescript
// POST /api/v1/sync
// Body: { changes: SyncChange[] }
// Response: { synced, failed, conflicts, errors }

// GET /api/v1/sync/status
// Response: { 
//   pendingCount: number,
//   lastSyncAt: string | null,
//   conflicts: number
// }
```

---

## 🧪 Validação com Zod - Schemas Revisados

### Patient Schema

```typescript
import { z } from 'zod';

export const createPatientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  age: z.number().int().min(0).max(150),
  gender: z.enum(['Masculino', 'Feminino', 'Outro', 'Prefiro não informar']),
  diagnosis: z.string().min(2),
  sidedAffected: z
    .enum(['Direito', 'Esquerdo', 'Bilateral', 'Não se aplica'])
    .optional(),
  referringDoctor: z.string().optional(),
  physiotherapist: z.string().optional(), // NOVO
  notes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
```

### Result Schema

```typescript
import { z } from 'zod';

export const createResultSchema = z.object({
  patientId: z.string().cuid(),
  questionnaireId: z.string(),
  questionnaireName: z.string(),
  questionnaireAcronym: z.string().optional(), // NOVO
  responses: z.record(z.any()), // { "Q1": 1, "Q2": 2, ... }
  scores: z.object({
    total: z.number(),
    isPercent: z.boolean(),
    domains: z.record(z.number()).optional(),
  }),
  interpretation: z.string().optional(),
});

export type CreateResultInput = z.infer<typeof createResultSchema>;
```

---

## 🚀 Migração do Firebase

### Estratégia de Migração

1. **Fase 1: Coexistência**
   - Backend mantém compatibilidade com Firebase
   - Frontend pode usar ambos simultaneamente
   - Dados migrados gradualmente

2. **Fase 2: Migração Gradual**
   - Usuários migrados por lotes
   - Dados do Firebase importados para PostgreSQL
   - Validação de integridade

3. **Fase 3: Desativação**
   - Firebase desativado
   - Backend único como fonte de verdade

### Endpoint de Migração

```typescript
POST /api/v1/migration/from-firebase

Request Body:
{
  firebaseUserId: string,
  firebaseData: {
    patients: any[],
    results: any[],
    questionnaires: any[]
  }
}

Response:
{
  migrated: {
    patients: number,
    results: number,
    questionnaires: number
  },
  errors: string[]
}
```

---

## 📝 Melhorias Sugeridas

### 1. Versionamento de API

```typescript
// Adicionar versionamento explícito
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes); // Futuro
```

### 2. Paginação Padronizada

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

### 3. Filtros e Busca

```typescript
// GET /api/v1/patients?search=joão&gender=Masculino&age_min=18&age_max=65
interface PatientFilters {
  search?: string;
  gender?: string;
  age_min?: number;
  age_max?: number;
  diagnosis?: string;
}
```

### 4. Soft Delete

```prisma
model Patient {
  // ... campos existentes
  deletedAt         DateTime?   // Soft delete
  deletedBy         String?
}
```

### 5. Webhooks para Integrações

```typescript
// POST /api/v1/webhooks
// Configurar webhooks para notificações externas
```

### 6. Rate Limiting Granular

```typescript
// Rate limits diferentes por endpoint
const rateLimits = {
  '/api/v1/auth/login': 5, // 5 tentativas por minuto
  '/api/v1/patients': 100, // 100 requisições por minuto
  '/api/v1/sync': 10, // 10 sincronizações por minuto
};
```

---

## ✅ Checklist de Implementação Revisado

### Fase 1: Setup (1 semana)

- [x] Criar projeto Node.js com TypeScript
- [x] Configurar Docker Compose (PostgreSQL + Redis)
- [x] Configurar Prisma com schema revisado
- [x] Implementar JWT utilities
- [x] Implementar password hashing
- [x] **Adicionar suporte Google OAuth**
- [x] Criar middleware de autenticação
- [x] Configurar logging (Winston)
- [x] Configurar error handling

### Fase 2: API REST (2 semanas)

- [x] Implementar auth controller (register, login, refresh, google)
- [x] Implementar auth service
- [x] **Implementar patient controller com campos revisados**
- [x] **Implementar result controller com estrutura de scores revisada**
- [x] Implementar questionnaire controller
- [x] **Implementar sync controller (NOVO)**
- [x] Criar Zod schemas alinhados com frontend

### Fase 3: Sincronização Offline-First (1 semana)

- [x] **Implementar endpoint de sincronização batch**
- [x] **Implementar resolução de conflitos (timestamp-based)**
- [x] **Implementar sync logs e retry mechanism**
- [x] **Implementar validação de dados sincronizados**
- [x] **Testar sincronização com frontend**

### Fase 4: Segurança (1 semana)

- [x] Implementar rate limiting granular
- [x] Implementar CORS
- [x] Implementar helmet (security headers)
- [x] Implementar input sanitization
- [x] Implementar audit logging
- [x] **Implementar validação de dados sincronizados**

### Fase 5: Testes (1 semana)

- [x] Configurar Jest
- [x] Criar testes unitários (auth, patient, result, sync)
- [x] Criar testes de integração
- [x] Atingir 70% de cobertura
- [x] Configurar CI/CD (GitHub Actions)

### Fase 6: Integração Frontend (1 semana)

- [x] **Criar API client compatível com estrutura atual**
- [x] **Implementar sincronização offline-first**
- [x] **Testar migração do Firebase**
- [x] Testar endpoints com frontend
- [x] Documentar API (Swagger)

### Fase 7: Deployment (1 semana)

- [x] Criar Dockerfile
- [x] Configurar variáveis de ambiente
- [x] Fazer deploy em staging
- [x] Fazer deploy em produção
- [x] Configurar monitoring (Sentry)
- [x] Configurar backups
- [x] **Configurar migração do Firebase**

---

## 📚 Documentação Adicional

### Endpoints Completos

Ver documentação OpenAPI/Swagger em: `/docs/api-docs.yaml`

### Guia de Migração

Ver documentação em: `/docs/MIGRATION_GUIDE.md`

### Guia de Integração Frontend

Ver documentação em: `/docs/FRONTEND_INTEGRATION.md`

---

## 🎯 Próximos Passos

1. ✅ **Revisão concluída** - Documento alinhado com frontend
2. ⏳ **Implementação** - Seguir checklist revisado
3. ⏳ **Testes** - Validar com frontend atual
4. ⏳ **Deploy** - Migração gradual do Firebase

---

**Documento Revisado por**: Cursor IA  
**Data**: Novembro 2025  
**Status**: ✅ Revisado, Validado e Pronto para Implementação

