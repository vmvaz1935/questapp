# Segurança - FisioQ

## Vulnerabilidades NPM

### Status Atual (2025-10-31)

- **Total**: 12 vulnerabilidades
  - **High**: 1
  - **Moderate**: 11

### Vulnerabilidades Identificadas

#### 1. DOMPurify (Moderate)
- **Pacote**: `dompurify` <3.2.4
- **Severidade**: Moderate
- **Descrição**: Permite Cross-site Scripting (XSS)
- **Pacotes Afetados**: `jspdf` ≤3.0.1
- **Fix Disponível**: `npm audit fix --force` (instala jspdf@3.0.3 - breaking change)
- **Recomendação**: 
  - Avaliar atualização para jspdf@3.0.3 (pode ter breaking changes)
  - Ou esperar por patch de dompurify que seja compatível com jspdf atual

#### 2. Undici (Moderate)
- **Pacote**: `undici` 6.0.0 - 6.21.1
- **Severidade**: Moderate
- **Descrição**: 
  - Uso de valores insuficientemente aleatórios
  - Denial of Service attack via bad certificate data
- **Pacotes Afetados**: Firebase (todas as versões atuais)
- **Fix Disponível**: `npm audit fix --force` (instala firebase@12.5.0 - breaking change)
- **Recomendação**:
  - Avaliar atualização para firebase@12.5.0 (pode ter breaking changes significativos)
  - Ou esperar por patch de undici que seja compatível com firebase atual
  - **Nota**: Firebase é opcional no FisioQ (aplicação funciona sem ele)

### Análise de Risco

#### Risco Alto
- **Nenhuma** vulnerabilidade de risco alto imediato detectada

#### Risco Moderado

1. **DOMPurify XSS**:
   - **Impacto**: XSS em contexto de geração de PDFs
   - **Mitigação**: 
     - jsPDF usado apenas para geração de PDFs (não renderiza HTML diretamente)
     - CSP configurada no HTML
   - **Risco Real**: Baixo (uso limitado)

2. **Undici Random/DoS**:
   - **Impacto**: 
     - Valores aleatórios insuficientemente aleatórios (Firebase Auth)
     - DoS via certificados malformados
   - **Mitigação**:
     - Firebase é opcional (aplicação funciona sem ele)
     - Vulnerabilidades afetam apenas comunicação Firebase
   - **Risco Real**: Baixo (Firebase opcional, não crítico para funcionamento básico)

### Ações Recomendadas

#### Imediatas (Não Críticas)
1. **Monitorar** atualizações de `dompurify` e `undici`
2. **Documentar** dependências e vulnerabilidades conhecidas
3. **Revisar** uso de jsPDF e Firebase para garantir uso seguro

#### Curto Prazo (1-2 meses)
1. **Avaliar** atualização para:
   - `jspdf@3.0.3` (avaliar breaking changes)
   - `firebase@12.5.0` (avaliar breaking changes significativos)

#### Médio Prazo (3-6 meses)
1. **Atualizar** dependências quando patches estáveis estiverem disponíveis
2. **Implementar** teste de segurança automatizado no CI/CD
3. **Revisar** uso de dependências opcionais (Firebase pode ser removido se não essencial)

### Estratégia de Correção

#### Opção 1: Correção Forçada (Breaking Changes)
```bash
npm audit fix --force
```
**Prós**:
- Corrige todas as vulnerabilidades
- Atualiza para versões mais recentes

**Contras**:
- Pode causar breaking changes (firebase@12.5.0, jspdf@3.0.3)
- Requer revisão completa do código
- Pode exigir atualizações em outros componentes

**Recomendação**: **Não fazer agora** - esperar por versões mais estáveis ou planejar atualização cuidadosa

#### Opção 2: Monitoramento e Patch Seletivo
**Ações**:
1. Monitorar atualizações de dompurify e undici
2. Aplicar patches quando disponíveis sem breaking changes
3. Revisar uso de jsPDF e Firebase

**Recomendação**: **Seguir esta abordagem** por enquanto

### Dependências Opcionais

#### Firebase
- **Status**: Opcional (aplicação funciona sem ele)
- **Uso**: Autenticação Google OAuth e sincronização na nuvem
- **Vulnerabilidades**: Apenas afetam comunicação Firebase
- **Ação**: Se Firebase não for essencial, considerar remoção

#### jsPDF
- **Status**: Usado para geração de PDFs
- **Vulnerabilidades**: XSS em contexto de geração de PDFs
- **Mitigação**: CSP configurada, uso limitado
- **Ação**: Monitorar atualizações, considerar alternativas se necessário

## Content Security Policy (CSP)

### Política Atual

Configurada no `index.html`:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com;
style-src 'self' 'unsafe-inline';
font-src 'self' data:;
img-src 'self' data: https:;
connect-src 'self' https://aistudiocdn.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com;
```

### Melhorias Futuras

- [ ] Remover `'unsafe-inline'` e `'unsafe-eval'` quando possível
- [ ] Implementar nonce para scripts inline
- [ ] Restringir CDNs ao mínimo necessário

## Criptografia

### Criptografia em Repouso

- **Algoritmo**: AES-GCM (256 bits)
- **Derivação de Chave**: PBKDF2 (100.000 iterações, SHA-256)
- **Salt**: Único por profissional (16 bytes)
- **IV**: Aleatório por operação (12 bytes)

### Implementação

- `services/encryption.ts`: Serviço de criptografia
- `services/database.ts`: IndexedDB com isolamento por profissional

## Armazenamento Seguro

### IndexedDB

- **Isolamento**: Um banco por profissional
- **Criptografia**: Dados sensíveis criptografados antes de armazenar
- **Migração**: Automática de localStorage para IndexedDB

### localStorage (Legacy)

- **Status**: Em migração
- **Uso**: Apenas durante período de transição
- **Remoção**: Automática após migração bem-sucedida

## Autenticação

### Métodos Suportados

1. **Local** (Email/Senha)
   - Hash: SHA-256 com salt
   - Armazenamento: IndexedDB criptografado

2. **Google OAuth** (Firebase Auth)
   - Opcional (requer configuração)
   - Dados sincronizados via Firestore (opcional)

### Segurança de Sessão

- **Expiração**: Sessões expiram após inatividade
- **Reautenticação**: Necessária para ações sensíveis
- **SignOut**: Limpa todos os dados locais

## LGPD Compliance

### Conformidade

- **Consentimento**: Obrigatório antes de uso
- **Armazenamento**: Dados criptografados em repouso
- **Acesso**: Apenas profissional autenticado
- **Exclusão**: Interface para solicitar exclusão de dados

### Documentação

- `docs/LGPD_DATA_FLOW.md`: Fluxo completo de dados
- Consent Log: Armazenado permanentemente para auditoria

## Recomendações

1. **Manter dependências atualizadas**
   - Revisar `npm audit` regularmente (mensal)
   - Atualizar dependências conforme necessário
   - Documentar breaking changes antes de atualizar

2. **Monitorar vulnerabilidades**
   - Configurar alertas do npm (Dependabot no GitHub)
   - Revisar relatórios de segurança mensalmente

3. **Revisar CSP regularmente**
   - Reduzir permissões ao mínimo necessário
   - Remover CDNs não essenciais
   - Implementar nonce para scripts inline

4. **Auditoria de segurança**
   - Executar testes de penetração (anual)
   - Revisar logs de acesso (mensal)
   - Implementar monitoramento de segurança

5. **Backup e recuperação**
   - Implementar estratégia de backup
   - Testar processo de recuperação (trimestral)

## Contatos

- **DPO**: [A definir]
- **Segurança**: [A definir]

## Revisões

- **Última Revisão**: 2025-10-31
- **Próxima Revisão**: 2025-11-30
