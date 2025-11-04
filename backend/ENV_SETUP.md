# Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto `backend/` com as seguintes variáveis:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://fisioq:fisioq123@localhost:5432/fisioq?schema=public

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Sentry (optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# Logging
LOG_LEVEL=info
```

## Variáveis Obrigatórias em Produção

- `JWT_SECRET` - Deve ser uma string segura e aleatória
- `DATABASE_URL` - URL de conexão com PostgreSQL
- `GOOGLE_CLIENT_ID` - Se usar autenticação Google
- `GOOGLE_CLIENT_SECRET` - Se usar autenticação Google

## Variáveis Opcionais

- `SENTRY_DSN` - Para monitoramento de erros
- `REDIS_URL` - Para cache (opcional, pode usar sem Redis)
- `LOG_LEVEL` - Nível de logging (default: info)

