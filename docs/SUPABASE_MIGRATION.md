# Migração do Firebase para Supabase

## ✅ Concluído

A sincronização do Firebase foi removida e substituída pelo Supabase usando o MCP (Model Context Protocol).

## Mudanças Realizadas

### 1. Tabelas Criadas no Supabase

As seguintes tabelas foram criadas no banco de dados Supabase:

- `fisioq_profiles` - Perfis de usuários/profissionais
- `fisioq_patients` - Pacientes
- `fisioq_results` - Resultados de questionários
- `fisioq_questionnaires` - Questionários publicados
- `fisioq_drafts` - Rascunhos de questionários

Todas as tabelas incluem:
- Row Level Security (RLS) habilitado
- Políticas de segurança para que usuários só acessem seus próprios dados
- Índices para melhor performance
- Versionamento de dados (timestamp, hash, version)

### 2. Arquivos Criados

- `config/supabaseConfig.ts` - Configuração do cliente Supabase
- `services/supabaseSync.ts` - Serviço de sincronização com Supabase
- `hooks/useSupabaseSync.ts` - Hook React para sincronização

### 3. Arquivos Atualizados

- `components/ProfessionalView.tsx` - Substituído `useFirebaseSync` por `useSupabaseSync`
- `components/QuestionnairesView.tsx` - Substituído `useFirebaseSync` por `useSupabaseSync`
- `hooks/useSyncedStorage.ts` - Atualizado para usar Supabase
- `services/backgroundSync.ts` - Atualizado para usar Supabase

### 4. Arquivos Mantidos (mas não mais usados)

Os seguintes arquivos do Firebase foram mantidos para compatibilidade, mas não são mais usados:
- `services/firebaseSync.ts`
- `hooks/useFirebaseSync.ts`
- `config/firebaseConfig.ts`

## Configuração

### Variáveis de Ambiente

As credenciais do Supabase já estão configuradas no código com valores padrão. Para personalizar, adicione as seguintes variáveis ao seu arquivo `.env`:

```env
VITE_SUPABASE_URL=https://wahhoyqumzjbubecgvlh.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### Credenciais do Supabase

As credenciais já estão configuradas no código com valores padrão:
- **URL**: `https://wahhoyqumzjbubecgvlh.supabase.co`
- **Anon Key**: Configurada no código (pode ser sobrescrita via `.env`)

**Nota**: O `user_id` nas tabelas do Supabase deve ser um UUID válido. Se você estiver usando autenticação local (sem Supabase Auth), será necessário criar um UUID para cada usuário ou usar o Supabase Auth.

## Como Funciona

### Sincronização Automática

1. Quando um usuário está autenticado, os dados são automaticamente sincronizados com o Supabase
2. A sincronização acontece em segundo plano usando Background Sync API
3. Conflitos são detectados automaticamente e apresentados ao usuário para resolução

### Detecção de Conflitos

O sistema detecta conflitos comparando:
- Hash dos dados (local vs remoto)
- Timestamp das modificações
- Versão dos dados

### Resolução de Conflitos

O usuário pode escolher:
- **Local**: Manter a versão local
- **Remote**: Usar a versão remota
- **Merge**: Combinar ambas as versões (merge inteligente)

## Autenticação

O Supabase usa autenticação integrada com `auth.users`. Para usar autenticação local (sem Supabase Auth), o sistema continua funcionando com `localStorage` e `IndexedDB`.

## Mapeamento de Dados

### Pacientes (Patient → fisioq_patients)

| Campo Local | Campo Supabase | Observações |
|------------|----------------|-------------|
| `id` | `id` | ID único do paciente |
| `nome` | `name` | Nome do paciente |
| `idade` | `birth_date` | Calculado a partir da idade |
| `sexo` | `gender` | Gênero do paciente |
| `diagnostico` | `notes` | Armazenado em JSON junto com outros campos |
| `ladoAcometido` | `notes` (JSON) | Armazenado em JSON |
| `fisioterapeuta` | `notes` (JSON) | Armazenado em JSON |
| `medico` | `notes` (JSON) | Armazenado em JSON |

### Resultados (Result → fisioq_results)

| Campo Local | Campo Supabase | Observações |
|------------|----------------|-------------|
| `id` | `id` | ID único do resultado |
| `patientId` | `patient_id` | Referência ao paciente |
| `questionnaireId` | `questionnaire_id` | ID do questionário |
| `answers` | `answers` (JSONB) | Respostas do questionário |
| `score` | `score` (JSONB) | Pontuação calculada |

## Testes

Testes unitários foram criados em `tests/services/supabaseSync.test.ts`. Para executar:

```bash
npm test tests/services/supabaseSync.test.ts
```

## Próximos Passos

1. **Configurar autenticação Supabase** (opcional):
   - Habilitar autenticação por email/senha no Supabase
   - Integrar com o sistema de login existente
   - Converter `professionalId` local para UUID do Supabase Auth

2. **Migrar dados existentes** (se necessário):
   - Criar script de migração para transferir dados do localStorage para Supabase
   - Validar integridade dos dados após migração
   - Mapear IDs locais para UUIDs do Supabase

3. **Testes de Integração**:
   - Testar sincronização em diferentes cenários
   - Validar resolução de conflitos
   - Verificar performance com grandes volumes de dados
   - Testar offline/online sync

## Notas Importantes

- O Firebase ainda está instalado como dependência, mas não é mais usado para sincronização
- Os dados locais continuam sendo salvos em `localStorage` e `IndexedDB` como backup
- A sincronização com Supabase é opcional - o app funciona offline sem Supabase
- As políticas RLS garantem que cada usuário só acessa seus próprios dados

