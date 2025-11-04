// Script simples para testar se o servidor inicia corretamente
// Não requer banco de dados

import { config } from './src/config/env.js';
import logger from './src/utils/logger.js';

console.log('🧪 Testando configuração do servidor...\n');

// Testar configuração
console.log('✅ Configurações carregadas:');
console.log(`   NODE_ENV: ${config.nodeEnv}`);
console.log(`   PORT: ${config.port}`);
console.log(`   DATABASE_URL: ${config.database.url ? '✓ Configurado' : '✗ Não configurado'}`);
console.log(`   JWT_SECRET: ${config.jwt.secret ? '✓ Configurado' : '✗ Não configurado'}`);
console.log(`   CORS_ORIGIN: ${config.cors.origin.join(', ')}`);

// Testar logger
console.log('\n✅ Logger funcionando:');
logger.info('Teste de log - INFO');
logger.warn('Teste de log - WARN');
logger.error('Teste de log - ERROR');

// Testar JWT utilities
import { generateAccessToken, generateRefreshToken, verifyToken } from './src/utils/jwt.js';

console.log('\n✅ Testando JWT utilities:');
try {
  const payload = {
    professionalId: 'test-id',
    email: 'test@example.com',
    planType: 'FREE',
  };
  
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  
  console.log(`   Access Token gerado: ${accessToken.substring(0, 20)}...`);
  console.log(`   Refresh Token gerado: ${refreshToken.substring(0, 20)}...`);
  
  const verified = verifyToken(accessToken);
  console.log(`   Token verificado: ${verified.email}`);
  
  console.log('\n✅ Todos os testes básicos passaram!');
  console.log('\n⚠️  Nota: Para testar o servidor completo, você precisa:');
  console.log('   1. Instalar Docker e Docker Compose');
  console.log('   2. Criar arquivo .env com as variáveis de ambiente');
  console.log('   3. Executar: docker-compose up -d');
  console.log('   4. Executar: npm run prisma:migrate');
  console.log('   5. Executar: npm run dev');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Erro nos testes:', error.message);
  process.exit(1);
}

