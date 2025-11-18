# 🚀 Guia de Instalação - Sistema de Autenticação

Este guia explica como configurar e usar o novo sistema de autenticação robusta do FisioQ.

## 📋 Pré-requisitos

- Node.js ≥ 20
- PostgreSQL (ou outro banco suportado pelo Prisma)
- npm ≥ 9

## 🔧 Instalação do Backend

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar Banco de Dados

1. Crie um banco de dados PostgreSQL:
```sql
CREATE DATABASE fisioq;
```

2. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

3. Edite o `.env` e configure:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fisioq?schema=public"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
FRONTEND_URL="http://localhost:3000"
```

### 3. Executar Migrações

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Configurar Email (Opcional)

Para envio de emails, configure no `.env`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"
```

**Nota**: Para Gmail, você precisa criar uma "Senha de App" nas configurações de segurança.

### 5. Configurar Google OAuth (Opcional)

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a API "Google+ API"
4. Crie credenciais OAuth 2.0
5. Configure no `.env`:
```env
GOOGLE_CLIENT_ID="seu-client-id"
GOOGLE_CLIENT_SECRET="seu-client-secret"
```

### 6. Iniciar Servidor

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

## 🎨 Instalação do Frontend

### 1. Instalar Dependências

Na raiz do projeto:
```bash
npm install
```

Isso instalará `axios` e `zustand` necessários para o novo sistema.

### 2. Configurar Variáveis de Ambiente

Crie ou edite `.env` na raiz:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=seu-google-client-id
```

### 3. Adicionar Rotas

Atualize suas rotas para incluir os novos componentes:

```tsx
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { TwoFactorVerify } from './components/auth/TwoFactorVerify';
import { TwoFactorSetup } from './components/auth/TwoFactorSetup';
import { PasswordReset } from './components/auth/PasswordReset';

// Nas suas rotas:
<Route path="/login" element={<LoginForm />} />
<Route path="/register" element={<RegisterForm />} />
<Route path="/verify-2fa" element={<TwoFactorVerify />} />
<Route path="/setup-2fa" element={<TwoFactorSetup />} />
<Route path="/forgot-password" element={<PasswordReset />} />
<Route path="/reset-password" element={<PasswordReset />} />
```

### 4. Iniciar Frontend

```bash
npm run dev
```

## ✅ Verificação

### Testar Backend

1. Acesse `http://localhost:5000/health`
2. Deve retornar: `{"status":"ok","timestamp":"..."}`

### Testar Registro

1. Acesse `/register`
2. Preencha nome, email e senha
3. Verifique se recebeu email de confirmação
4. Faça login

### Testar Login

1. Acesse `/login`
2. Use as credenciais criadas
3. Se 2FA estiver ativado, será redirecionado para `/verify-2fa`

## 🔐 Configurar 2FA

1. Faça login
2. Acesse `/setup-2fa`
3. Escaneie o QR code com Google Authenticator ou Authy
4. Digite o código de 6 dígitos
5. Guarde os códigos de backup em local seguro

## 📧 Configurar Email

### Gmail

1. Ative verificação em duas etapas na sua conta Google
2. Gere uma "Senha de App":
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "App" e "Outro"
   - Copie a senha gerada
3. Use no `.env`:
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
- Teste a conexão: `psql -U usuario -d fisioq`

### Erro: "JWT_SECRET is not defined"

Certifique-se de que `JWT_SECRET` está no `.env` do servidor.

### Emails não são enviados

- Em desenvolvimento, o sistema não falha se email não estiver configurado
- Verifique os logs do servidor
- Teste a configuração SMTP separadamente

### Google OAuth não funciona

- Verifique se `GOOGLE_CLIENT_ID` está configurado
- Verifique se a URL de redirecionamento está autorizada no Google Console
- Verifique os logs do navegador para erros

## 📚 Próximos Passos

1. Configure HTTPS em produção
2. Configure variáveis de ambiente no servidor de produção
3. Configure backup do banco de dados
4. Configure monitoramento e logs
5. Revise as políticas de segurança

## 🔗 Links Úteis

- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação JWT](https://jwt.io/)
- [Documentação Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- [Documentação Nodemailer](https://nodemailer.com/)

