# Arquitetura - FisioQ

## Visão Geral

FisioQ é uma Progressive Web App (PWA) construída com React 19, TypeScript, Vite e Tailwind CSS. A aplicação permite que fisioterapeutas gerenciem pacientes, apliquem questionários clínicos validados e acompanhem a evolução do tratamento.

## Stack Tecnológico

### Frontend
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router v7** - Roteamento
- **Tailwind CSS** - Estilização
- **i18next** - Internacionalização (pt-BR, en)

### Estado e Dados
- **IndexedDB (Dexie)** - Armazenamento local persistente
- **localStorage** - Fallback durante migração
- **Web Crypto API** - Criptografia em repouso (AES-GCM)

### Backend/Serviços
- **Firebase** (opcional) - Auth e Firestore para sincronização
- **Sentry** (opcional) - Error tracking
- **Plausible** (opcional) - Analytics privacy-first

### Qualidade e Testes
- **ESLint** - Linting
- **Prettier** - Formatação
- **Vitest** - Testes unitários
- **React Testing Library** - Testes de componentes
- **Husky** - Git hooks
- **lint-staged** - Pre-commit hooks

### Build e Deploy
- **Vite** - Build system
- **VitePWA** - Service Worker e PWA
- **Workbox** - Cache strategies
- **GitHub Actions** - CI/CD

## Arquitetura de Diretórios

```
fisioq/
├── components/          # Componentes React
│   ├── Layout.tsx       # Layout principal com navegação
│   ├── Login.tsx        # Autenticação
│   ├── LandingPage.tsx # Página inicial
│   ├── ProfessionalView.tsx
│   ├── QuestionnaireForm.tsx
│   ├── ReportView.tsx
│   └── ...
├── context/             # React Context
│   └── AuthContext.tsx  # Contexto de autenticação
├── hooks/               # Custom hooks
│   ├── useLocalStorage.ts
│   ├── useIndexedDB.ts  # Hook para IndexedDB
│   └── usePlanLimits.ts
├── services/            # Serviços e lógica de negócio
│   ├── database.ts      # IndexedDB (Dexie)
│   ├── encryption.ts    # Criptografia AES-GCM
│   ├── firebaseSync.ts  # Sincronização Firebase
│   └── sentry.ts        # Error tracking
├── utils/               # Utilitários
│   ├── scoringEngine.ts # Engine de scoring
│   ├── questionnaireSchema.ts # Validação Zod
│   ├── analytics.ts     # Analytics (Plausible)
│   └── ...
├── data/                # Dados estáticos
│   └── questionnaires/  # Questionários em JSON
├── i18n/                # Internacionalização
│   ├── config.ts
│   └── locales/
├── types/                # TypeScript types
│   └── types.ts
├── tests/                # Testes
├── docs/                 # Documentação
└── public/               # Assets estáticos
```

## Fluxo de Dados

### 1. Autenticação

```
Usuario → Login.tsx
  → AuthContext
  → localStorage (professionalId)
  → IndexedDB (profiles table)
  → Firebase (opcional, Google OAuth)
```

### 2. Gerenciamento de Pacientes

```
ProfessionalView.tsx
  → useLocalStorage (patients_${professionalId})
  → IndexedDB (patients table)
  → Firebase Sync (opcional)
```

### 3. Questionários

```
QuestionnairesView.tsx
  → useLocalStorage (published_questionnaires)
  → IndexedDB (questionnaires table)
  → JSON files (data/questionnaires/)
```

### 4. Resultados

```
QuestionnaireForm.tsx
  → Respostas (localStorage temporário)
  → scoringEngine.ts (cálculo)
  → useLocalStorage (results_${professionalId})
  → IndexedDB (results table)
  → Firebase Sync (opcional)
```

## Segurança

### Criptografia

- **Algoritmo**: AES-GCM (256 bits)
- **Derivação de Chave**: PBKDF2 (100.000 iterações, SHA-256)
- **Salt**: Único por profissional (16 bytes)
- **IV**: Aleatório por operação (12 bytes)

### Isolamento de Dados

- **IndexedDB**: Um banco por profissional (`FisioQ_${professionalId}`)
- **Criptografia**: Aplicada apenas a dados sensíveis
- **Autenticação**: Local (email/senha hash) ou Google OAuth

### LGPD Compliance

- **Consentimento**: Obrigatório antes de uso
- **Consent Log**: Armazenado permanentemente para auditoria
- **Direitos do Titular**: Interface para acesso, correção, exclusão
- **Documentação**: `docs/LGPD_DATA_FLOW.md`

## Performance

### Code Splitting

- **React.lazy**: Rotas carregadas sob demanda
- **Suspense**: Loading states durante carregamento
- **Bundle size**: ~424KB (gzip: 141KB) - inclui PWA + Sentry

### Cache Strategies

- **Cache First**: Assets estáticos (JS, CSS, imagens)
- **Network First**: HTML e chamadas de API
- **Service Worker**: PWA com Workbox

### Otimizações

- **Tailwind Purge**: CSS reduzido de 56KB → 30KB
- **Tree Shaking**: Dependências não usadas removidas
- **Lazy Loading**: Componentes e rotas carregados sob demanda

## Roteamento

### Estrutura de Rotas

```
/                    → LandingPage (se não autenticado)
/login               → Login
/patients            → ProfessionalView (protegido)
/questionnaires      → QuestionnairesView (protegido)
/report              → ReportView (protegido)
/comparison          → ComparisonView (protegido)
/privacy             → PrivacyPolicy (protegido)
```

### Protected Routes

- **ProtectedRoute**: Wrapper que verifica autenticação e consentimento LGPD
- **Redirect**: Não autenticado → `/`
- **Consent**: Não aceito → `ConsentLGPD` modal

## Internacionalização

- **i18next**: Configurado com detecção automática de idioma
- **Idiomas**: pt-BR (padrão), en
- **Arquivos**: `i18n/locales/pt-BR.json`, `i18n/locales/en.json`
- **Hooks**: `useTranslation()` para traduções

## Testes

### Estrutura

- **Vitest**: Framework de testes
- **React Testing Library**: Testes de componentes
- **Cobertura**: Aumentando gradualmente

### Testes Implementados

- `tests/utils/scoringEngine.test.ts` - Engine de scoring
- `tests/utils/encryption.test.ts` - Criptografia
- `tests/components/Layout.test.tsx` - Layout component

## CI/CD

### GitHub Actions

- **Workflow**: `.github/workflows/ci.yml`
- **Jobs**:
  - Lint (ESLint, Prettier)
  - Build (Vite)
  - Test (Vitest)
  - Security Audit (npm audit)

### Deploy

- **Build**: `npm run build`
- **Output**: `dist/` (assets estáticos)
- **PWA**: Service Worker gerado automaticamente

## PWA

### Manifest

- **Arquivo**: `public/manifest.json`
- **Display**: standalone
- **Icons**: 192x192, 512x512
- **Shortcuts**: Pacientes, Questionários

### Service Worker

- **Plugin**: VitePWA
- **Estratégia**: Cache First (assets), Network First (HTML)
- **Precache**: 24 assets (~1.7MB)
- **Update**: Auto-update habilitado

## Observabilidade

### Sentry

- **Configuração**: `utils/sentry.ts`
- **Opt-in**: Via `VITE_ENABLE_SENTRY` e `VITE_SENTRY_DSN`
- **Features**: Error tracking, session replay, performance monitoring
- **Privacy**: Dados sensíveis filtrados

### Plausible

- **Configuração**: `utils/analytics.ts`
- **Opt-in**: Via `VITE_PLAUSIBLE_DOMAIN`
- **Features**: Privacy-first analytics, eventos customizados
- **Events**: Login, logout, questionnaire_completed, etc.

## Próximos Passos

1. **Testes**: Aumentar cobertura para ≥70%
2. **Performance**: Otimizar bundle (remover dependências não usadas)
3. **PWA**: Background sync, push notifications
4. **Export**: CSV/JSON export, share links cifrados
5. **Documentação**: README.md atualizado, guias de contribuição

## Referências

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Dexie Documentation](https://dexie.org/)
- [LGPD - Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)

