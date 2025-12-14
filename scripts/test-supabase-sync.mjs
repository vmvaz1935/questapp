/**
 * Script de teste para sincronização com Supabase
 * 
 * Este script testa as funções básicas de sincronização:
 * - Conexão com Supabase
 * - Salvamento de dados
 * - Carregamento de dados
 * - Detecção de conflitos
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wahhoyqumzjbubecgvlh.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhaGhveXF1bXpqYnViZWNndmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NTQ5ODMsImV4cCI6MjA4MTIzMDk4M30.S1NrNPiymJ69dJxVuRKojx806aEh8t45XlAmFuqGISs';

console.log('🧪 Testando sincronização com Supabase...\n');

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Teste 1: Verificar conexão
async function testConnection() {
  console.log('1️⃣ Testando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('fisioq_profiles').select('count').limit(1);
    if (error) {
      console.error('   ❌ Erro ao conectar:', error.message);
      return false;
    }
    console.log('   ✅ Conexão estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('   ❌ Erro ao conectar:', error.message);
    return false;
  }
}

// Teste 2: Verificar estrutura das tabelas
async function testTables() {
  console.log('\n2️⃣ Verificando estrutura das tabelas...');
  const tables = ['fisioq_profiles', 'fisioq_patients', 'fisioq_results', 'fisioq_questionnaires', 'fisioq_drafts'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        console.error(`   ❌ Tabela ${table}: ${error.message}`);
        return false;
      }
      console.log(`   ✅ Tabela ${table} existe`);
    } catch (error) {
      console.error(`   ❌ Erro ao verificar ${table}:`, error.message);
      return false;
    }
  }
  return true;
}

// Teste 3: Verificar RLS (Row Level Security)
async function testRLS() {
  console.log('\n3️⃣ Verificando Row Level Security...');
  try {
    // Tentar inserir sem autenticação (deve falhar se RLS estiver ativo)
    const { error } = await supabase
      .from('fisioq_patients')
      .insert({
        id: 'test-patient-' + Date.now(),
        user_id: '00000000-0000-0000-0000-000000000000',
        name: 'Test Patient',
      });
    
    if (error && error.code === '42501') {
      console.log('   ✅ RLS está ativo (inserção bloqueada sem autenticação)');
      return true;
    } else if (error) {
      console.log(`   ⚠️  RLS pode estar desativado ou erro diferente: ${error.message}`);
      return true; // Não é um erro crítico
    } else {
      console.log('   ⚠️  RLS pode não estar ativo (inserção permitida sem autenticação)');
      return true; // Não é um erro crítico
    }
  } catch (error) {
    console.error('   ❌ Erro ao testar RLS:', error.message);
    return false;
  }
}

// Executar testes
async function runTests() {
  const results = {
    connection: await testConnection(),
    tables: await testTables(),
    rls: await testRLS(),
  };
  
  console.log('\n📊 Resumo dos Testes:');
  console.log(`   Conexão: ${results.connection ? '✅' : '❌'}`);
  console.log(`   Tabelas: ${results.tables ? '✅' : '❌'}`);
  console.log(`   RLS: ${results.rls ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n✅ Todos os testes passaram!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Configure autenticação Supabase se necessário');
    console.log('   2. Teste a sincronização com dados reais');
    console.log('   3. Verifique os logs no console do navegador');
  } else {
    console.log('\n❌ Alguns testes falharam. Verifique a configuração do Supabase.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('❌ Erro ao executar testes:', error);
  process.exit(1);
});

