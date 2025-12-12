# 🔥 Guia Rápido: Configurar Firebase com Gemini AI

## ✅ Passo 1: Configure sua API Key do Gemini

Você já colocou a API key, mas vamos garantir que está no lugar certo:

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione ou verifique se tem esta linha:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```

## 🚀 Passo 2: Execute o Script de Configuração

Execute no terminal:

```bash
npm run setup:firebase
```

Ou diretamente:

```bash
node scripts/configure-firebase.mjs
```

## 📋 O que o script faz:

1. ✅ Verifica se a API Key do Gemini está configurada
2. 🤖 Usa o Gemini para gerar instruções personalizadas
3. 📝 Salva as instruções em `FIREBASE_SETUP_INSTRUCTIONS.md`
4. ⚙️ Permite configurar as credenciais do Firebase diretamente

## 🎯 Próximos Passos:

1. **Siga as instruções geradas pelo Gemini** para criar o projeto no Firebase Console
2. **Obtenha as credenciais** do Firebase (apiKey, projectId, etc.)
3. **Execute o script novamente** e digite 's' quando perguntado se já tem as credenciais
4. **Cole as credenciais** quando solicitado

## 🔗 Links Úteis:

- Firebase Console: https://console.firebase.google.com/
- Google AI Studio: https://aistudio.google.com/apikey

---

**Dica:** Se você já tem as credenciais do Firebase, pode configurá-las diretamente no arquivo `config/firebaseConfig.ts` seguindo o formato:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

