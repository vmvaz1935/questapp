# FisioQ Backend - Servidor de Autenticação

Backend API para o sistema FisioQ com autenticação robusta (JWT, OAuth, 2FA).

## 🚀 Instalação

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar Banco de Dados

1. Crie um banco de dados PostgreSQL
2. Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

3. Configure a `DATABASE_URL` no `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/fisioq?schema=public"
```

### 3. Executar Migrações do Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Configurar Variáveis de Ambiente

Edite o arquivo `.env` com suas configurações:

```env
# JWT Secret (gere uma chave segura)
JWT_SECRET="sua-chave-secreta-super-segura-aqui"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Email (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"

# Google OAuth
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"
```

## 🏃 Executar

### Desenvolvimento

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:5000`

### Produção

```bash
npm run build
npm start
```

## 📡 Endpoints da API

### Autenticação

- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/refresh` - Renovar access token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/logout-all` - Logout de todos os dispositivos

### 2FA

- `POST /api/auth/2fa/setup` - Configurar 2FA (requer autenticação)
- `POST /api/auth/2fa/confirm` - Confirmar configuração 2FA (requer autenticação)
- `POST /api/auth/2fa/verify` - Verificar código 2FA
- `DELETE /api/auth/2fa` - Desativar 2FA (requer autenticação)

### Google OAuth

- `POST /api/auth/google` - Login com Google

### Email Verification

- `POST /api/auth/verify-email/send` - Enviar email de verificação (requer autenticação)
- `GET /api/auth/verify-email?token=...` - Verificar email

### Password Reset

- `POST /api/auth/password-reset/request` - Solicitar reset de senha
- `POST /api/auth/password-reset/confirm` - Confirmar reset de senha

## 🔒 Segurança

- **JWT Tokens**: Access tokens (15min) e Refresh tokens (30 dias)
- **Password Hashing**: bcryptjs com 12 rounds
- **2FA**: TOTP com Speakeasy
- **Account Lockout**: Bloqueio após 5 tentativas falhas (15 minutos)
- **Email Verification**: Obrigatório antes do primeiro login
- **Password Strength**: Mínimo 8 caracteres com maiúscula, minúscula, número e caractere especial

## 📚 Documentação

Para mais detalhes sobre a implementação, consulte:
- `docs/AUTH_IMPLEMENTATION.md` (a ser criado)

## 🐛 Troubleshooting

### Erro de conexão com banco de dados

Verifique se:
1. PostgreSQL está rodando
2. `DATABASE_URL` está correta no `.env`
3. As credenciais estão corretas

### Erro ao enviar emails

Em desenvolvimento, o sistema não falhará se o email não estiver configurado. Em produção, configure corretamente o SMTP.

### Erro de JWT

Certifique-se de que `JWT_SECRET` está configurado e é uma string segura.

