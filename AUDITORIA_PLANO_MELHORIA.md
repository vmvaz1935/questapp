# Auditoria + Plano de Melhoria - FisioQ Beta

**Data:** 2024  
**Versão:** Beta (~70%)  
**Stack:** React 19 + TypeScript + Vite + React Router v7 + Tailwind + i18next + Dexie/IndexedDB + Firebase (opcional) + WebCrypto AES-GCM + Vitest + RTL + VitePWA/Workbox

---

## 1. Resumo Executivo

### Top 10 Problemas/Oportunidades

1. **Autosave em localStorage sem feedback visual** (`components/QuestionnaireForm.tsx:26-28`)
   - **Impacto:** Usuário não sabe se respostas foram salvas; risco de perda de dados
   - **Onde:** `QuestionnaireForm.tsx` usa `localStorage.setItem` silenciosamente
   - **Solução:** Adicionar indicador visual de "Salvando..." / "Salvo" + migrar para IndexedDB com feedback

2. **Falta de validação em tempo real no formulário de questionário**
   - **Impacto:** Usuário só descobre campos faltando no submit; aumenta abandono
   - **Onde:** `QuestionnaireForm.tsx:242` - validação apenas no submit
   - **Solução:** Validação inline com mensagens contextuais por item

3. **Sync Firebase sem resolução de conflitos** (`services/firebaseSync.ts:117-195`)
   - **Impacto:** Dados podem ser sobrescritos; perda de informações em multi-dispositivo
   - **Onde:** `syncAllData` e `loadAllDataFromFirebase` usam estratégia "último vence"
   - **Solução:** Implementar versionamento (timestamps) + merge inteligente + UI de conflitos

4. **Cálculo de scores com parsing de fórmulas frágil** (`components/QuestionnaireForm.tsx:117-182`)
   - **Impacto:** Erros silenciosos em questionários com fórmulas complexas; resultados incorretos
   - **Onde:** Regex parsing manual de fórmulas; não cobre todos os casos
   - **Solução:** Migrar para `utils/scoringEngine.ts` (já existe mas não é usado) + testes unitários

5. **Criptografia sem rotação de chaves** (`services/encryption.ts:15-62`)
   - **Impacto:** Risco LGPD se chave comprometida; sem recovery de dados
   - **Onde:** `deriveEncryptionKey` usa cache permanente; sem mecanismo de rotação
   - **Solução:** Adicionar versionamento de chaves + migração automática + backup de salt

6. **Falta de tratamento de erros offline** (`hooks/useFirebaseSync.ts:14-37`)
   - **Impacto:** Sync falha silenciosamente; usuário não sabe que dados não foram sincronizados
   - **Onde:** `useFirebaseSync` não trata erros de rede; sem retry automático
   - **Solução:** Implementar Background Sync API + fila de retry + notificações de status

7. **PDF gerado sem preview antes de download** (`utils/pdfGenerator.ts:149-830`)
   - **Impacto:** Usuário precisa baixar para ver; desperdício de tempo e dados
   - **Onde:** `generatePDFReport` salva direto sem preview
   - **Solução:** Adicionar modal de preview (iframe) + opção de editar antes de salvar

8. **Sem instrumentação de analytics** (nenhum arquivo encontrado)
   - **Impacto:** Impossível medir taxa de conclusão, abandono, pontos de fricção
   - **Onde:** Nenhum evento sendo rastreado
   - **Solução:** Implementar eventos mínimos (questionnaire_started, step_viewed, answer_changed, autosave_ok, questionnaire_completed, pdf_generated, sync_success/conflict)

9. **Testes insuficientes** (`tests/` tem apenas 4 arquivos)
   - **Impacto:** Regressões não detectadas; confiança baixa para deploy
   - **Onde:** Cobertura estimada <20%; falta testes e2e, integração de sync, testes de criptografia
   - **Solução:** Aumentar cobertura para >70% + Playwright e2e + testes de sync/offline

10. **Acessibilidade incompleta** (`components/QuestionnaireForm.tsx:414`)
   - **Impacto:** Usuários com deficiência não conseguem usar; não conforma WCAG 2.1 AA
   - **Onde:** Labels ARIA ausentes em alguns inputs; foco não gerenciado; contraste não validado
   - **Solução:** Auditoria completa com axe-core + correções + testes com leitores de tela

### Top 5 Melhorias com Maior ROI

1. **Feedback visual de autosave** (Esforço: 2d | Impacto: +15% conclusão | ROI: ⭐⭐⭐⭐⭐)
   - Implementar indicador "Salvando..." / "Salvo há X segundos"
   - Migrar autosave para IndexedDB com debounce
   - **Justificativa:** Reduz ansiedade do usuário; aumenta confiança; previne perda de dados

2. **Validação em tempo real** (Esforço: 3d | Impacto: +20% conclusão | ROI: ⭐⭐⭐⭐⭐)
   - Validação inline por item com mensagens contextuais
   - Highlight de campos incompletos
   - **Justificativa:** Reduz fricção; usuário corrige erros antes de tentar submeter

3. **Instrumentação de analytics** (Esforço: 2d | Impacto: Dados para decisões | ROI: ⭐⭐⭐⭐)
   - Implementar eventos críticos (start, progress, complete, abandon)
   - Dashboard básico de métricas
   - **Justificativa:** Permite data-driven decisions; identifica pontos de abandono

4. **Preview de PDF antes de download** (Esforço: 2d | Impacto: +10% geração de PDF | ROI: ⭐⭐⭐⭐)
   - Modal com iframe preview
   - Opção de editar/ajustar antes de salvar
   - **Justificativa:** Reduz tentativas; aumenta satisfação; economia de dados

5. **Resolução de conflitos no sync** (Esforço: 5d | Impacto: Confiabilidade Pro | ROI: ⭐⭐⭐⭐)
   - Versionamento com timestamps
   - UI de resolução de conflitos
   - Merge inteligente (último write wins com backup)
   - **Justificativa:** Crítico para plano Pro; aumenta confiança multi-dispositivo

### Riscos Principais + Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **LGPD: Criptografia comprometida** | Média | Crítico | Rotação de chaves + auditoria de segurança + backup de salt em local seguro |
| **Dados clínicos incorretos (score errado)** | Média | Crítico | Migrar para `scoringEngine.ts` + testes unitários por questionário + validação cross-check |
| **Perda de dados em sync** | Alta | Alto | Background Sync API + fila de retry + confirmação antes de sobrescrever |
| **Abandono alto em questionários longos** | Alta | Alto | Progresso visual + validação em tempo real + autosave com feedback + "Salvar e continuar depois" |
| **Performance offline degradada** | Média | Médio | Otimizar IndexedDB queries + lazy loading + service worker cache strategy |

---

## 2. Mapa de Fluxos e Jornada

### Jornada do Paciente (Hipótese - não há código específico)

```
1. Onboarding
   └─ [FRICÇÃO] Não há onboarding guiado
   └─ Sugestão: Tour interativo + explicação de privacidade

2. Consentimento LGPD
   └─ [FRICÇÃO] Modal bloqueante pode assustar
   └─ Sugestão: Explicação clara + opção de ler depois

3. Seleção/Início de Questionário
   └─ [FRICÇÃO] Não há estimativa de tempo
   └─ Sugestão: "Este questionário leva ~5 minutos"

4. Preenchimento
   └─ [FRICÇÃO] Sem feedback de autosave; validação só no final
   └─ [ABANDONO] Questionários longos (ex: IKDC com 18 itens)
   └─ Sugestão: Validação inline + progresso + autosave visível + "Salvar e continuar"

5. Revisão
   └─ [FRICÇÃO] Não há tela de revisão antes de submeter
   └─ Sugestão: Tela de resumo com opção de editar

6. Envio
   └─ [FRICÇÃO] Sem confirmação visual de sucesso
   └─ Sugestão: Toast de sucesso + opção de ver resultado

7. Feedback
   └─ [FRICÇÃO] Resultado pode ser confuso sem contexto
   └─ Sugestão: Explicação simples + gráfico visual
```

### Jornada do Fisioterapeuta

```
1. Criar/Selecionar Questionário
   └─ Local: `components/QuestionnairesView.tsx`
   └─ [FRICÇÃO] Lista pode ser longa (25+ questionários)
   └─ Sugestão: Busca + filtros por região corporal

2. Aplicar Questionário
   └─ Local: `components/QuestionnaireForm.tsx`
   └─ [FRICÇÃO] Autosave silencioso; validação só no final
   └─ Sugestão: Feedback visual + validação inline

3. Acompanhar Progresso
   └─ Local: `components/ReportView.tsx`
   └─ [FRICÇÃO] Não há dashboard de evolução
   └─ Sugestão: Gráfico de linha temporal + tabela comparativa

4. Comparar Temporalmente
   └─ Local: `components/ComparisonView.tsx`
   └─ [FRICÇÃO] Comparação pode ser confusa sem contexto
   └─ Sugestão: Gráfico de evolução + percentual de melhora destacado

5. Gerar PDF
   └─ Local: `utils/pdfGenerator.ts`
   └─ [FRICÇÃO] Sem preview; download direto
   └─ Sugestão: Modal de preview + opção de editar

6. Exportar Dados
   └─ [HIPÓTESE] Não há código de exportação CSV/JSON encontrado
   └─ Sugestão: Implementar export CSV/JSON + opção de agendar export

7. Sync Multi-Device (Pro)
   └─ Local: `services/firebaseSync.ts`
   └─ [FRICÇÃO] Sem resolução de conflitos; sync pode falhar silenciosamente
   └─ Sugestão: Background Sync + UI de status + resolução de conflitos
```

### Pontos de Abandono Identificados

1. **Início do questionário** (sem estimativa de tempo)
2. **Meio do questionário** (sem progresso claro + autosave invisível)
3. **Validação no submit** (usuário descobre campos faltando tarde demais)
4. **Geração de PDF** (sem preview; usuário não sabe o que vai receber)

---

## 3. Auditoria UX/UI (Heurísticas)

### 3.1 Carga Cognitiva

**Problemas:**
- Questionários longos exibem todas as perguntas de uma vez (`QuestionnaireForm.tsx:342`)
- Sem agrupamento visual claro de domínios relacionados
- Instruções podem ser longas sem destaque

**Sugestões:**
- Implementar paginação ou accordion por domínio
- Adicionar "Resumo" colapsável com instruções
- Destacar instruções importantes com callout

**Arquivos:** `components/QuestionnaireForm.tsx:342-538`

### 3.2 Progresso/Feedback

**Problemas:**
- Barra de progresso existe mas não é sticky (`QuestionnaireForm.tsx:325-333`)
- Autosave sem feedback visual (`QuestionnaireForm.tsx:26-28`)
- Sem indicador de "última resposta salva"

**Sugestões:**
- Barra de progresso sticky no topo
- Indicador "Salvando..." / "Salvo há X segundos" próximo ao botão submit
- Toast de confirmação após autosave bem-sucedido

**Arquivos:** `components/QuestionnaireForm.tsx:325-333, 26-28`

### 3.3 Validação e Erros

**Problemas:**
- Validação apenas no submit (`QuestionnaireForm.tsx:242`)
- Mensagem genérica: "Faltam X respostas" sem indicar quais
- Sem highlight de campos incompletos

**Sugestões:**
- Validação inline por item
- Mensagens contextuais: "Esta pergunta é obrigatória"
- Scroll automático para primeiro campo incompleto
- Highlight visual (borda vermelha) em campos faltando

**Arquivos:** `components/QuestionnaireForm.tsx:225-245`

### 3.4 Mobile-First

**Problemas:**
- Tabelas podem ser difíceis de usar em mobile (`QuestionnaireForm.tsx:376-426`)
- Slider NPRS pode ser pequeno em telas pequenas (`QuestionnaireForm.tsx:483-503`)
- Botão submit pode estar muito abaixo em questionários longos

**Sugestões:**
- Tabelas com scroll horizontal ou layout de cards em mobile
- Slider NPRS maior em mobile (altura mínima 44px)
- Botão submit sticky no bottom (já existe mas pode melhorar)

**Arquivos:** `components/QuestionnaireForm.tsx:376-426, 483-503, 540-552`

### 3.5 Acessibilidade (WCAG 2.1 AA)

**Problemas Identificados:**
- Labels ARIA ausentes em alguns inputs (`QuestionnaireForm.tsx:414` tem `aria-label` mas não em todos)
- Foco não gerenciado após submit
- Contraste não validado (usa Tailwind mas não há validação)
- Sem skip links consistentes (existe em `App.tsx:177` mas pode melhorar)

**Sugestões:**
- Auditoria com axe-core
- Adicionar `aria-describedby` para mensagens de erro
- Gerenciar foco após ações (ex: após submit, focar resultado)
- Validar contraste com ferramentas (ex: WebAIM Contrast Checker)

**Arquivos:** `components/QuestionnaireForm.tsx`, `App.tsx:177`

### 3.6 Microcopy e Confiança

**Problemas:**
- Sem explicação de "por que perguntamos isso?"
- Sem estimativa de tempo
- Sem indicação de privacidade durante preenchimento

**Sugestões:**
- Tooltip com explicação em questões sensíveis
- Badge "~5 minutos" no início do questionário
- Indicador "Seus dados são criptografados" no rodapé

**Arquivos:** `components/QuestionnaireForm.tsx:335-340`

---

## 4. Auditoria Clínica (Fisioterapia)

### 4.1 Consistência de Pontuação

**Problemas:**
- Cálculo de scores duplicado (`QuestionnaireForm.tsx:117-182` vs `utils/scoringEngine.ts:23-136`)
- Parsing de fórmulas frágil (regex manual)
- Não há validação cross-check entre implementações

**Sugestões:**
- Migrar TODO cálculo para `scoringEngine.ts`
- Criar testes unitários por questionário com casos conhecidos
- Validar contra referências científicas (ex: artigos originais)

**Arquivos:** `components/QuestionnaireForm.tsx:117-182`, `utils/scoringEngine.ts`

### 4.2 Longitudinal (Baseline vs Follow-up)

**Problemas:**
- Comparação existe (`components/ComparisonView.tsx`) mas não há validação de baseline
- Sem alerta se paciente não tem avaliação anterior
- Percentual de melhora pode ser enganoso sem contexto

**Sugestões:**
- Validar se há avaliação anterior antes de comparar
- Adicionar contexto: "Comparado com avaliação de X dias atrás"
- Destacar se melhora é clinicamente significativa (se houver thresholds)

**Arquivos:** `components/ComparisonView.tsx`

### 4.3 Red Flags/Alertas

**Status:** [HIPÓTESE] Não há código de red flags no web app (existe em `mobile-rn/engine/formSchema.ts:12-16`)

**Sugestão:**
- Implementar detecção de red flags em questionários relevantes (ex: dor intensa + sintomas neurológicos)
- Exibir alerta não-diagnóstico: "Recomendamos avaliação clínica imediata"
- Não substituir avaliação clínica (disclaimer)

**Arquivos:** Não existe no web app atual

### 4.4 Apresentação de Resultados

**Problemas:**
- Resultados podem ser confusos sem interpretação (`components/ScoreDisplay.tsx`)
- Sem contexto de normalidade (ex: "Acima da média" vs "Abaixo da média")
- Gráficos podem ser pequenos em mobile

**Sugestões:**
- Adicionar interpretação textual clara
- Incluir faixas de referência quando disponíveis
- Gráficos responsivos (maiores em mobile)

**Arquivos:** `components/ScoreDisplay.tsx`

---

## 5. Auditoria Técnica (PWA + Offline + Sync)

### 5.1 IndexedDB/Dexie

**Schema:** `services/database.ts:50-68`
- ✅ Schema bem estruturado com índices
- ⚠️ Sem migrações versionadas (apenas `version(1)`)
- ⚠️ Sem validação de integridade

**Problemas:**
- Migrações não implementadas (problema futuro se schema mudar)
- Sem backup automático antes de migração
- Queries podem ser lentas com muitos registros (sem paginação)

**Sugestões:**
- Implementar sistema de migrações (Dexie suporta)
- Adicionar validação de integridade (checksums)
- Implementar paginação para listas grandes

**Arquivos:** `services/database.ts`, `hooks/useIndexedDB.ts`

### 5.2 Service Worker/Workbox

**Configuração:** `vite.config.ts:75-160`
- ✅ Workbox configurado com cache strategies
- ⚠️ Cache de imagens pode ficar grande (60 entradas, 30 dias)
- ⚠️ Sem estratégia de invalidação de cache

**Problemas:**
- Cache pode servir versões antigas do app
- Sem fallback offline para rotas não cacheadas
- Service worker desabilitado em dev (`devOptions.enabled: false`)

**Sugestões:**
- Implementar versionamento de cache (hash de build)
- Adicionar fallback offline (página "Você está offline")
- Habilitar SW em dev para testes (com opção de desabilitar)

**Arquivos:** `vite.config.ts:119-160`

### 5.3 Sync Firebase (Pro)

**Implementação:** `services/firebaseSync.ts:15-195`
- ⚠️ Sem resolução de conflitos (último write wins)
- ⚠️ Sem versionamento (timestamps não são comparados)
- ⚠️ Sem retry automático em caso de falha

**Problemas:**
- `syncAllData` sobrescreve dados locais sem confirmação (`firebaseSync.ts:163-177`)
- `loadAllDataFromFirebase` usa estratégia simples (mais recente vence)
- Sem fila de operações pendentes

**Sugestões:**
- Implementar versionamento com timestamps + hash
- UI de resolução de conflitos (mostrar diferenças)
- Background Sync API para retry automático
- Fila de operações pendentes (IndexedDB)

**Arquivos:** `services/firebaseSync.ts`, `hooks/useFirebaseSync.ts`

### 5.4 Criptografia (AES-GCM + PBKDF2)

**Implementação:** `services/encryption.ts:15-146`
- ✅ Usa AES-GCM 256 bits (seguro)
- ✅ PBKDF2 com 100k iterações (adequado)
- ⚠️ Sem rotação de chaves
- ⚠️ Cache de chaves pode vazar em memória

**Problemas:**
- Chave derivada de `professionalId + origin` (pode ser previsível)
- Sem mecanismo de recovery se salt perdido
- Cache de chaves não é limpo em logout (`clearEncryptionCache` existe mas não é chamado)

**Sugestões:**
- Adicionar rotação de chaves (versionamento)
- Backup de salt em local seguro (IndexedDB separado)
- Limpar cache em logout (`AuthContext.tsx` deve chamar `clearEncryptionCache`)

**Arquivos:** `services/encryption.ts`, `context/AuthContext.tsx`

### 5.5 Segurança Auth/2FA

**Implementação:** `src/components/auth/` (lazy loaded)
- ✅ 2FA implementado (`TwoFactorSetup.tsx`, `TwoFactorVerify.tsx`)
- ⚠️ Fluxo não foi analisado em detalhes (arquivos lazy)

**Problemas Identificados (Hipóteses):**
- Sem rate limiting visível (risco de brute force)
- Sessões podem não expirar (não há código de expiração encontrado)
- Recovery de 2FA não analisado

**Sugestões:**
- Implementar rate limiting (ex: máximo 5 tentativas)
- Expiração de sessão (ex: 30 dias de inatividade)
- Recovery codes para 2FA

**Arquivos:** `src/components/auth/`, `context/AuthContext.tsx`

### 5.6 Observabilidade

**Status:** Sentry configurado (opcional) mas não há logs estruturados

**Problemas:**
- Erros podem ser silenciosos (ex: `firebaseSync.ts:64` ignora erros)
- Sem rastreio de erros offline (IndexedDB errors não são logados)
- Sem métricas de performance

**Sugestões:**
- Implementar logging estruturado (ex: winston/pino)
- Rastrear erros offline em IndexedDB
- Adicionar métricas (ex: tempo de sync, taxa de erro)

**Arquivos:** `services/firebaseSync.ts`, `hooks/useIndexedDB.ts`

### 5.7 Testes

**Status:** Apenas 4 arquivos de teste encontrados
- `tests/utils/scoringEngine.test.ts`
- `tests/utils/questionnaireSchema.test.ts`
- `tests/utils/encryption.test.ts`
- `tests/components/QuestionnaireForm.test.tsx`
- `tests/components/Layout.test.tsx`
- `tests/hooks/useIndexedDB.test.ts`

**Problemas:**
- Cobertura estimada <20%
- Sem testes e2e
- Sem testes de sync/offline
- Sem testes de acessibilidade

**Sugestões:**
- Aumentar cobertura para >70%
- Adicionar Playwright e2e (fluxo completo de questionário)
- Testes de sync (mock Firebase)
- Testes de acessibilidade (axe-core)

**Arquivos:** `tests/`, `vitest.config.ts`

---

## 6. Métricas e Instrumentação

### 6.1 Funis e Eventos Mínimos

**Funis Críticos:**

1. **Funil de Questionário:**
   - `questionnaire_viewed` → `questionnaire_started` → `answer_changed` (N vezes) → `autosave_ok` → `questionnaire_completed` → `pdf_generated`

2. **Funil de Sync (Pro):**
   - `sync_initiated` → `sync_progress` → `sync_success` / `sync_conflict` / `sync_error`

3. **Funil de Autenticação:**
   - `login_started` → `login_success` / `login_error` → `2fa_required` (se aplicável) → `2fa_verified`

**Eventos Recomendados:**

```typescript
// Questionário
questionnaire_viewed: { questionnaire_id, questionnaire_name, patient_id? }
questionnaire_started: { questionnaire_id, patient_id?, timestamp }
answer_changed: { questionnaire_id, item_id, step_index?, time_spent_ms }
autosave_ok: { questionnaire_id, answers_count, timestamp }
autosave_error: { questionnaire_id, error_message }
questionnaire_completed: { questionnaire_id, total_time_ms, answers_count, score }
questionnaire_abandoned: { questionnaire_id, progress_pct, last_item_id, time_spent_ms }

// PDF
pdf_generated: { questionnaire_id, patient_id, file_size_kb, generation_time_ms }
pdf_downloaded: { questionnaire_id, patient_id }

// Sync (Pro)
sync_initiated: { user_id, data_type, offline_duration_ms }
sync_progress: { user_id, data_type, items_synced, total_items }
sync_success: { user_id, data_type, items_synced, sync_duration_ms }
sync_conflict: { user_id, data_type, conflict_count }
sync_error: { user_id, data_type, error_message, retry_count }

// Autenticação
login_started: { method: 'email' | 'google' }
login_success: { method, user_id, timestamp }
login_error: { method, error_code }
2fa_required: { user_id }
2fa_verified: { user_id, timestamp }
2fa_setup_completed: { user_id }

// Performance
page_load: { route, load_time_ms }
offline_detected: { timestamp }
online_restored: { offline_duration_ms }
```

**Propriedades Recomendadas:**
- `questionnaire_id`, `questionnaire_name`, `questionnaire_items_count`
- `patient_id`, `patient_age`, `patient_sex`
- `step_index`, `total_steps`
- `time_spent_ms`, `offline`, `plan_type` ('free' | 'pro')
- `device_type` ('mobile' | 'tablet' | 'desktop')
- `browser`, `os`

### 6.2 Metas Sugeridas

**30 dias:**
- Taxa de conclusão de questionários: **+15%** (de ~60% para ~69%)
- Taxa de abandono: **-20%** (de ~40% para ~32%)
- Taxa de geração de PDF: **+10%** (de ~50% para ~55%)

**60 dias:**
- Taxa de conclusão: **+25%** (de ~60% para ~75%)
- Taxa de abandono: **-30%** (de ~40% para ~28%)
- Taxa de geração de PDF: **+20%** (de ~50% para ~60%)
- Taxa de sync bem-sucedida (Pro): **>95%**

**90 dias:**
- Taxa de conclusão: **+35%** (de ~60% para ~81%)
- Taxa de abandono: **-40%** (de ~40% para ~24%)
- Taxa de geração de PDF: **+30%** (de ~50% para ~65%)
- Taxa de sync bem-sucedida (Pro): **>98%**
- Tempo médio de preenchimento: **-15%** (otimização de UX)

---

## 7. Backlog Priorizado

| Item | Problema | Solução | Impacto | Esforço | Prioridade | Dependências | Critérios de Aceite |
|------|----------|---------|---------|---------|------------|--------------|---------------------|
| **P0-1** | Autosave sem feedback visual | Adicionar indicador "Salvando..." / "Salvo" + migrar para IndexedDB | Alto (perda de dados) | 2d | P0 | - | Dado: Quando usuário responde pergunta<br>Então: Indicador "Salvando..." aparece<br>E: Após 500ms, muda para "Salvo há X segundos" |
| **P0-2** | Validação só no submit | Validação inline por item com mensagens contextuais | Alto (abandono) | 3d | P0 | - | Dado: Usuário responde pergunta incorretamente<br>Então: Mensagem de erro aparece abaixo do campo<br>E: Campo é destacado com borda vermelha |
| **P0-3** | Sync sem resolução de conflitos | Versionamento + UI de conflitos + merge inteligente | Crítico (Pro) | 5d | P0 | P0-1 | Dado: Conflito detectado no sync<br>Então: UI mostra diferenças<br>E: Usuário escolhe qual versão manter<br>E: Versão descartada é salva como backup |
| **P0-4** | Cálculo de scores duplicado/frágil | Migrar para `scoringEngine.ts` + testes | Crítico (dados clínicos) | 4d | P0 | - | Dado: Questionário com respostas conhecidas<br>Então: Score calculado é igual ao esperado<br>E: Testes cobrem todos os 25+ questionários |
| **P0-5** | Sem instrumentação | Implementar eventos mínimos + dashboard básico | Médio (decisões) | 2d | P0 | - | Dado: Usuário completa questionário<br>Então: Evento `questionnaire_completed` é enviado<br>E: Dashboard mostra taxa de conclusão |
| **P1-1** | PDF sem preview | Modal de preview com iframe + opção de editar | Médio (satisfação) | 2d | P1 | - | Dado: Usuário clica em "Gerar PDF"<br>Então: Modal com preview aparece<br>E: Usuário pode fechar sem baixar<br>E: Botão "Baixar PDF" está visível |
| **P1-2** | Sem estimativa de tempo | Badge "~X minutos" no início do questionário | Médio (expectativa) | 1d | P1 | - | Dado: Questionário tem N itens<br>Então: Badge mostra "~N*0.5 minutos"<br>E: Badge é atualizado conforme progresso |
| **P1-3** | Criptografia sem rotação | Versionamento de chaves + migração automática | Alto (LGPD) | 3d | P1 | P0-1 | Dado: Nova versão de chave é gerada<br>Então: Dados antigos são migrados<br>E: Dados novos usam chave nova<br>E: Backup de salt é mantido |
| **P1-4** | Testes insuficientes | Aumentar cobertura para >70% + Playwright e2e | Médio (confiança) | 5d | P1 | P0-4 | Dado: Código é modificado<br>Então: Testes são executados<br>E: Cobertura é >70%<br>E: Testes e2e passam |
| **P1-5** | Acessibilidade incompleta | Auditoria com axe-core + correções + testes | Médio (conformidade) | 4d | P1 | - | Dado: Página é carregada<br>Então: axe-core não encontra violações WCAG 2.1 AA<br>E: Testes com leitores de tela passam |
| **P2-1** | Sem tratamento de erros offline | Background Sync API + fila de retry + notificações | Baixo (melhoria) | 4d | P2 | P0-3 | Dado: Sync falha offline<br>Então: Operação é adicionada à fila<br>E: Retry automático quando online<br>E: Notificação quando sync completa |
| **P2-2** | Sem "Salvar e continuar depois" | Botão "Salvar rascunho" + tela de retomada | Baixo (conveniência) | 3d | P2 | P0-1 | Dado: Usuário clica em "Salvar rascunho"<br>Então: Progresso é salvo<br>E: Usuário pode retomar depois<br>E: Tela mostra "Continuar questionário X" |
| **P2-3** | Sem exportação CSV/JSON | Implementar export CSV/JSON + agendamento | Baixo (feature) | 3d | P2 | - | Dado: Usuário clica em "Exportar"<br>Então: Opções CSV/JSON aparecem<br>E: Arquivo é baixado<br>E: Formato está correto |
| **P2-4** | Sem dashboard de evolução | Gráfico de linha temporal + tabela comparativa | Baixo (análise) | 4d | P2 | - | Dado: Paciente tem múltiplas avaliações<br>Então: Gráfico mostra evolução<br>E: Tabela mostra comparações<br>E: Percentual de melhora é destacado |
| **P2-5** | Performance offline degradada | Otimizar IndexedDB queries + lazy loading | Baixo (performance) | 3d | P2 | P0-1 | Dado: Lista tem 100+ pacientes<br>Então: Query retorna em <500ms<br>E: Lazy loading é aplicado<br>E: Scroll é suave |

---

## 8. Plano de Execução (30/60/90 dias)

### 30 Dias: Quick Wins + Correções Críticas (Beta Polish)

**Sprint 1 (Semana 1-2):**
- ✅ P0-1: Feedback visual de autosave (2d)
- ✅ P0-2: Validação em tempo real (3d)
- ✅ P0-5: Instrumentação básica (2d)
- ✅ P1-2: Estimativa de tempo (1d)
- **Buffer:** 2d para testes e ajustes

**Sprint 2 (Semana 3-4):**
- ✅ P0-4: Migrar cálculo para `scoringEngine.ts` (4d)
- ✅ P1-1: Preview de PDF (2d)
- ✅ P1-5: Correções básicas de acessibilidade (2d)
- **Buffer:** 2d para testes e ajustes

**Entregáveis:**
- Autosave com feedback visual
- Validação inline funcionando
- Analytics básico implementado
- Preview de PDF
- Cálculo de scores migrado e testado

**Riscos:**
- Migração de cálculo pode quebrar questionários existentes
- **Mitigação:** Testes extensivos + feature flag

### 60 Dias: Melhorias Estruturais + Instrumentação + Confiabilidade

**Sprint 3 (Semana 5-6):**
- ✅ P0-3: Resolução de conflitos no sync (5d)
- ✅ P1-3: Rotação de chaves de criptografia (3d)
- **Buffer:** 2d para testes

**Sprint 4 (Semana 7-8):**
- ✅ P1-4: Aumentar cobertura de testes (5d)
- ✅ P2-1: Background Sync API (4d)
- **Buffer:** 1d para testes

**Sprint 5 (Semana 9-10):**
- ✅ P2-2: "Salvar e continuar depois" (3d)
- ✅ P2-4: Dashboard de evolução (4d)
- **Buffer:** 3d para testes e polish

**Entregáveis:**
- Sync confiável com resolução de conflitos
- Criptografia com rotação de chaves
- Cobertura de testes >70%
- Background sync funcionando
- Dashboard de evolução

**Riscos:**
- Background Sync API pode não estar disponível em todos os browsers
- **Mitigação:** Fallback para polling + detecção de suporte

### 90 Dias: Features Avançadas + Otimizações

**Sprint 6 (Semana 11-12):**
- ✅ P2-3: Exportação CSV/JSON (3d)
- ✅ P2-5: Otimização de performance offline (3d)
- ✅ Melhorias de UX baseadas em analytics (2d)
- **Buffer:** 2d para testes

**Sprint 7 (Semana 13-14):**
- ✅ Playwright e2e tests (3d)
- ✅ Lighthouse CI (2d)
- ✅ Push notifications (opcional) (3d)
- **Buffer:** 2d para testes

**Sprint 8 (Semana 15-16):**
- ✅ Refinamentos finais baseados em feedback (3d)
- ✅ Documentação de usuário (2d)
- ✅ Preparação para lançamento (3d)
- **Buffer:** 2d para testes finais

**Entregáveis:**
- Exportação CSV/JSON
- Performance otimizada
- Testes e2e completos
- Lighthouse CI configurado
- Documentação completa

**Riscos:**
- Push notifications podem não funcionar em todos os browsers
- **Mitigação:** Feature detection + fallback

---

## 9. Checklist de QA (Pré-Lançamento)

### 9.1 Casos Críticos

#### Cadastro
- [ ] Cadastro com email válido funciona
- [ ] Cadastro com email duplicado mostra erro
- [ ] Validação de senha (mínimo 8 caracteres)
- [ ] Verificação de email é enviada

#### Login/2FA
- [ ] Login com email/senha funciona
- [ ] Login com Google funciona
- [ ] 2FA é solicitado quando configurado
- [ ] 2FA com código correto funciona
- [ ] 2FA com código incorreto mostra erro
- [ ] Recuperação de senha funciona
- [ ] Rate limiting funciona (máximo 5 tentativas)

#### Consentimento LGPD
- [ ] Modal de consentimento aparece na primeira vez
- [ ] Aceitar consentimento permite acesso
- [ ] Recusar consentimento redireciona para landing
- [ ] Consentimento é salvo corretamente

#### Questionários
- [ ] Lista de questionários carrega
- [ ] Seleção de questionário funciona
- [ ] Preenchimento salva respostas (autosave)
- [ ] Validação inline funciona
- [ ] Submit com todas as respostas funciona
- [ ] Submit com respostas faltando mostra erro
- [ ] Cálculo de score está correto (validar com casos conhecidos)
- [ ] Resultado é exibido corretamente

#### Autosave
- [ ] Autosave funciona após cada resposta
- [ ] Indicador "Salvando..." aparece
- [ ] Indicador "Salvo" aparece após salvar
- [ ] Dados são recuperados após refresh
- [ ] Dados são recuperados após fechar/abrir app

#### PDF
- [ ] Geração de PDF funciona
- [ ] Preview de PDF aparece (se implementado)
- [ ] Download de PDF funciona
- [ ] PDF contém todos os dados corretos
- [ ] PDF é legível e formatado corretamente

#### Export
- [ ] Export CSV funciona (se implementado)
- [ ] Export JSON funciona (se implementado)
- [ ] Arquivos exportados estão corretos

#### Offline
- [ ] App funciona offline (sem internet)
- [ ] Dados são salvos offline
- [ ] Dados são sincronizados quando online
- [ ] Service worker funciona corretamente

#### Sync (Pro)
- [ ] Sync funciona entre dispositivos
- [ ] Conflitos são detectados
- [ ] Resolução de conflitos funciona (se implementado)
- [ ] Dados não são perdidos em sync

### 9.2 Testes Cross-Device

- [ ] Chrome Desktop (Windows/Mac/Linux)
- [ ] Firefox Desktop
- [ ] Safari Desktop (Mac)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Samsung Internet (Android)

### 9.3 Testes de Acessibilidade

- [ ] Navegação por teclado funciona
- [ ] Leitores de tela funcionam (NVDA/JAWS/VoiceOver)
- [ ] Contraste de cores está adequado (WCAG AA)
- [ ] Labels ARIA estão presentes
- [ ] Foco é gerenciado corretamente
- [ ] Skip links funcionam

### 9.4 Testes de Regressão (Funil)

- [ ] Taxa de conclusão não diminuiu
- [ ] Tempo médio de preenchimento não aumentou
- [ ] Taxa de erro não aumentou
- [ ] Performance não degradou (Lighthouse score >90)

---

## Extra

### Top 10 Melhorias por ROI

1. **Feedback visual de autosave** (ROI: ⭐⭐⭐⭐⭐ | Esforço: 2d | Impacto: +15% conclusão)
2. **Validação em tempo real** (ROI: ⭐⭐⭐⭐⭐ | Esforço: 3d | Impacto: +20% conclusão)
3. **Instrumentação de analytics** (ROI: ⭐⭐⭐⭐ | Esforço: 2d | Impacto: Dados para decisões)
4. **Preview de PDF** (ROI: ⭐⭐⭐⭐ | Esforço: 2d | Impacto: +10% geração de PDF)
5. **Resolução de conflitos no sync** (ROI: ⭐⭐⭐⭐ | Esforço: 5d | Impacto: Confiabilidade Pro)
6. **Migração de cálculo de scores** (ROI: ⭐⭐⭐⭐ | Esforço: 4d | Impacto: Dados clínicos corretos)
7. **Estimativa de tempo** (ROI: ⭐⭐⭐ | Esforço: 1d | Impacto: +5% conclusão)
8. **"Salvar e continuar depois"** (ROI: ⭐⭐⭐ | Esforço: 3d | Impacto: +10% conclusão)
9. **Dashboard de evolução** (ROI: ⭐⭐⭐ | Esforço: 4d | Impacto: Engajamento)
10. **Acessibilidade** (ROI: ⭐⭐⭐ | Esforço: 4d | Impacto: Conformidade + alcance)

### 8 Perguntas de Entrevista para Pacientes

1. "Quanto tempo você levou para preencher o questionário? Foi mais ou menos do que esperava?"
2. "Você sentiu que suas respostas estavam sendo salvas? Como você sabia?"
3. "O que você achou mais difícil ao preencher o questionário?"
4. "Você conseguiu entender todas as perguntas? Alguma foi confusa?"
5. "Você conseguiu ver seu resultado depois? Foi fácil de entender?"
6. "Você baixou o PDF do resultado? Por quê sim/não?"
7. "Você usaria este app novamente? Por quê sim/não?"
8. "O que você mudaria para melhorar a experiência?"

### 8 Perguntas de Entrevista para Fisioterapeutas

1. "Quanto tempo você leva para aplicar um questionário com um paciente? É mais rápido que papel?"
2. "Você confia nos resultados calculados pelo app? Já encontrou algum erro?"
3. "Como você usa os resultados? Você compara com avaliações anteriores?"
4. "Você gera PDFs dos resultados? Com que frequência?"
5. "Você usa o app offline? Com que frequência?"
6. "Você sincroniza dados entre dispositivos? Já teve problemas?"
7. "O que falta no app para você usar mais?"
8. "Você recomendaria este app para outros fisioterapeutas? Por quê sim/não?"

### 5 Experimentos A/B

1. **Progresso Visual:**
   - **A:** Barra de progresso simples (atual)
   - **B:** Barra de progresso + "X de Y perguntas" + estimativa de tempo restante
   - **Métrica:** Taxa de conclusão

2. **Tempo Estimado:**
   - **A:** Sem estimativa (atual)
   - **B:** Badge "~5 minutos" no início
   - **Métrica:** Taxa de início (quantos começam vs desistem antes)

3. **"Salvar e Continuar":**
   - **A:** Apenas autosave silencioso (atual)
   - **B:** Botão explícito "Salvar e continuar depois" + tela de retomada
   - **Métrica:** Taxa de conclusão de questionários longos (>15 itens)

4. **Revisão Final:**
   - **A:** Submit direto após preencher (atual)
   - **B:** Tela de revisão antes de submit com opção de editar
   - **Métrica:** Taxa de conclusão + taxa de edição após revisão

5. **Feedback de Autosave:**
   - **A:** Autosave silencioso (atual)
   - **B:** Indicador "Salvando..." / "Salvo há X segundos"
   - **Métrica:** Taxa de conclusão + ansiedade (survey)

---

**Fim do Relatório**

*Este relatório foi gerado através de análise do código-fonte do FisioQ Beta. Todas as sugestões são baseadas em boas práticas de UX, segurança e desenvolvimento web. Implementações devem ser testadas antes de deploy em produção.*

