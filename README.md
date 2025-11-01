# FisioQ Beta - Questionários Clínicos para Fisioterapeutas

[![CI](https://github.com/seu-usuario/fisioq/actions/workflows/ci.yml/badge.svg)](https://github.com/seu-usuario/fisioq/actions/workflows/ci.yml)

Gerencie pacientes, aplique questionários validados e acompanhe a evolução do tratamento de forma profissional e eficiente.

## 🚀 Funcionalidades

- ✅ **Gerenciamento de Pacientes**: Cadastre e gerencie pacientes
- ✅ **Questionários Clínicos Validados**: Mais de 25 questionários cientificamente validados
- ✅ **Relatórios Detalhados**: Gere relatórios com gráficos e comparações temporais
- ✅ **PWA**: Instalável e funciona offline
- ✅ **LGPD Compliant**: Dados criptografados e conformidade com LGPD
- ✅ **Multi-idioma**: Português (pt-BR) e Inglês (en)

## 🛠️ Tecnologias

- **React 19** + **TypeScript**
- **Vite** - Build tool ultra-rápido
- **React Router v7** - Roteamento
- **Tailwind CSS** - Estilização
- **IndexedDB (Dexie)** - Armazenamento local
- **i18next** - Internacionalização
- **VitePWA** - PWA support
- **Sentry** - Error tracking (opcional)
- **Plausible** - Analytics privacy-first (opcional)

## 📋 Pré-requisitos

- **Node.js** ≥ 20
- **npm** ≥ 9

## 🚀 Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/fisioq.git
cd fisioq

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes com UI
npm run test:ui

# Executar testes com cobertura
npm run test:coverage
```

## 🚀 Deploy Rápido

### Opção 1: Vercel (Recomendado) ⭐
1. Acesse: https://vercel.com
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Selecione seu repositório
5. Configure:
   - Framework: **Vite**
   - Build: `npm run build`
   - Output: `dist`
6. Clique em "Deploy"
7. ✅ Pronto! Seu site estará online em minutos

**Ou use CLI:**
```bash
npm i -g vercel
vercel
```

### Opção 2: Netlify (Ótimo para PWA)
1. Acesse: https://netlify.com
2. Faça login com GitHub
3. "Add new site" > "Import an existing project"
4. Selecione repositório
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy! ✅

### Opção 3: GitHub Pages (Gratuito)
1. No GitHub: Settings > Pages
2. Selecione branch `main`
3. Deploy via Actions (automatizado pelo workflow)

**📖 Guia completo:** Ver `docs/DEPLOYMENT.md`

---

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Lint do código
npm run lint:fix      # Corrigir problemas de lint
npm run format       # Formatar código
npm run format:check  # Verificar formatação
npm run test         # Executar testes
npm run test:ui      # Testes com UI
npm run test:coverage # Testes com cobertura
```

## 🔒 Segurança

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Opcional - Sentry (Error Tracking)
VITE_ENABLE_SENTRY=false
VITE_SENTRY_DSN=your_sentry_dsn

# Opcional - Plausible (Analytics)
VITE_PLAUSIBLE_DOMAIN=your-domain.com

# Opcional - Gemini API (se usado)
GEMINI_API_KEY=your_gemini_api_key
```

### LGPD e Privacidade

- **Dados Criptografados**: AES-GCM (256 bits) com PBKDF2
- **Consentimento Obrigatório**: LGPD compliant
- **Isolamento por Profissional**: Dados separados por profissional
- **Documentação**: Ver `docs/LGPD_DATA_FLOW.md`

## 📚 Documentação

- **[Arquitetura](docs/ARCHITECTURE.md)** - Arquitetura do sistema
- **[LGPD Data Flow](docs/LGPD_DATA_FLOW.md)** - Fluxo de dados LGPD
- **[Segurança](docs/SECURITY.md)** - Segurança e vulnerabilidades
- **[PWA](docs/PWA.md)** - Progressive Web App
- **[Hardening Progress](docs/HARDENING_PROGRESS.md)** - Progresso de melhorias

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feat/nova-feature`)
5. Abra um Pull Request

### Padrões de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova feature
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas de manutenção

## 📄 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- Seu Nome - [@seu-usuario](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- Todos os desenvolvedores e contribuidores
- Comunidade React e Vite
- Desenvolvedores dos questionários clínicos validados

## 📊 Status do Projeto

- **Versão**: Beta
- **Status**: Em desenvolvimento ativo
- **Progresso**: ~70% completo

## 🐛 Problemas Conhecidos

- 12 vulnerabilidades npm detectadas (11 moderate, 1 high) - ver `docs/SECURITY.md`
- Bundle size pode ser otimizado ainda mais

## 🔜 Próximas Features

- [ ] Background sync para sincronização offline
- [ ] Push notifications
- [ ] Export CSV/JSON
- [ ] Share links cifrados
- [ ] Testes e2e (Playwright)
- [ ] Lighthouse CI

## 📞 Suporte

Para suporte, abra uma [issue](https://github.com/seu-usuario/fisioq/issues) ou envie um email para [seu-email@exemplo.com](mailto:seu-email@exemplo.com).

---

Feito com ❤️ para fisioterapeutas
