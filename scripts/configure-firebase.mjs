#!/usr/bin/env node

/**
 * Script interativo para configurar Firebase usando Gemini AI
 */

import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function question(query) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getGeminiApiKey() {
  // Tentar ler do .env
  const envPath = join(projectRoot, ".env");
  let apiKey = null;

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GEMINI_API_KEY=") || trimmed.startsWith("API_KEY=")) {
        const match = trimmed.match(/=(.+)$/);
        if (match) {
          apiKey = match[1].trim().replace(/^["']|["']$/g, "");
          if (apiKey && apiKey !== "your_gemini_api_key" && apiKey !== "your-api-key-here") {
            return apiKey;
          }
        }
      }
    }
  }

  // Se não encontrou, pedir ao usuário
  log("\n🔑 API Key do Gemini não encontrada no .env", colors.yellow);
  log("   Obtenha sua chave em: https://aistudio.google.com/apikey", colors.cyan);
  apiKey = await question("\n📝 Digite sua GEMINI_API_KEY: ");

  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API Key é obrigatória");
  }

  // Salvar no .env
  if (!existsSync(envPath)) {
    writeFileSync(envPath, `GEMINI_API_KEY=${apiKey.trim()}\n`, "utf-8");
  } else {
    appendFileSync(envPath, `\nGEMINI_API_KEY=${apiKey.trim()}\n`, "utf-8");
  }
  log("✅ API Key salva no arquivo .env", colors.green);

  return apiKey.trim();
}

async function generateInstructions(apiKey, projectName) {
  log("\n🤖 Gerando instruções com Gemini AI...", colors.cyan);

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Gere instruções passo a passo MUITO DETALHADAS em português brasileiro para configurar o Firebase para o projeto "${projectName}".

O projeto é um aplicativo React/TypeScript que precisa de:
- Autenticação com Google
- Firestore Database para sincronização de dados
- Regras de segurança adequadas

INCLUA:
1. Link direto: https://console.firebase.google.com/
2. Passo a passo EXATO de como criar o projeto
3. Como habilitar autenticação Google (com descrições detalhadas)
4. Como criar o Firestore Database
5. Como obter as credenciais (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
6. Regras de segurança do Firestore (código completo)
7. Como adicionar as credenciais no arquivo firebaseConfig.ts

Seja MUITO específico e prático. Formate a resposta de forma clara e organizada.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.3 },
    });

    return response.text.trim();
  } catch (error) {
    throw new Error(`Erro ao gerar instruções: ${error.message}`);
  }
}

function updateFirebaseConfig(config) {
  const configPath = join(projectRoot, "config", "firebaseConfig.ts");
  
  if (!existsSync(configPath)) {
    throw new Error("Arquivo config/firebaseConfig.ts não encontrado");
  }

  let content = readFileSync(configPath, "utf-8");

  if (config.apiKey) {
    content = content.replace(/apiKey:\s*"[^"]*"/, `apiKey: "${config.apiKey}"`);
  }
  if (config.projectId) {
    content = content.replace(/projectId:\s*"[^"]*"/, `projectId: "${config.projectId}"`);
    if (!config.authDomain) {
      content = content.replace(/authDomain:\s*"[^"]*"/, `authDomain: "${config.projectId}.firebaseapp.com"`);
    }
    if (!config.storageBucket) {
      content = content.replace(/storageBucket:\s*"[^"]*"/, `storageBucket: "${config.projectId}.appspot.com"`);
    }
  }
  if (config.authDomain) {
    content = content.replace(/authDomain:\s*"[^"]*"/, `authDomain: "${config.authDomain}"`);
  }
  if (config.storageBucket) {
    content = content.replace(/storageBucket:\s*"[^"]*"/, `storageBucket: "${config.storageBucket}"`);
  }
  if (config.messagingSenderId) {
    content = content.replace(/messagingSenderId:\s*"[^"]*"/, `messagingSenderId: "${config.messagingSenderId}"`);
  }
  if (config.appId) {
    content = content.replace(/appId:\s*"[^"]*"/, `appId: "${config.appId}"`);
  }

  writeFileSync(configPath, content, "utf-8");
  log("✅ Arquivo firebaseConfig.ts atualizado!", colors.green);
}

async function main() {
  try {
    log("\n🔥 Configuração do Firebase com Gemini AI", colors.bright);
    log("=".repeat(50), colors.cyan);

    // Obter API key
    const apiKey = await getGeminiApiKey();
    log("✅ API Key configurada", colors.green);

    // Nome do projeto
    const projectName = await question("\n📝 Nome do projeto Firebase (Enter para 'FisioQ'): ");
    const finalProjectName = projectName.trim() || "FisioQ";

    // Gerar instruções
    const instructions = await generateInstructions(apiKey, finalProjectName);

    // Salvar instruções
    const instructionsPath = join(projectRoot, "FIREBASE_SETUP_INSTRUCTIONS.md");
    writeFileSync(instructionsPath, instructions, "utf-8");
    log(`\n✅ Instruções salvas em: FIREBASE_SETUP_INSTRUCTIONS.md`, colors.green);

    // Mostrar instruções
    log("\n" + "=".repeat(50), colors.cyan);
    log("📖 INSTRUÇÕES GERADAS PELO GEMINI:", colors.bright);
    log("=".repeat(50), colors.cyan);
    console.log(instructions);

    // Perguntar se tem credenciais
    log("\n" + "=".repeat(50), colors.cyan);
    const hasCredentials = await question("\n❓ Você já tem as credenciais do Firebase? (s/n): ");
    
    if (hasCredentials.toLowerCase() === "s" || hasCredentials.toLowerCase() === "sim") {
      log("\n📝 Configure as credenciais:", colors.cyan);
      
      const config = {};
      config.apiKey = await question("API Key: ");
      config.projectId = await question("Project ID: ");
      config.authDomain = await question(`Auth Domain (Enter para ${config.projectId}.firebaseapp.com): `) || `${config.projectId}.firebaseapp.com`;
      config.storageBucket = await question(`Storage Bucket (Enter para ${config.projectId}.appspot.com): `) || `${config.projectId}.appspot.com`;
      config.messagingSenderId = await question("Messaging Sender ID: ");
      config.appId = await question("App ID: ");

      updateFirebaseConfig(config);
      log("\n✅ Firebase configurado com sucesso!", colors.green);
    } else {
      log("\n📋 Siga as instruções acima para obter as credenciais.", colors.yellow);
      log("   Depois, execute: npm run setup:firebase", colors.yellow);
    }

    log("\n✨ Processo concluído!", colors.green);

  } catch (error) {
    log(`\n❌ Erro: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();

