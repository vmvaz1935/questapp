# Guia de Setup Git e Pull Request

## ⚠️ Configuração Inicial Necessária

Antes de fazer commits, você precisa configurar sua identidade no Git:

### Windows (PowerShell)
```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

### Linux/Mac (Bash)
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

## ✅ Passos Executados Automaticamente

### 1. Inicialização do Git ✅
```bash
git init
```

### 2. Criação da Branch ✅
```bash
git checkout -b feat/hardening-ux-lgpd
```

### 3. Arquivos Preparados ✅
- ✅ `.gitignore` criado
- ✅ 158 arquivos prontos para commit

## 📋 Próximos Passos (Você precisa executar)

### 1. Configurar Git (SE AINDA NÃO FEZ)

**Windows (PowerShell)**:
```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"
```

**Ou usar o script**:
```powershell
.\scripts\setup-git.ps1
```

### 2. Fazer o Commit

Depois de configurar o Git, execute:

```bash
git add .
git commit -m "feat: implementar hardening UX/LGPD - melhorias críticas de segurança, performance e acessibilidade" -m "- Build: remover CDNs, configurar dependências locais via Vite" -m "- Segurança: CSP, IndexedDB com criptografia AES-GCM, LGPD completo" -m "- Arquitetura: React Router, code splitting, rotas protegidas" -m "- Qualidade: ESLint, Prettier, Vitest, Zod, testes (83% passando)" -m "- PWA: manifest, service worker, cache strategies" -m "- A11y: WCAG 2.1 AA, skip link, ARIA, navegação por teclado" -m "- Observabilidade: Sentry, Plausible (opt-in)" -m "- Export: CSV, JSON, PDF" -m "- CI/CD: GitHub Actions" -m "- Documentação: completa (ARCHITECTURE, LGPD, SECURITY, PWA, etc.)"
```

### 3. Adicionar Remote (se necessário)

Se você tiver um repositório remoto:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git remote -v  # Verificar
```

### 4. Push da Branch

```bash
git push -u origin feat/hardening-ux-lgpd
```

### 5. Criar Pull Request

#### Via GitHub Web Interface:
1. Navegar para o repositório no GitHub
2. Clicar em "New Pull Request" ou "Compare & Pull Request"
3. Selecionar branch base: `main` ou `master`
4. Selecionar branch: `feat/hardening-ux-lgpd`
5. Copiar conteúdo de `PR_TEMPLATE.md` para descrição do PR
6. Adicionar labels: `enhancement`, `security`, `performance`, `accessibility`
7. Solicitar review

#### Via GitHub CLI (se instalado):
```bash
gh pr create --title "feat: implementar hardening UX/LGPD" --body-file PR_TEMPLATE.md --base main --head feat/hardening-ux-lgpd
```

## 📝 Arquivos Criados para PR

- ✅ `PR_TEMPLATE.md` - Template do Pull Request
- ✅ `docs/PR_CHECKLIST.md` - Checklist para review
- ✅ `docs/GIT_SETUP.md` - Este arquivo
- ✅ `.gitignore` - Configuração de arquivos ignorados

## 🔗 Referências

- Ver `docs/COMPLETION_REPORT.md` para relatório completo
- Ver `CHANGELOG.md` para histórico de mudanças
- Ver `docs/BUNDLE_ANALYSIS.md` para análise de bundle

## 📊 Status Atual

- ✅ Git inicializado
- ✅ Branch criada (`feat/hardening-ux-lgpd`)
- ✅ Arquivos preparados para commit (158 arquivos)
- ⚠️ **Aguardando configuração do usuário Git**
- ⏳ Aguardando commit (você precisa executar)
- ⏳ Aguardando push e criação de PR

## 🚀 Comandos Úteis

### Ver status
```bash
git status
git status --short
```

### Ver branch atual
```bash
git branch
git branch -a
```

### Ver commits
```bash
git log --oneline --graph -10
```

### Configurar usuário (LOCAL - apenas este repo)
```bash
git config user.name "Seu Nome"
git config user.email "seu.email@exemplo.com"
```

### Scripts Auxiliares

**Windows**:
```powershell
.\scripts\setup-git.ps1
```

**Linux/Mac**:
```bash
chmod +x scripts/setup-git.sh
./scripts/setup-git.sh
```

## ⚡ Comando Rápido de Commit

Após configurar o Git, você pode usar este comando:

```bash
git add . && git commit -m "feat: implementar hardening UX/LGPD - melhorias críticas" -m "Build: remover CDNs, dependências locais" -m "Segurança: CSP, IndexedDB, criptografia AES-GCM, LGPD" -m "Arquitetura: React Router, code splitting" -m "Qualidade: ESLint, Prettier, Vitest, testes" -m "PWA: manifest, service worker" -m "A11y: WCAG 2.1 AA" -m "Documentação completa"
```
