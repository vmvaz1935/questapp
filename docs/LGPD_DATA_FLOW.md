# Fluxo de Dados LGPD - FisioQ

## Visão Geral

Este documento descreve o fluxo de dados pessoais sensíveis (DPS) no FisioQ, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).

## Dados Coletados

### Categorias de Dados

1. **Dados de Profissionais**
   - Nome
   - E-mail
   - Hash de senha (SHA-256 com salt)
   - Plano de assinatura (free/pro)
   - Timestamp de inscrição

2. **Dados de Pacientes**
   - Nome completo
   - Idade
   - Sexo
   - Diagnóstico
   - Lado acometido
   - Fisioterapeuta responsável
   - Médico responsável

3. **Dados de Questionários**
   - Respostas a questionários clínicos
   - Pontuações e resultados
   - Datas de avaliação
   - Comparações temporais

4. **Dados de Consentimento**
   - Timestamp de consentimento
   - Versão do termo aceita
   - Meio de coleta (formulário, modal)
   - Hash do termo para auditoria

## Fluxo de Dados

### 1. Coleta

**Ponto de Entrada:**
- Formulário de cadastro/registro (`components/Login.tsx`)
- Modal de consentimento LGPD (`components/ConsentLGPD.tsx`)
- Formulário de cadastro de pacientes (`components/ProfessionalView.tsx`)
- Aplicação de questionários (`components/QuestionnaireForm.tsx`)

**Meios:**
- Formulários web locais
- Autenticação via Google (Firebase Auth, opcional)
- Armazenamento local (IndexedDB com criptografia)

### 2. Processamento

**Local:**
- Dados processados localmente no navegador
- Criptografia em repouso usando AES-GCM (256 bits)
- Derivação de chave via PBKDF2 (100.000 iterações, SHA-256)
- Armazenamento em IndexedDB (isolado por profissional)

**Cloud (Opcional - Firebase):**
- Sincronização opcional com Firebase Firestore
- Dados criptografados antes de envio (se habilitado)
- Autenticação via Google OAuth (opcional)

### 3. Armazenamento

**IndexedDB (Principal):**
- Banco de dados local por profissional
- Isolamento por `professionalId`
- Criptografia em repouso para dados sensíveis
- Estrutura:
  ```
  FisioQ_{professionalId}
    ├── patients (pacientes)
    ├── questionnaires (questionários)
    ├── results (resultados)
    ├── profiles (perfis)
    └── consents (consentimentos)
  ```

**localStorage (Legacy/Migração):**
- Usado apenas durante período de migração
- Dados migrados automaticamente para IndexedDB
- Removidos após migração bem-sucedida

**Firebase Firestore (Opcional):**
- Sincronização na nuvem (requer configuração explícita)
- Dados criptografados antes de envio

### 4. Uso

**Finalidades:**
1. Gerenciamento de pacientes e histórico clínico
2. Aplicação de questionários validados
3. Geração de relatórios e comparações temporais
4. Análise de evolução do tratamento

**Base Legal (LGPD Art. 7º):**
- Consentimento do titular (Art. 7º, I)
- Execução de contrato (Art. 7º, V)
- Legítimo interesse (Art. 7º, IX) - para análise estatística agregada

### 5. Retenção

**Período:**
- Dados mantidos enquanto conta ativa
- Dados de pacientes: mantidos indefinidamente (necessidade clínica)
- Consentimentos: mantidos permanentemente para auditoria

**Limpeza Automática:**
- Contas inativas por mais de 3 anos podem ser deletadas
- Solicitação de exclusão por titular (Art. 18, VI da LGPD)

### 6. Eliminação

**Solicitação de Exclusão:**
- Interface para solicitar exclusão de dados
- Processo: `components/PrivacyPolicy.tsx` → Botão "Excluir Dados"
- Tempo de processamento: até 15 dias úteis

**Processo:**
1. Validação de identidade do solicitante
2. Backup de dados críticos (opcional, com consentimento)
3. Exclusão física dos dados:
   - IndexedDB: limpeza de todos os registros
   - Firebase: exclusão de documentos relacionados
   - localStorage: limpeza de chaves relacionadas
4. Confirmação por e-mail

**Dados que NÃO são excluídos:**
- Logs de consentimento (necessário para auditoria)
- Dados agregados/anonimizados (para estatísticas)

## Segurança

### Criptografia

**Em Repouso:**
- Algoritmo: AES-GCM (256 bits)
- Derivação de chave: PBKDF2 (100.000 iterações, SHA-256)
- Salt único por profissional
- IV aleatório por operação

**Em Trânsito (Firebase):**
- TLS 1.3 (padrão Firebase)
- Dados criptografados antes de envio

### Controles de Acesso

- Isolamento por `professionalId` (um profissional não acessa dados de outro)
- Autenticação obrigatória (local ou Google OAuth)
- Sessões expiram após inatividade
- Reautenticação para ações sensíveis

## Consentimento

### Consent Log

**Estrutura:**
```typescript
{
  professionalId: string;
  timestamp: string; // ISO 8601
  version: string; // Versão do termo (ex: "1.0")
  hash: string; // Hash SHA-256 do termo para auditoria
  method: 'modal' | 'form' | 'api'; // Meio de coleta
  accepted: boolean;
  ip?: string; // Opcional, com consentimento específico
}
```

**Armazenamento:**
- IndexedDB `consents` table
- Não criptografado (necessário para auditoria)
- Nunca excluído (exceto por ordem judicial)

### Revogação

- Consentimento pode ser revogado a qualquer momento
- Interface: `components/PrivacyPolicy.tsx`
- Efeito: exclusão de dados (conforme Art. 18, VI)

## Direitos do Titular (LGPD Art. 18)

### Implementação

1. **Confirmação de Existência** (Art. 18, I)
   - Interface: Dashboard mostra número de pacientes/questionários
   - API: Endpoint `/api/data/summary` (se backend implementado)

2. **Acesso aos Dados** (Art. 18, II)
   - Interface: Exportar dados em JSON/CSV
   - Local: Botão "Exportar Dados" em `components/ReportView.tsx`

3. **Correção** (Art. 18, III)
   - Interface: Edição de dados em `components/ProfessionalView.tsx`
   - Histórico de alterações mantido

4. **Anonimização** (Art. 18, IV)
   - Funcionalidade futura: "Anonimizar Paciente"
   - Remove identificadores pessoais, mantém dados clínicos

5. **Portabilidade** (Art. 18, V)
   - Exportação em formato estruturado (JSON)
   - Compatível com padrões de interoperabilidade

6. **Exclusão** (Art. 18, VI)
   - Interface: `components/PrivacyPolicy.tsx`
   - Processo automatizado

7. **Informação sobre Compartilhamento** (Art. 18, VII)
   - Política de Privacidade detalha compartilhamento
   - Lista de terceiros (Firebase, Google Analytics se usado)

8. **Informação sobre Consentimento** (Art. 18, VIII)
   - Consent Log acessível ao titular
   - Mostra histórico de consentimentos

## Compartilhamento com Terceiros

### Firebase (Google)

**Dados Compartilhados:**
- Autenticação (Google OAuth): e-mail, nome, foto
- Firestore (opcional): dados sincronizados

**Finalidade:**
- Autenticação de usuários
- Sincronização entre dispositivos

**Base Legal:**
- Consentimento explícito (termo de uso)
- Execução de contrato (serviço de sincronização)

**Proteções:**
- Dados criptografados antes de envio
- Firebase configurado com regras de segurança

### Google Analytics / Plausible (Futuro)

**Dados Compartilhados:**
- Métricas agregadas e anonimizadas
- Nenhum dado pessoal identificável

## Registro de Atividades (Art. 37 da LGPD)

### Logs Mantidos

1. **Acesso a Dados:**
   - Timestamp de login
   - Ações de leitura/escrita (futuro: implementar auditoria detalhada)

2. **Alterações de Dados:**
   - Histórico de modificações (mantido por 2 anos)

3. **Exclusões:**
   - Timestamp e justificativa (mantido permanentemente)

## Responsabilidades

### Controlador

- **Identificação:** FisioQ Beta
- **Responsável:** [Nome do responsável / empresa]
- **Contato DPO:** [E-mail para questões LGPD]

### Encarregado de Dados (DPO)

- **Funções:**
  - Receber reclamações de titulares
  - Orientar funcionários sobre práticas de proteção de dados
  - Executar ações de segurança da informação

## Incidentes de Segurança

### Notificação (Art. 48 da LGPD)

- Autoridade Nacional (ANPD): até 72h após conhecimento
- Titulares afetados: conforme avaliação de risco
- Processo documentado em `docs/INCIDENT_RESPONSE.md` (a criar)

## Revisões

- **Versão:** 1.0
- **Última Atualização:** 2025-10-31
- **Próxima Revisão:** 2025-11-30

## Referências

- Lei Geral de Proteção de Dados (Lei 13.709/2018)
- Resolução ANPD 1/2021 (Regulamentação da LGPD)
- ISO/IEC 27001 (Gestão de Segurança da Informação)

