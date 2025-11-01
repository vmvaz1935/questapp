# 🚀 Deploy Rápido - Guia de 5 Minutos

## ✅ Pré-requisitos

1. ✅ Código commitado e pushado no GitHub
2. ✅ Build funciona localmente: `npm run build`
3. ✅ Repositório no GitHub

---

## 🎯 Opção Recomendada: Vercel (Mais Rápida)

### Passo a Passo:

1. **Acesse:** https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Clique em:** "Add New..." > "Project"
4. **Selecione** seu repositório do GitHub
5. **Configure o projeto:**
   ```
   Framework Preset: Vite
   Root Directory: . (pasta raiz)
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```
6. **Adicione variáveis de ambiente** (se necessário):
   - `VITE_ENABLE_SENTRY` = `false`
   - `VITE_PLAUSIBLE_DOMAIN` = (seu domínio ou deixe vazio)
7. **Clique em "Deploy"**
8. ⏱️ Aguarde 1-2 minutos
9. ✅ **Pronto!** Seu site estará online com uma URL como:
   ```
   https://seu-projeto.vercel.app
   ```

### ✨ Vantagens:
- ✅ Deploy automático a cada push
- ✅ URL customizada grátis
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Preview para cada PR

---

## 🎯 Alternativa: Netlify (Melhor para PWA)

### Passo a Passo:

1. **Acesse:** https://www.netlify.com
2. **Faça login** com GitHub
3. **Clique em:** "Add new site" > "Import an existing project"
4. **Conecte** seu repositório GitHub
5. **Configure:**
   ```
   Build command: npm run build
   Publish directory: dist
   ```
6. **Clique em "Deploy site"**
7. ⏱️ Aguarde 1-2 minutos
8. ✅ **Pronto!** URL como:
   ```
   https://seu-projeto.netlify.app
   ```

### ✨ Vantagens:
- ✅ Excelente suporte PWA
- ✅ Deploy automático
- ✅ Formulários integrados
- ✅ Functions serverless

---

## 🔧 Comandos Rápidos

### Vercel CLI
```bash
# Instalar
npm i -g vercel

# Deploy (primeira vez)
vercel

# Deploy produção
vercel --prod
```

### Netlify CLI
```bash
# Instalar
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## ✅ Após Deploy

### Verificar:
1. ✅ Site carrega corretamente
2. ✅ Rotas funcionam (navegar entre páginas)
3. ✅ PWA instalável (verificar se aparece opção "Instalar")
4. ✅ Service Worker registrado (DevTools > Application > Service Workers)
5. ✅ HTTPS funcionando

### Customizar Domínio:
- **Vercel:** Settings > Domains > Add Domain
- **Netlify:** Site settings > Domain management > Add custom domain

---

## 🐛 Problemas Comuns

### 404 em rotas
**Solução:** Os arquivos `vercel.json` e `netlify.toml` já estão configurados para isso! ✅

### Build falha
**Solução:**
```bash
# Testar localmente primeiro
npm run build
```

### PWA não funciona
**Solução:** Certifique-se de que está usando HTTPS (automaticamente em Vercel/Netlify)

---

## 📞 Suporte

- **Vercel Docs:** https://vercel.com/docs
- **Netlify Docs:** https://docs.netlify.com

---

## 🎉 Pronto!

Depois do deploy, compartilhe a URL com seus usuários! 🚀

**URL exemplo:**
```
https://fisioq-beta.vercel.app
```

