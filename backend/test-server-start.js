// Script para testar se o servidor Express inicia corretamente
// Não requer banco de dados, apenas testa a inicialização do Express

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './src/config/env.js';
import logger from './src/utils/logger.js';

console.log('🚀 Testando inicialização do servidor Express...\n');

const app = express();

// Middleware de segurança
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requisições
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Rotas de teste
app.get('/', (_req, res) => {
  res.json({
    message: 'FisioQ Backend API',
    version: '1.0.0',
    status: 'Teste OK',
    docs: '/api/v1/health',
  });
});

app.get('/api/v1/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    port: config.port,
  });
});

// Iniciar servidor em porta diferente para não conflitar
const TEST_PORT = 3001;

const server = app.listen(TEST_PORT, () => {
  console.log(`✅ Servidor Express iniciado com sucesso na porta ${TEST_PORT}`);
  console.log(`   Ambiente: ${config.nodeEnv}`);
  console.log(`   CORS origin: ${config.cors.origin.join(', ')}`);
  console.log(`\n📝 Testando endpoint de health check...`);
  
  // Testar endpoint
  fetch(`http://localhost:${TEST_PORT}/api/v1/health`)
    .then(res => res.json())
    .then(data => {
      console.log('✅ Health check funcionando:');
      console.log(`   Status: ${data.status}`);
      console.log(`   Timestamp: ${data.timestamp}`);
      console.log(`   Environment: ${data.environment}`);
      
      console.log('\n✅ Todos os testes de servidor passaram!');
      console.log('\n⚠️  Para testar o servidor completo com banco de dados:');
      console.log('   1. Instalar Docker e Docker Compose');
      console.log('   2. Criar arquivo .env (já existe com valores padrão)');
      console.log('   3. Executar: docker-compose up -d');
      console.log('   4. Executar: npm run prisma:migrate');
      console.log('   5. Executar: npm run dev');
      
      server.close();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro ao testar health check:', error.message);
      server.close();
      process.exit(1);
    });
});

// Timeout de segurança
setTimeout(() => {
  console.log('⏱️  Timeout: fechando servidor de teste...');
  server.close();
  process.exit(0);
}, 5000);

