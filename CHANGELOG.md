# Changelog - Hardening e Melhorias UX/LGPD

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.2.0] - 2025-10-31

### 🎉 Adicionado

#### Export de Dados
- **Export CSV** para resultados de questionários
- **Export JSON** para resultados de questionários
- **Função utilitária** `utils/exportData.ts` para preparação e exportação de dados
- **Tracking de eventos** para exportações (CSV, JSON, PDF)
- **Botões de exportação** na interface ReportView (CSV, JSON, PDF)

#### Observabilidade
- **Plausible Analytics** configurado (privacy-first, opt-in)
- **Tracking de eventos** customizados (login, logout, questionnaire_completed, etc.)
- **Pageview tracking** automático nas mudanças de rota

#### Testes
- **Testes unitários** para `scoringEngine` (`tests/utils/scoringEngine.test.ts`)
- **Testes unitários** para `encryption` (`tests/utils/encryption.test.ts`)

#### Documentação
- **ARCHITECTURE.md** - Arquitetura completa do sistema
- **README.md** atualizado - Guia completo do projeto
- **SECURITY.md** atualizado - Vulnerabilidades e estratégias documentadas
- **FINAL_SUMMARY.md** - Resumo executivo final

### 🔧 Corrigido

#### Export
- **Validação** de resultados selecionados antes de exportar
- **Tratamento de erros** melhorado em exportações

### 📊 Métricas

#### Export
- **CSV**: Formato compatível com Excel e Google Sheets
- **JSON**: Formato estruturado para análise programática
- **Tracking**: Eventos rastreados automaticamente

## [0.1.0] - 2025-10-31

### 🎉 Adicionado

#### Build e Infraestrutura
- **Tailwind CSS local** via PostCSS (removido CDN)
- **Configuração PostCSS** (`postcss.config.js`)
- **Configuração Tailwind** (`tailwind.config.js`) com purge otimizado
- **Arquivo CSS base** (`index.css`) com `@tailwind` directives
- **Import dinâmico ESModule** para jsPDF (sem CDN)

#### Segurança
- **Content Security Policy (CSP)** no `index.html`
- **IndexedDB (Dexie)** para armazenamento de dados sensíveis
- **Criptografia em repouso** (AES-GCM via Web Crypto API)
- **Derivação de chaves** via PBKDF2 (100.000 iterações, SHA-256)
- **Isolamento de dados** por profissional
- **Documentação LGPD completa** (`docs/LGPD_DATA_FLOW.md`)

#### Roteamento
- **React Router v6** implementado
- **Lazy loading** de rotas com `React.lazy` + `Suspense`
- **Code splitting** por rota
- **Rotas protegidas** (`ProtectedRoute`) com verificação de autenticação e LGPD consent
- **Componente Layout** com navegação melhorada
- **URLs semânticas**: `/patients`, `/questionnaires`, `/report`, etc.

#### Estado
- **Hook `useIndexedDB`** para acesso a dados criptografados
- **Hook `useSecureStorage`** para migração de localStorage
- **Migração automática** de localStorage para IndexedDB
- **Estrutura de database** isolada por profissional

#### Internacionalização
- **i18next** configurado com detecção de idioma
- **Idiomas suportados**: pt-BR (padrão), en
- **Arquivos de tradução**: `i18n/locales/pt-BR.json`, `i18n/locales/en.json`
- **Traduções** para navegação e componentes básicos

#### Validação e Engine
- **Zod** para validação de schemas de questionários
- **Engine de scoring centralizado** (`utils/scoringEngine.ts`)
- **Validação de questionários** (`utils/questionnaireSchema.ts`)
- **Cálculo robusto** de pontuações com suporte a fórmulas complexas

#### Qualidade de Código
- **ESLint** configurado com regras TypeScript + React
- **Prettier** configurado para formatação automática
- **Husky** + **lint-staged** para pre-commit hooks
- **Vitest** + **React Testing Library** configurados
- **Scripts npm**: `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:ui`, `test:coverage`

#### Acessibilidade
- **Skip link** no `index.css`
- **Focus visible styles** para navegação por teclado
- **ARIA labels e roles** básicos no Layout
- **Navegação por teclado** melhorada
- **Suporte a alto contraste** e reduced motion

#### Observabilidade
- **Sentry** configurado (error tracking, opt-in)
- **ErrorBoundary** implementado
- **Filtragem de dados sensíveis** no Sentry

#### PWA (Progressive Web App)
- **Manifest** configurado (`public/manifest.json`)
- **Service Worker** via VitePWA plugin
- **Cache strategies** implementadas (Cache First para assets, Network First para HTML)
- **Workbox** configurado para caching
- **24 assets precacheados** (1747.47 KiB)
- **Offline support** básico
- **Installable** (pode ser instalado no dispositivo)

#### CI/CD
- **GitHub Actions** configurado (`.github/workflows/ci.yml`)
- **Lint, Build, Test** automatizados
- **Security audit** incluído
- **Build artifacts** salvos

### 🔧 Corrigido

#### Build
- **Charset**: `UTF-M` → `UTF-8` no `index.html`
- **Lang**: `en` → `pt-BR` no `index.html`
- **Dependências**: Removidos todos os CDNs (React, @google/genai, jsPDF, Tailwind)

#### Arquitetura
- **Navegação**: Migrada de state (`view`) para React Router
- **Code splitting**: Implementado para reduzir bundle inicial
- **Lazy loading**: Componentes carregados sob demanda

### 📊 Métricas

#### Bundle Size
- **CSS**: 30.17 kB (gzip: 5.58 kB) ✅ (reduzido de 56KB)
- **JS Principal**: 159.40 kB (gzip: 53.42 kB) ✅
- **Bundles de Rotas**:
  - LandingPage: 6.08 kB (gzip: 1.97 kB)
  - Login: 8.28 kB (gzip: 3.26 kB)
  - ProfessionalView: 15.16 kB (gzip: 4.19 kB)
  - ReportView: 25.31 kB (gzip: 8.99 kB)
  - QuestionnairesView: 31.48 kB (gzip: 8.10 kB)

#### Performance
- **Tempo de Build**: ~8-26s ✅
- **Code Splitting**: Implementado ✅
- **Lazy Loading**: Implementado ✅

### ⚠️ Conhecido

- 12 vulnerabilidades npm detectadas (11 moderate, 1 high)
  - Ação recomendada: Monitorar atualizações (ver `docs/SECURITY.md`)
  - Correção requer breaking changes (firebase@12.5.0, jspdf@3.0.3)
- Migração de localStorage ainda em progresso
  - Fallback automático durante migração

### 📝 Documentação

- **`docs/HARDENING_PROGRESS.md`**: Progresso detalhado
- **`docs/LGPD_DATA_FLOW.md`**: Fluxo de dados LGPD completo
- **`docs/SECURITY.md`**: Segurança e vulnerabilidades
- **`docs/PWA.md`**: Documentação PWA
- **`docs/ARCHITECTURE.md`**: Arquitetura do sistema
- **`docs/FINAL_SUMMARY.md`**: Resumo executivo
- **`CHANGELOG.md`**: Este arquivo

### 🔜 Próximas Versões

- [ ] Testes unitários completos (cobertura ≥70%)
- [ ] Testes e2e (Playwright)
- [ ] Share links cifrados (query param curto + expiração)
- [ ] Otimização de bundle (remover dependências não usadas)
- [ ] Lighthouse CI
- [ ] Background sync para PWA
- [ ] Push notifications
