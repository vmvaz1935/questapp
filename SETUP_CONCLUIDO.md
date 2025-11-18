# ✅ Setup Concluído - Próximos Passos

## 🎉 O que foi feito

✅ **Node.js instalado** - Versão 24.11.1 (LTS)
✅ **npm instalado** - Versão 11.6.2
✅ **Dependências do backend instaladas** - 253 pacotes
✅ **Dependências do frontend instaladas** - 847 pacotes
✅ **Prisma Client gerado** - Pronto para uso
✅ **Arquivo .env criado** - Em `server/.env`

## ⚠️ Configurações Necessárias

### 1. Configurar Banco de Dados PostgreSQL

**Opção A: Instalar PostgreSQL localmente**
- Download: https://www.postgresql.org/download/windows/
- Ou use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

**Opção B: Usar banco remoto (Supabase, Railway, etc.)**

**Depois de ter o PostgreSQL:**

1. Crie o banco de dados:
```sql
CREATE DATABASE fisioq;
```

2. Edite `server/.env` e configure:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fisioq?schema=public"
```

3. Execute as migrações:
```powershell
cd server
npm run prisma:migrate
```

### 2. Gerar Chaves Seguras

**Gerar JWT_SECRET:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Gerar ENCRYPTION_KEY:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Edite `server/.env` e substitua:**
```env
JWT_SECRET="cole-a-chave-gerada-aqui"
ENCRYPTION_KEY="cole-a-chave-gerada-aqui"
```

### 3. Configurar Frontend (Opcional)

Crie arquivo `.env` na raiz do projeto:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

## 🚀 Como Iniciar

### Backend

```powershell
cd server
npm run dev
```

O servidor estará em: `http://localhost:5000`

**Verificar se está funcionando:**
```powershell
curl http://localhost:5000/health
```

### Frontend

```powershell
# Na raiz do projeto
npm run dev
```

O frontend estará em: `http://localhost:3000` (ou outra porta)

## 📋 Checklist Final

- [ ] PostgreSQL instalado e rodando
- [ ] Banco de dados `fisioq` criado
- [ ] `DATABASE_URL` configurado no `server/.env`
- [ ] `JWT_SECRET` gerado e configurado
- [ ] `ENCRYPTION_KEY` gerado e configurado
- [ ] Migrações do Prisma executadas (`npm run prisma:migrate`)
- [ ] Backend iniciado e funcionando
- [ ] Frontend iniciado e funcionando

## 🔧 Configurações Opcionais

### Email (SMTP)

Para habilitar envio de emails (verificação, reset de senha):

1. Configure no `server/.env`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="senha-de-app-gerada"
```

2. Para Gmail, gere uma "Senha de App":
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" > "Outro" > "FisioQ"
   - Copie a senha gerada

### Google OAuth

1. Acesse: https://console.cloud.google.com/
2. Crie credenciais OAuth 2.0
3. Configure no `server/.env` e `.env` do frontend:
```env
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

## 🐛 Problemas Comuns

### "Database connection failed"
- Verifique se PostgreSQL está rodando
- Verifique se `DATABASE_URL` está correta
- Teste: `psql -U usuario -d fisioq`

### "Porta já em uso"
- Altere `PORT` no `server/.env`
- Atualize `VITE_API_URL` no frontend

### "Cannot find module '@prisma/client'"
```powershell
cd server
npm run prisma:generate
```

## 📚 Documentação

- `SETUP_COMPLETO.md` - Guia completo de instalação
- `PROXIMOS_PASSOS.md` - Instruções detalhadas
- `server/README.md` - Documentação do backend
- `docs/AUTH_IMPLEMENTATION.md` - Documentação técnica

## ✨ Próximos Passos

1. Configure o banco de dados PostgreSQL
2. Execute as migrações
3. Gere as chaves de segurança
4. Inicie os servidores
5. Teste o sistema de autenticação

---

**Status:** ✅ Setup básico concluído - Configure o banco de dados para continuar

