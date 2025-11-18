# 🚀 Guia de Deploy - FisioQ

## 📋 Pré-requisitos

1. **Conta no Vercel/Netlify** (para frontend)
2. **Conta no Railway/Render/Heroku** (para backend)
3. **Banco de dados PostgreSQL** (Supabase, Railway, ou similar)
4. **Variáveis de ambiente configuradas**

---

## 🔧 Deploy do Backend

### Opção 1: Railway (Recomendado)

1. Acesse [Railway.app](https://railway.app)
2. Crie um novo projeto
3. Conecte seu repositório GitHub
4. Selecione a pasta `server/`
5. Configure as variáveis de ambiente:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=seu-jwt-secret-super-seguro-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-super-seguro-aqui
ENCRYPTION_KEY=seu-encryption-key-32-caracteres
FRONTEND_URL=https://seu-app.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
NODE_ENV=production
PORT=3001
```

6. Railway detectará automaticamente o `package.json` e fará o deploy

### Opção 2: Render

1. Acesse [Render.com](https://render.com)
2. Crie um novo Web Service
3. Conecte seu repositório
4. Configure:
   - **Build Command**: `cd server && npm install && npx prisma generate`
   - **Start Command**: `cd server && npm start`
   - **Root Directory**: `server`
5. Adicione as mesmas variáveis de ambiente acima

---

## 🌐 Deploy do Frontend

### Vercel (Recomendado)

1. Acesse [Vercel.com](https://vercel.com)
2. Importe seu repositório GitHub
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Adicione variáveis de ambiente:

```env
VITE_API_URL=https://seu-backend.railway.app
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

5. Clique em **Deploy**

### Netlify

1. Acesse [Netlify.com](https://netlify.com)
2. Importe seu repositório
3. Configure:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Adicione as mesmas variáveis de ambiente (com prefixo `VITE_`)

---

## 🗄️ Configuração do Banco de Dados

### Opção 1: Supabase (Recomendado - Grátis)

1. Acesse [Supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **Settings > Database**
4. Copie a **Connection String**
5. Use no `DATABASE_URL` do backend

### Opção 2: Railway PostgreSQL

1. No Railway, adicione um serviço PostgreSQL
2. Copie a connection string
3. Use no `DATABASE_URL`

### Executar Migrações

Após configurar o banco, execute as migrações:

```bash
cd server
npx prisma migrate deploy
```

Ou via Railway/Render, adicione um script de build:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "migrate": "prisma migrate deploy"
  }
}
```

---

## 🔐 Configuração do Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Ative **Google+ API**
4. Vá em **Credentials > Create Credentials > OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-app.vercel.app` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-app.vercel.app` (produção)
6. Copie **Client ID** e **Client Secret**
7. Adicione nas variáveis de ambiente

---

## 📧 Configuração de Email

### Gmail (Recomendado para testes)

1. Ative **Senhas de app** no Google Account
2. Gere uma senha de app
3. Use:
   - `EMAIL_HOST=smtp.gmail.com`
   - `EMAIL_PORT=587`
   - `EMAIL_USER=seu-email@gmail.com`
   - `EMAIL_PASS=sua-senha-app`

### SendGrid (Produção)

1. Crie conta em [SendGrid](https://sendgrid.com)
2. Gere uma API Key
3. Configure:
   - `EMAIL_HOST=smtp.sendgrid.net`
   - `EMAIL_PORT=587`
   - `EMAIL_USER=apikey`
   - `EMAIL_PASS=sua-api-key`

---

## ✅ Checklist de Deploy

### Backend
- [ ] Banco de dados PostgreSQL configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Migrações executadas (`prisma migrate deploy`)
- [ ] Servidor rodando e acessível
- [ ] Teste de endpoint: `GET /health` (se existir)

### Frontend
- [ ] Variáveis de ambiente configuradas (`VITE_API_URL`)
- [ ] Build executando sem erros
- [ ] Deploy concluído
- [ ] Teste de login funcionando
- [ ] Teste de registro funcionando

### Integrações
- [ ] Google OAuth configurado
- [ ] Email configurado e testado
- [ ] CORS configurado no backend (permitir domínio do frontend)

---

## 🔍 Verificação Pós-Deploy

1. **Teste de Registro**:
   - Acesse `/register`
   - Crie uma conta
   - Verifique se recebeu email de confirmação

2. **Teste de Login**:
   - Faça login com email/senha
   - Teste login com Google

3. **Teste de 2FA**:
   - Ative 2FA no perfil
   - Faça logout e login novamente
   - Verifique se pede código 2FA

4. **Teste de Reset de Senha**:
   - Clique em "Esqueci minha senha"
   - Verifique se recebeu email
   - Teste reset de senha

---

## 🐛 Troubleshooting

### Backend não conecta ao banco
- Verifique `DATABASE_URL`
- Verifique se o banco aceita conexões externas
- Verifique firewall/whitelist de IPs

### Frontend não conecta ao backend
- Verifique `VITE_API_URL`
- Verifique CORS no backend
- Verifique se o backend está rodando

### Email não está sendo enviado
- Verifique credenciais de email
- Verifique se senha de app está correta (Gmail)
- Verifique logs do servidor

### Google OAuth não funciona
- Verifique URLs autorizadas no Google Console
- Verifique `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
- Verifique se domínio está correto

---

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Railway](https://docs.railway.app)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

**Última atualização**: Dezembro 2024

