# ✅ Próximos Passos - Sistema de Autenticação

## 📋 Status Atual

✅ **Backend criado** - Estrutura completa em `server/`
✅ **Frontend atualizado** - Componentes e store criados
✅ **Scripts de setup criados** - Para facilitar instalação
✅ **Documentação criada** - Guias completos disponíveis

## 🚀 O Que Fazer Agora

### 1. Instalar Node.js (se ainda não tiver)

1. Baixe e instale Node.js ≥ 20: https://nodejs.org/
2. **IMPORTANTE**: Reinicie o terminal/PowerShell após instalar
3. Verifique a instalação:
```powershell
node --version
npm --version
```

### 2. Configurar Backend

**Opção A: Script Automático (Recomendado)**
```powershell
cd server
.\setup.ps1
```

**Opção B: Manual**
```powershell
cd server
npm install
copy .env.example .env
# Edite o arquivo .env com suas configurações
npm run prisma:generate
```

**Configurar Banco de Dados:**

1. Instale PostgreSQL (ou use Docker)
2. Crie o banco de dados:
```sql
CREATE DATABASE fisioq;
```

3. Configure no `server/.env`:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fisioq?schema=public"
JWT_SECRET="gere-uma-chave-secreta-aqui"
FRONTEND_URL="http://localhost:3000"
```

**Gerar chaves seguras:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Executar migrações:**
```powershell
cd server
npm run prisma:migrate
```

**Iniciar servidor:**
```powershell
npm run dev
```

### 3. Configurar Frontend

**Opção A: Script Automático**
```powershell
.\setup-frontend.ps1
```

**Opção B: Manual**
```powershell
npm install
```

**Criar arquivo .env na raiz:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

**Iniciar frontend:**
```powershell
npm run dev
```

### 4. Testar Sistema

1. **Backend**: Acesse http://localhost:5000/health
   - Deve retornar: `{"status":"ok","timestamp":"..."}`

2. **Frontend**: Acesse http://localhost:3000
   - Deve carregar a aplicação

3. **Registro**: Acesse http://localhost:3000/register
   - Crie uma conta de teste
   - Verifique email (se configurado)

4. **Login**: Acesse http://localhost:3000/login
   - Faça login com a conta criada

## 📚 Documentação Disponível

- **`SETUP_COMPLETO.md`** - Guia completo de instalação
- **`INSTALACAO_AUTH.md`** - Guia de instalação do sistema de auth
- **`server/README.md`** - Documentação do backend
- **`docs/AUTH_IMPLEMENTATION.md`** - Documentação técnica
- **`docs/AUTH_QUICK_START.md`** - Quick start

## 🔧 Configurações Opcionais

### Google OAuth

1. Acesse: https://console.cloud.google.com/
2. Crie credenciais OAuth 2.0
3. Configure no `.env` do backend e frontend

### Email (SMTP)

1. Configure SMTP no `server/.env`
2. Para Gmail, gere uma "Senha de App"
3. Configure `SMTP_USER` e `SMTP_PASS`

## ⚠️ Importante

- **Nunca commite arquivos `.env`** no Git
- **Use chaves diferentes** para desenvolvimento e produção
- **Configure backups** do banco de dados
- **Monitore logs** de autenticação

## 🐛 Problemas Comuns

### "npm não é reconhecido"
- Reinicie o terminal após instalar Node.js
- Verifique se Node.js está no PATH

### "Database connection failed"
- Verifique se PostgreSQL está rodando
- Verifique `DATABASE_URL` no `.env`

### "Porta já em uso"
- Altere `PORT` no `server/.env`
- Atualize `VITE_API_URL` no frontend

## 📞 Próximos Passos Após Setup

1. ✅ Testar todos os fluxos de autenticação
2. ✅ Configurar 2FA
3. ✅ Testar Google OAuth
4. ✅ Configurar email
5. ✅ Revisar segurança
6. ✅ Preparar para produção

---

**Dúvidas?** Consulte a documentação em `docs/` ou `SETUP_COMPLETO.md`

