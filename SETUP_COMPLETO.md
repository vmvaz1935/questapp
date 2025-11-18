# 🚀 Guia de Setup Completo - Sistema de Autenticação

Este guia vai te ajudar a configurar todo o sistema de autenticação do FisioQ.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

1. **Node.js ≥ 20** instalado
   - Download: https://nodejs.org/
   - Verificar: `node --version`

2. **PostgreSQL** instalado e rodando
   - Download: https://www.postgresql.org/download/
   - Ou use Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres`

3. **Git** (opcional, para clonar o repositório)

## 🔧 Passo 1: Configurar Backend

### Opção A: Usando Script Automático (Recomendado)

**Windows (PowerShell):**
```powershell
cd server
.\setup.ps1
```

**Linux/Mac:**
```bash
cd server
chmod +x setup.sh
./setup.sh
```

### Opção B: Manual

```bash
cd server

# 1. Instalar dependências
npm install

# 2. Criar arquivo .env
copy .env.example .env  # Windows
# ou
cp .env.example .env    # Linux/Mac

# 3. Editar .env com suas configurações
# (veja seção de configuração abaixo)

# 4. Gerar Prisma Client
npm run prisma:generate

# 5. Executar migrações do banco
npm run prisma:migrate
```

### Configurar arquivo .env do Backend

Edite `server/.env` e configure pelo menos:

```env
# OBRIGATÓRIO: URL do banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fisioq?schema=public"

# OBRIGATÓRIO: Chave secreta para JWT (gere uma chave segura)
JWT_SECRET="sua-chave-super-secreta-aqui-mude-em-producao"

# OBRIGATÓRIO: URL do frontend
FRONTEND_URL="http://localhost:3000"

# OPCIONAL: Configuração de email (para verificação e reset de senha)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# OPCIONAL: Google OAuth
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# OPCIONAL: Chave de criptografia para secrets 2FA
ENCRYPTION_KEY="sua-chave-de-criptografia-32-bytes"
```

**Gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Gerar ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Criar Banco de Dados

```sql
-- Conecte-se ao PostgreSQL
psql -U postgres

-- Crie o banco de dados
CREATE DATABASE fisioq;

-- Crie um usuário (opcional)
CREATE USER fisioq_user WITH PASSWORD 'sua_senha';
GRANT ALL PRIVILEGES ON DATABASE fisioq TO fisioq_user;
```

### Executar Migrações

```bash
cd server
npm run prisma:migrate
```

Isso criará todas as tabelas necessárias no banco de dados.

### Iniciar Servidor Backend

```bash
cd server
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

**Verificar se está funcionando:**
```bash
curl http://localhost:5000/health
# Deve retornar: {"status":"ok","timestamp":"..."}
```

## 🎨 Passo 2: Configurar Frontend

### Opção A: Usando Script Automático

**Windows (PowerShell):**
```powershell
.\setup-frontend.ps1
```

### Opção B: Manual

```bash
# Na raiz do projeto

# 1. Instalar dependências
npm install

# 2. Criar/editar arquivo .env
# (veja configuração abaixo)
```

### Configurar arquivo .env do Frontend

Crie ou edite `.env` na raiz do projeto:

```env
# OBRIGATÓRIO: URL da API backend
VITE_API_URL=http://localhost:5000/api

# OPCIONAL: Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=seu-google-client-id

# Outras variáveis opcionais...
```

### Iniciar Servidor Frontend

```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000` (ou outra porta indicada)

## ✅ Passo 3: Verificar Instalação

### Testar Backend

1. Acesse: http://localhost:5000/health
2. Deve retornar: `{"status":"ok","timestamp":"..."}`

### Testar Frontend

1. Acesse: http://localhost:3000
2. Deve carregar a aplicação

### Testar Registro

1. Acesse: http://localhost:3000/register
2. Preencha o formulário
3. Verifique se recebe email de confirmação (se configurado)

## 🔐 Passo 4: Configurar Google OAuth (Opcional)

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto ou selecione existente
3. Ative "Google+ API"
4. Vá em "Credenciais" > "Criar credenciais" > "ID do cliente OAuth 2.0"
5. Configure:
   - Tipo: Aplicativo da Web
   - URLs autorizadas: `http://localhost:3000`
   - URLs de redirecionamento: `http://localhost:3000`
6. Copie o Client ID e Client Secret
7. Configure no `.env` do backend e frontend

## 📧 Passo 5: Configurar Email (Opcional)

### Gmail

1. Ative verificação em duas etapas na sua conta Google
2. Gere uma "Senha de App":
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Outro (nome personalizado)"
   - Digite "FisioQ" e clique em "Gerar"
   - Copie a senha gerada
3. Configure no `server/.env`:
```env
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="senha-de-app-gerada"
```

### Outros Provedores

Consulte a documentação do Nodemailer para configurações específicas.

## 🐛 Troubleshooting

### Erro: "Cannot find module '@prisma/client'"

```bash
cd server
npm run prisma:generate
```

### Erro: "Database connection failed"

- Verifique se PostgreSQL está rodando
- Verifique se `DATABASE_URL` está correta
- Teste a conexão:
```bash
psql -U usuario -d fisioq
```

### Erro: "JWT_SECRET is not defined"

Certifique-se de que `JWT_SECRET` está no `server/.env`

### Emails não são enviados

- Em desenvolvimento, o sistema não falha se email não estiver configurado
- Verifique os logs do servidor
- Teste a configuração SMTP separadamente

### Google OAuth não funciona

- Verifique se `GOOGLE_CLIENT_ID` está configurado
- Verifique se a URL de redirecionamento está autorizada no Google Console
- Verifique os logs do navegador

### Porta já em uso

Se a porta 5000 estiver em uso, altere no `server/.env`:
```env
PORT=5001
```

E atualize `VITE_API_URL` no frontend.

## 📚 Próximos Passos

1. ✅ Configure HTTPS em produção
2. ✅ Configure variáveis de ambiente no servidor de produção
3. ✅ Configure backup do banco de dados
4. ✅ Configure monitoramento e logs
5. ✅ Revise as políticas de segurança

## 🔗 Links Úteis

- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação JWT](https://jwt.io/)
- [Documentação Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Documentação Nodemailer](https://nodemailer.com/)

## 💡 Dicas

- Use variáveis de ambiente diferentes para desenvolvimento e produção
- Nunca commite arquivos `.env` no Git
- Use um gerenciador de senhas para gerar chaves seguras
- Configure backups regulares do banco de dados
- Monitore os logs de autenticação para detectar tentativas suspeitas

