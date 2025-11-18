# Implementação de Autenticação Robusta - FisioQ

Este documento descreve a implementação completa do sistema de autenticação robusta do FisioQ.

## 📋 Visão Geral

O sistema implementa autenticação multi-método com:
- ✅ Email/Senha (básico)
- ✅ Google OAuth (login social)
- ✅ 2FA com TOTP (autenticação de dois fatores)
- ✅ Email Verification (confirmação de email)
- ✅ Password Reset (recuperação de senha)
- ✅ Session Management (gerenciamento de sessão)
- ✅ Account Lockout (proteção contra força bruta)

## 🏗️ Arquitetura

### Backend

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts      # Prisma Client
│   │   └── env.ts           # Variáveis de ambiente
│   ├── controllers/
│   │   └── authController.ts # Controllers de autenticação
│   ├── middleware/
│   │   └── auth.ts          # Middleware JWT
│   ├── routes/
│   │   └── auth.ts          # Rotas de autenticação
│   ├── schemas/
│   │   └── auth.ts          # Validação Zod
│   ├── services/
│   │   └── authService.ts   # Lógica de negócio
│   ├── utils/
│   │   ├── email.ts         # Envio de emails
│   │   ├── encryption.ts    # Criptografia de secrets
│   │   ├── jwt.ts           # Geração/validação JWT
│   │   └── password.ts      # Hash/validação de senhas
│   └── index.ts             # Servidor Express
└── prisma/
    └── schema.prisma        # Schema do banco de dados
```

### Frontend

```
src/
├── components/
│   └── auth/
│       ├── LoginForm.tsx           # Formulário de login
│       ├── RegisterForm.tsx        # Formulário de registro
│       ├── TwoFactorSetup.tsx      # Configuração 2FA
│       ├── TwoFactorVerify.tsx     # Verificação 2FA
│       ├── PasswordReset.tsx       # Reset de senha
│       └── GoogleLoginButton.tsx   # Botão Google OAuth
├── services/
│   └── api.ts              # Cliente Axios com interceptors
└── stores/
    └── authStore.ts        # Store Zustand para autenticação
```

## 🔐 Fluxos de Autenticação

### 1. Registro

```
Usuário preenche email e senha
    ↓
Validar força da senha
    ↓
Verificar se email já existe
    ↓
Hash da senha (bcryptjs)
    ↓
Criar usuário no banco
    ↓
Enviar email de confirmação
    ↓
Retornar tokens (access + refresh)
```

### 2. Login

```
Usuário preenche email e senha
    ↓
Verificar se usuário existe
    ↓
Comparar senha com hash
    ↓
Verificar se email está confirmado
    ↓
Se 2FA ativado: retornar tempToken
    ↓
Usuário digita código 2FA
    ↓
Gerar tokens (access + refresh)
    ↓
Salvar refresh token no banco
    ↓
Retornar tokens
```

### 3. Google OAuth

```
Usuário clica em "Login com Google"
    ↓
Redireciona para Google
    ↓
Usuário autoriza
    ↓
Google retorna token
    ↓
Backend verifica token com Google
    ↓
Criar ou atualizar usuário
    ↓
Gerar tokens FisioQ
    ↓
Retornar tokens
```

### 4. 2FA (TOTP)

```
Usuário ativa 2FA
    ↓
Gerar secret TOTP
    ↓
Exibir QR code
    ↓
Usuário escaneia com Google Authenticator/Authy
    ↓
Usuário confirma código
    ↓
Salvar secret no banco (criptografado)
    ↓
Próximo login: pedir código TOTP
```

## 🔑 Segurança

### JWT Tokens

- **Access Token**: Válido por 15 minutos
- **Refresh Token**: Válido por 30 dias, armazenado no banco
- **Rotação**: Refresh token pode ser usado para obter novo access token

### Password Security

- **Hashing**: bcryptjs com 12 rounds
- **Validação**: Mínimo 8 caracteres, maiúscula, minúscula, número, caractere especial
- **Reset**: Token único válido por 1 hora

### Account Protection

- **Lockout**: 5 tentativas falhas = bloqueio por 15 minutos
- **Login Logs**: Registro de todas as tentativas de login
- **IP Tracking**: Registro de IP e User-Agent

### 2FA Security

- **TOTP**: Time-based One-Time Password
- **Backup Codes**: 10 códigos de backup gerados
- **Secret Encryption**: Secrets criptografados no banco (AES-256-GCM)

## 📧 Email

O sistema envia emails para:
- Verificação de email (após registro)
- Reset de senha
- Reenvio de verificação

Configuração via Nodemailer (SMTP).

## 🗄️ Banco de Dados

### Modelos Prisma

- **Professional**: Usuário/profissional
- **RefreshToken**: Tokens de refresh
- **PasswordReset**: Tokens de reset de senha
- **EmailVerification**: Tokens de verificação de email
- **LoginLog**: Logs de tentativas de login

## 🚀 Como Usar

### Backend

1. Configure o `.env` com suas credenciais
2. Execute as migrações: `npm run prisma:migrate`
3. Inicie o servidor: `npm run dev`

### Frontend

1. Configure `VITE_API_URL` no `.env` (ou use padrão `http://localhost:5000/api`)
2. Configure `VITE_GOOGLE_CLIENT_ID` para Google OAuth
3. Use os componentes de autenticação nas rotas

### Rotas Frontend

```tsx
// routes/index.tsx
<Route path="/login" element={<LoginForm />} />
<Route path="/register" element={<RegisterForm />} />
<Route path="/verify-2fa" element={<TwoFactorVerify />} />
<Route path="/setup-2fa" element={<TwoFactorSetup />} />
<Route path="/forgot-password" element={<PasswordReset />} />
<Route path="/reset-password" element={<PasswordReset />} />
```

## ✅ Checklist de Implementação

- [x] Backend com Express e Prisma
- [x] Autenticação JWT
- [x] Registro e Login
- [x] 2FA com TOTP
- [x] Google OAuth
- [x] Email Verification
- [x] Password Reset
- [x] Account Lockout
- [x] Frontend com Zustand
- [x] Componentes de autenticação
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Documentação de API (Swagger)

## 🔜 Próximos Passos

1. Adicionar testes unitários e de integração
2. Implementar rate limiting
3. Adicionar Swagger/OpenAPI
4. Implementar refresh token rotation
5. Adicionar suporte a múltiplos provedores OAuth (Facebook, GitHub, etc.)

