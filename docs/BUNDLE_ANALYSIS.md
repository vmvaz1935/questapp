# Análise de Bundle - FisioQ

## Status Atual (2025-10-31)

### Tamanho do Bundle

| Asset | Tamanho | Gzip | Status |
|-------|---------|------|--------|
| CSS Principal | 30.17 KB | 5.58 KB | ✅ Otimizado |
| JS Principal | 424.20 KB | 140.70 KB | ⚠️ Pode melhorar |
| Total (gzip) | ~141 KB | - | ✅ Aceitável |

### Code Splitting

Rotas carregadas sob demanda:
- **LandingPage**: 6.08 KB (gzip: 1.97 KB) ✅
- **Login**: 8.28 KB (gzip: 3.26 KB) ✅
- **ProfessionalView**: 15.16 KB (gzip: 4.19 KB) ✅
- **ReportView**: 25.31 KB (gzip: 8.99 KB) ✅
- **QuestionnairesView**: 31.48 KB (gzip: 8.10 KB) ✅

### Dependências Críticas

#### Grandes (>50KB)
- **jsPDF**: 358.17 KB (gzip: 118.09 KB)
  - **Uso**: Geração de PDFs
  - **Otimização**: Carregamento dinâmico ✅
  - **Alternativa**: Considerar biblioteca mais leve se necessário

- **html2canvas**: 202.38 KB (gzip: 48.04 KB)
  - **Uso**: Conversão de HTML para imagem (PDFs)
  - **Otimização**: Carregamento dinâmico ✅
  - **Alternativa**: Considerar remover se não essencial

#### Médias (10-50KB)
- **React Router**: ~15-25KB
  - **Necessário**: ✅ Essencial para navegação
- **Dexie (IndexedDB)**: ~10-15KB
  - **Necessário**: ✅ Essencial para LGPD
- **i18next**: ~10-15KB
  - **Necessário**: ✅ Essencial para i18n

#### Pequenas (<10KB)
- **Zod**: ~5KB ✅
- **React hooks**: Incluído no React ✅

### Dependências Removidas

✅ **@sentry/browser** - Removido (apenas @sentry/react necessário)

### Dependências Opcionais

#### Firebase
- **Status**: Opcional (aplicação funciona sem ele)
- **Tamanho**: ~100KB quando importado
- **Otimização**: Carregamento dinâmico ✅
- **Recomendação**: Manter opcional

#### Sentry
- **Status**: Opt-in via env var
- **Tamanho**: ~50KB quando importado
- **Otimização**: Carregamento dinâmico ✅
- **Recomendação**: Manter opt-in

#### Plausible
- **Status**: Opt-in via env var
- **Tamanho**: ~5KB quando importado
- **Otimização**: Script externo ✅
- **Recomendação**: Manter opt-in

## Otimizações Implementadas

### ✅ Code Splitting
- React.lazy para rotas
- Suspense para loading states
- Bundle reduzido significativamente

### ✅ Tree Shaking
- Vite configuração otimizada
- Imports ESModule
- Dependências não usadas removidas automaticamente

### ✅ Dynamic Imports
- jsPDF carregado dinamicamente
- Firebase carregado dinamicamente
- Sentry carregado dinamicamente

### ✅ CSS Purge
- Tailwind purge configurado
- CSS reduzido de 56KB → 30KB (-46%)

## Oportunidades de Otimização

### 1. Bundle Principal (424KB)

**Análise**:
- jsPDF e html2canvas são grandes
- Podem ser carregados apenas quando necessário

**Ação**:
- ✅ Já implementado: Carregamento dinâmico de jsPDF
- ⚠️ Verificar: html2canvas pode ser removido se não usado

### 2. Dependências Não Usadas

**Análise depcheck**:
- ✅ @sentry/browser removido (não necessário)
- ⚠️ virtual:pwa-register (dependência virtual do VitePWA - OK)

**Ações**:
- ✅ Removido @sentry/browser
- ✅ Todas as dependências principais estão em uso

### 3. Imports Não Usados

**Verificação**:
- Revisar imports em componentes
- Remover imports não utilizados
- Consolidar imports quando possível

## Métricas de Meta

### Atual
- **JS Inicial**: 424KB (gzip: 141KB)
- **CSS**: 30KB (gzip: 6KB)
- **Total**: ~147KB gzipped

### Meta
- **JS Inicial**: ≤250KB (gzip: ≤100KB)
- **CSS**: ≤30KB (gzip: ≤10KB) ✅
- **Total**: ≤110KB gzipped

### Gap
- **JS**: +174KB não gzipped, +41KB gzipped
- **Causa**: jsPDF + html2canvas + Sentry (quando incluído)

### Estratégia
1. **jsPDF/html2canvas**: Já carregados dinamicamente ✅
2. **Sentry**: Já opt-in ✅
3. **PWA**: Service Worker separado (não afeta bundle inicial) ✅

## Recomendações

### Curto Prazo
1. ✅ **Remover @sentry/browser** - Feito
2. ⚠️ **Verificar html2canvas**: Confirmar se é necessário
3. ✅ **Manter code splitting**: Funcionando bem

### Médio Prazo
1. **Analisar uso de html2canvas**: Se não usado para todos os PDFs, considerar alternativa
2. **Otimizar imports**: Consolidar imports comuns
3. **Bundle analyzer**: Instalar e analisar bundle em detalhes

### Longo Prazo
1. **Alternativas a jsPDF**: Considerar bibliotecas mais leves se necessário
2. **Micro-frontends**: Se aplicação crescer, considerar arquitetura modular
3. **Server-side rendering**: Se necessário para SEO/performance

## Análise de Dependências

### Core (Essenciais)
- ✅ react, react-dom - Essencial
- ✅ react-router-dom - Essencial para navegação
- ✅ dexie, dexie-react-hooks - Essencial para LGPD
- ✅ i18next, react-i18next - Essencial para i18n
- ✅ zod - Essencial para validação
- ✅ tailwindcss - Essencial para estilização

### Funcionalidades (Importantes)
- ⚠️ jspdf - Importante, mas pode ser otimizado (carregamento dinâmico ✅)
- ⚠️ html2canvas - Importante para PDFs, mas grande

### Opcionais (Opt-in)
- ⚠️ firebase - Opcional (sincronização na nuvem)
- ⚠️ @sentry/react - Opcional (error tracking)
- ⚠️ @google/genai - Opcional (AI features futuras?)

### DevDependencies
- ✅ Todas essenciais para desenvolvimento

## Conclusão

### Status
- ✅ **Code Splitting**: Implementado e funcionando
- ✅ **Tree Shaking**: Configurado corretamente
- ✅ **Dynamic Imports**: Implementado para libs grandes
- ✅ **CSS Purge**: Funcionando (46% de redução)
- ⚠️ **Bundle Size**: Acima da meta, mas aceitável (147KB gzipped)

### Próximos Passos
1. Verificar uso de html2canvas
2. Considerar alternativas mais leves se necessário
3. Monitorar bundle size em cada release
4. Implementar bundle analyzer no CI/CD

## Ferramentas Recomendadas

- **vite-bundle-visualizer**: Análise visual do bundle
- **source-map-explorer**: Análise detalhada do bundle
- **webpack-bundle-analyzer**: Se migrar para Webpack (não necessário agora)

