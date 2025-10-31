# Instruções de Instalação - FisioQ

## Pré-requisitos

Para usar o FisioQ com todas as funcionalidades (incluindo autenticação do Google e sincronização Firebase), você precisa instalar o Node.js e npm.

### Instalar Node.js e npm

1. **Baixe o Node.js:**
   - Acesse: https://nodejs.org/
   - Baixe a versão **LTS** (recomendada)
   - Execute o instalador e siga as instruções
   - **IMPORTANTE:** Reinicie o terminal/PowerShell após a instalação

2. **Verifique a instalação:**
   ```bash
   node --version
   npm --version
   ```

   Você deve ver os números das versões instaladas.

## Instalação das Dependências

Após instalar o Node.js, execute no terminal (na pasta do projeto):

```bash
npm install
```

Isso instalará todas as dependências necessárias, incluindo:
- React
- Firebase
- jsPDF
- E outras bibliotecas

## Executar o Projeto

Após instalar as dependências, execute:

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173` (ou outra porta indicada pelo Vite).

## Usar sem Firebase

Se você não instalar o Firebase ou não configurar as credenciais:

- ✅ A aplicação **funcionará normalmente** usando apenas localStorage
- ✅ Todas as funcionalidades funcionarão (pacientes, questionários, relatórios)
- ❌ Login com Google **não estará disponível**
- ❌ Sincronização Firebase **não estará disponível**

## Configurar Firebase (Opcional)

Para habilitar autenticação do Google e sincronização Firebase, siga as instruções em `README_FIREBASE.md`.

## Problemas Comuns

### "npm não é reconhecido"

**Solução:** 
1. Instale o Node.js (veja acima)
2. **Reinicie o terminal/PowerShell**
3. Verifique se o Node.js foi adicionado ao PATH

### "Failed to resolve import firebase/auth"

**Solução:**
1. Execute `npm install` na pasta do projeto
2. Verifique se o `node_modules` foi criado
3. Reinicie o servidor de desenvolvimento (`npm run dev`)

### Erro ao instalar dependências

**Solução:**
1. Limpe o cache do npm: `npm cache clean --force`
2. Delete a pasta `node_modules` e o arquivo `package-lock.json` (se existir)
3. Execute `npm install` novamente

## Estrutura do Projeto

```
md-para-app_-clinical-questionnaires/
├── components/        # Componentes React
├── config/            # Configurações (Firebase)
├── data/              # Dados e questionários
├── hooks/             # React hooks
├── services/          # Serviços (Firebase sync)
├── utils/             # Utilitários
├── package.json        # Dependências
└── vite.config.ts      # Configuração do Vite
```

