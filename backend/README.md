# FisioQ Backend API

Backend API para o sistema FisioQ - Sistema de Questionários Clínicos.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** + **Prisma** - Banco de dados
- **Redis** - Cache e sessões
- **JWT** - Autenticação
- **Zod** - Validação
- **Winston** - Logging
- **Docker** - Containerização

## 📋 Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou usar Docker)

## 🔧 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fisioq?schema=public
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Iniciar banco de dados (Docker)

```bash
docker-compose up -d
```

### 4. Configurar Prisma

```bash
# Gerar Prisma Client
npm run prisma:generate

# Executar migrações
npm run prisma:migrate
```

### 5. (Opcional) Seed do banco de dados

```bash
npm run prisma:seed
```

## 🏃 Executar

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## 📚 API Endpoints

### Autenticação

- `POST /api/v1/auth/register` - Registrar novo usuário
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/google` - Login com Google
- `POST /api/v1/auth/refresh` - Renovar token
- `POST /api/v1/auth/logout` - Logout

### Pacientes

- `GET /api/v1/patients` - Listar pacientes
- `POST /api/v1/patients` - Criar paciente
- `GET /api/v1/patients/:id` - Buscar paciente
- `PUT /api/v1/patients/:id` - Atualizar paciente
- `DELETE /api/v1/patients/:id` - Deletar paciente

### Resultados

- `GET /api/v1/results` - Listar resultados
- `POST /api/v1/results` - Criar resultado
- `GET /api/v1/results/:id` - Buscar resultado
- `DELETE /api/v1/results/:id` - Deletar resultado

### Sincronização

- `POST /api/v1/sync` - Sincronizar mudanças
- `GET /api/v1/sync/status` - Status de sincronização

### Health Check

- `GET /api/v1/health` - Status do servidor

## 🧪 Testes

```bash
npm test
npm run test:coverage
```

## 📝 Scripts

- `npm run dev` - Iniciar em modo desenvolvimento
- `npm run build` - Compilar TypeScript
- `npm start` - Iniciar em produção
- `npm run prisma:generate` - Gerar Prisma Client
- `npm run prisma:migrate` - Executar migrações
- `npm run prisma:studio` - Abrir Prisma Studio
- `npm run lint` - Verificar código
- `npm run lint:fix` - Corrigir código

## 🔐 Segurança

- **Helmet** - Headers de segurança
- **CORS** - Configuração de origem
- **Rate Limiting** - Limite de requisições
- **JWT** - Autenticação segura
- **bcrypt** - Hash de senhas
- **Zod** - Validação de entrada

## 📦 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/          # Configurações
│   ├── controllers/     # Controllers
│   ├── middleware/      # Middlewares
│   ├── routes/          # Rotas
│   ├── services/        # Lógica de negócio
│   ├── utils/           # Utilitários
│   ├── validators/      # Validações Zod
│   └── index.ts         # Entrada da aplicação
├── prisma/
│   └── schema.prisma    # Schema do banco
├── docker-compose.yml   # Docker Compose
└── package.json
```

## 🐳 Docker

### Iniciar serviços

```bash
docker-compose up -d
```

### Parar serviços

```bash
docker-compose down
```

### Ver logs

```bash
docker-compose logs -f
```

## 📄 Licença

MIT

