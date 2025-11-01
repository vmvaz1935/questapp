# Guia de Deploy - FisioQ

## 🚀 Opções de Hospedagem

### Opções Gratuitas (Recomendadas para Começar)

#### 1. **Vercel** ⭐ (Recomendado)
- ✅ **Melhor para React/Vite**
- ✅ Deploy automático via GitHub
- ✅ CDN global
- ✅ HTTPS automático
- ✅ Custom domains grátis
- ✅ Deploys instantâneos

**Como fazer:**
1. Acesse: https://vercel.com
2. Conecte seu repositório GitHub
3. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Adicione variáveis de ambiente (se necessário)
5. Deploy automático! 🎉

**Comandos:**
```bash
npm i -g vercel
vercel
```

---

#### 2. **Netlify** ⭐ (Excelente para PWA)
- ✅ Suporte PWA completo
- ✅ Deploy automático via GitHub
- ✅ Formulários e Functions
- ✅ Custom domains grátis
- ✅ SSL automático

**Como fazer:**
1. Acesse: https://www.netlify.com
2. Conecte seu repositório GitHub
3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Deploy! 🎉

**Comandos:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

---

#### 3. **GitHub Pages** (Gratuito, mas limitado)
- ✅ Totalmente gratuito
- ✅ Integrado ao GitHub
- ⚠️ Apenas sites estáticos
- ⚠️ Requer configuração adicional para SPA

**Como fazer:**
1. No GitHub, vá em **Settings** > **Pages**
2. Selecione branch: `main` ou `gh-pages`
3. Selecione pasta: `/root` ou `/docs`
4. Configure Actions para build automático

**GitHub Actions Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

#### 4. **Cloudflare Pages** (Rápido e gratuito)
- ✅ CDN global
- ✅ Build automático
- ✅ Custom domains grátis
- ✅ SSL automático

**Como fazer:**
1. Acesse: https://pages.cloudflare.com
2. Conecte repositório GitHub
3. Configure:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Deploy! 🎉

---

### Opções Pagas (Para Produção)

#### 5. **AWS Amplify**
- ✅ Integração completa AWS
- ✅ CI/CD integrado
- ✅ Suporte a backend
- 💰 Pago (mas tem tier gratuito)

#### 6. **Google Cloud Run** ou **Firebase Hosting**
- ✅ Escalável
- ✅ Integração com Firebase
- 💰 Pago (mas tem tier gratuito)

---

## 📋 Passos para Deploy (Vercel - Recomendado)

### 1. Preparar o Repositório

```bash
# Certifique-se de que tudo está commitado
git add .
git commit -m "preparar para deploy"
git push origin feat/hardening-ux-lgpd
```

### 2. Deploy via Vercel (Método 1: Interface Web)

1. **Criar conta:**
   - Acesse https://vercel.com
   - Faça login com GitHub

2. **Importar projeto:**
   - Clique em "Add New..." > "Project"
   - Selecione seu repositório
   - Configure:
     - Framework Preset: **Vite**
     - Root Directory: `.` (pasta raiz)
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Variáveis de ambiente:**
   - Se usar variáveis (ex: Sentry, Plausible):
     ```
     VITE_ENABLE_SENTRY=false
     VITE_PLAUSIBLE_DOMAIN=
     ```

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build
   - ✅ Pronto! URL será gerada automaticamente

### 3. Deploy via Vercel CLI (Método 2: Linha de Comando)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy (primeira vez)
vercel

# Deploy para produção
vercel --prod
```

### 4. Configurar Domínio Customizado (Opcional)

1. No dashboard da Vercel:
   - Vá em **Settings** > **Domains**
   - Adicione seu domínio
   - Configure DNS conforme instruções

---

## 🔧 Configuração Específica por Plataforma

### Vercel

**Arquivo `vercel.json` (opcional):**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify

**Arquivo `netlify.toml` (criar na raiz):**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### GitHub Pages

**Ajuste `vite.config.ts`:**
```typescript
export default defineConfig({
  base: '/nome-do-repositorio/', // ou '/' para domínio customizado
  // ... resto da config
});
```

---

## 🔐 Variáveis de Ambiente

### Configurar no Vercel/Netlify

1. Vá em **Settings** > **Environment Variables**
2. Adicione:
   - `VITE_ENABLE_SENTRY` (se usar Sentry)
   - `VITE_SENTRY_DSN` (se usar Sentry)
   - `VITE_PLAUSIBLE_DOMAIN` (se usar Plausible)
   - `VITE_GEMINI_API_KEY` (se usar Gemini)

### Arquivo `.env.production` (Local)

Crie `.env.production` para variáveis de produção:
```env
VITE_ENABLE_SENTRY=true
VITE_SENTRY_DSN=sua_dsn_aqui
VITE_PLAUSIBLE_DOMAIN=seu-dominio.com
```

---

## 📱 PWA em Produção

### Verificar após deploy:

1. **Service Worker:**
   - Verifique se `sw.js` está sendo servido
   - URLs devem ser: `https://seu-site.com/sw.js`

2. **Manifest:**
   - Acesse: `https://seu-site.com/manifest.json`
   - Verifique se carrega corretamente

3. **Ícones:**
   - Certifique-se de que `icon-192.png` e `icon-512.png` existem em `/public`

---

## 🔄 Deploy Automático (CI/CD)

### Vercel / Netlify
- ✅ Deploy automático a cada push na branch `main`
- ✅ Preview deploys para PRs

### GitHub Actions (para GitHub Pages)
- Ver workflow em `.github/workflows/deploy.yml` (criar se necessário)

---

## ✅ Checklist de Deploy

Antes de fazer deploy:

- [ ] Build local funciona: `npm run build`
- [ ] Testes passam: `npm run test`
- [ ] Variáveis de ambiente configuradas
- [ ] `.env` não está commitado (verificar `.gitignore`)
- [ ] Ícones PWA existem (`/public/icon-*.png`)
- [ ] `manifest.json` configurado
- [ ] URLs absolutas ajustadas (se necessário)
- [ ] Firebase configurado (se usar)

Após deploy:

- [ ] Site carrega corretamente
- [ ] Service Worker registrado
- [ ] PWA instalável
- [ ] HTTPS funcionando
- [ ] Formulários funcionam
- [ ] PDFs geram corretamente

---

## 🐛 Troubleshooting

### Problema: 404 em rotas
**Solução:** Adicionar rewrites/redirects (ver `netlify.toml` ou `vercel.json`)

### Problema: Build falha
**Solução:**
- Verificar logs do build
- Testar build local: `npm run build`
- Verificar dependências em `package.json`

### Problema: PWA não funciona
**Solução:**
- Verificar se Service Worker está sendo servido
- Verificar HTTPS (necessário para PWA)
- Verificar `manifest.json`

---

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [GitHub Pages Docs](https://docs.github.com/pages)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages)

---

## 🎯 Recomendação Final

**Para começar rapidamente:** Use **Vercel** - é a opção mais simples e rápida para React/Vite.

**Para PWA completo:** Use **Netlify** - tem melhor suporte para PWA e Service Workers.

**Para economizar:** Use **GitHub Pages** - totalmente gratuito, mas requer mais configuração.

---

**Boa sorte com o deploy! 🚀**

