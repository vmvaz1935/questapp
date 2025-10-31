# Configuração do Firebase para FisioQ

Este documento explica como configurar o Firebase para habilitar autenticação do Google e sincronização de dados.

## Passo 1: Criar Projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto" ou selecione um projeto existente
3. Siga as instruções para criar o projeto

## Passo 2: Configurar Autenticação do Google

1. No Firebase Console, vá em **Authentication**
2. Clique em **Get Started**
3. Vá na aba **Sign-in method**
4. Clique em **Google** e habilite
5. Configure o email de suporte e o nome do projeto público
6. Clique em **Save**

## Passo 3: Criar Aplicativo Web

1. No Firebase Console, clique no ícone de **Web** (</>)
2. Registre seu aplicativo com um nome (ex: "FisioQ Web")
3. Copie as credenciais de configuração

## Passo 4: Configurar Firestore Database

1. No Firebase Console, vá em **Firestore Database**
2. Clique em **Create database**
3. Escolha **Start in test mode** (para desenvolvimento) ou configure regras de segurança
4. Escolha a localização do banco de dados

## Passo 5: Configurar Regras de Segurança (Firestore)

Cole as seguintes regras no Firestore Rules para permitir que usuários acessem apenas seus próprios dados:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir que usuários leiam e escrevam apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Passo 6: Adicionar Credenciais ao Projeto

1. Abra o arquivo `config/firebaseConfig.ts`
2. Substitua as credenciais `YOUR_*` pelas suas credenciais do Firebase:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

## Passo 7: Instalar Dependências

Execute no terminal:
```bash
npm install
```

## Como Funciona

- **Sem Firebase configurado**: A aplicação funciona normalmente usando apenas localStorage
- **Com Firebase configurado**:
  - Login com Google disponível como opção
  - Dados são salvos em localStorage E Firebase
  - Sincronização automática entre dispositivos
  - Backup na nuvem

## Estrutura de Dados no Firebase

Os dados são salvos no Firestore na seguinte estrutura:

```
users/
  {userId}/
    patients: [...]
    results: [...]
    questionnaires: [...]
    profiles: [...]
    lastUpdated: timestamp
```

Cada usuário autenticado com Google só pode acessar seus próprios dados.

## Segurança

- As senhas locais são hasheadas usando SHA-256
- Login com Google usa OAuth 2.0 do Firebase
- Dados no Firebase são protegidos por regras de segurança
- Todos os dados são criptografados em trânsito (HTTPS)

