#!/usr/bin/env node

/**
 * Script para configurar Firebase usando Gemini AI
 * Este script usa a API do Gemini para gerar instruções e ajudar na configuração
 */

import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Cores para terminal
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

// Ler variáveis de ambiente do .env
function loadEnv() {
  const env = { ...process.env };
  
  // Tentar ler do arquivo .env
  const envPath = join(projectRoot, ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const keyTrimmed = key.trim();
          const valueTrimmed = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          env[keyTrimmed] = valueTrimmed;
        }
      }
    });
  }

  return env;
}

// Ler input do usuário
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

// Gerar instruções com Gemini
async function generateInstructions(projectName) {
  const env = loadEnv();
  const apiKey = env.GEMINI_API_KEY || env.API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não encontrada no arquivo .env");
  }

  log("\n🤖 Conectando ao Gemini AI...", colors.cyan);
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Gere instruções passo a passo MUITO DETALHADAS em português brasileiro para configurar o Firebase para o projeto "${projectName}".

O projeto é um aplicativo React/TypeScript que precisa de:
- Autenticação com Google
- Firestore Database para sincronização de dados
- Regras de segurança adequadas

INCLUA:
1. Link direto para criar projeto no Firebase Console
2. Passo a passo EXATO de como criar o projeto
3. Como habilitar autenticação Google (com screenshots descritivos)
4. Como criar o Firestore Database
5. Como obter as credenciais (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
6. Regras de segurança do Firestore (código completo)
7. Como adicionar as credenciais no arquivo firebaseConfig.ts

Seja MUITO específico e prático. Formate a resposta de forma clara e organizada.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text.trim();
  } catch (error) {
    throw new Error(`Erro ao gerar instruções: ${error.message}`);
  }
}

// Atualizar firebaseConfig.ts
function updateFirebaseConfig(config) {
  const configPath = join(projectRoot, "config", "firebaseConfig.ts");
  
  if (!existsSync(configPath)) {
    throw new Error("Arquivo config/firebaseConfig.ts não encontrado");
  }

  let content = readFileSync(configPath, "utf-8");

  // Substituir valores
  if (config.apiKey) {
    content = content.replace(/apiKey:\s*"[^"]*"/, `apiKey: "${config.apiKey}"`);
  }
  if (config.projectId) {
    content = content.replace(/projectId:\s*"[^"]*"/, `projectId: "${config.projectId}"`);
    content = content.replace(/authDomain:\s*"[^"]*"/, `authDomain: "${config.projectId}.firebaseapp.com"`);
    content = content.replace(/storageBucket:\s*"[^"]*"/, `storageBucket: "${config.projectId}.appspot.com"`);
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

// Main
async function main() {
  try {
    log("\n🔥 Configuração do Firebase com Gemini AI", colors.bright);
    log("=" .repeat(50), colors.cyan);

    // Verificar API key
    const env = loadEnv();
    const apiKey = env.GEMINI_API_KEY || env.API_KEY || env.VITE_GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key" || apiKey === "your-api-key-here") {
      log("\n❌ Erro: GEMINI_API_KEY não encontrada ou não configurada", colors.red);
      log("\n   Opções:", colors.yellow);
      log("   1. Crie/edite o arquivo .env na raiz do projeto", colors.yellow);
      log("   2. Adicione: GEMINI_API_KEY=sua_chave_aqui", colors.yellow);
      log("   3. Ou defina a variável de ambiente: $env:GEMINI_API_KEY='sua_chave'", colors.yellow);
      log("\n   Obtenha sua chave em: https://aistudio.google.com/apikey", colors.cyan);
      process.exit(1);
    }

    log("✅ API Key do Gemini encontrada", colors.green);

    // Perguntar nome do projeto
    const projectName = await question("\n📝 Nome do projeto Firebase (ou Enter para 'FisioQ'): ");
    const finalProjectName = projectName.trim() || "FisioQ";

    // Gerar instruções
    log("\n📚 Gerando instruções personalizadas com Gemini...", colors.cyan);
    const instructions = await generateInstructions(finalProjectName);

    // Salvar instruções em arquivo
    const instructionsPath = join(projectRoot, "FIREBASE_SETUP_INSTRUCTIONS.md");
    writeFileSync(instructionsPath, instructions, "utf-8");
    log(`\n✅ Instruções salvas em: ${instructionsPath}`, colors.green);

    // Mostrar instruções
    log("\n" + "=".repeat(50), colors.cyan);
    log("📖 INSTRUÇÕES GERADAS PELO GEMINI:", colors.bright);
    log("=".repeat(50), colors.cyan);
    console.log(instructions);

    // Perguntar se já tem as credenciais
    log("\n" + "=".repeat(50), colors.cyan);
    const hasCredentials = await question("\n❓ Você já tem as credenciais do Firebase? (s/n): ");
    
    if (hasCredentials.toLowerCase() === "s" || hasCredentials.toLowerCase() === "sim") {
      log("\n📝 Vamos configurar o firebaseConfig.ts:", colors.cyan);
      
      const config = {};
      config.apiKey = await question("API Key: ");
      config.projectId = await question("Project ID: ");
      config.authDomain = await question(`Auth Domain (ou Enter para ${config.projectId}.firebaseapp.com): `) || `${config.projectId}.firebaseapp.com`;
      config.storageBucket = await question(`Storage Bucket (ou Enter para ${config.projectId}.appspot.com): `) || `${config.projectId}.appspot.com`;
      config.messagingSenderId = await question("Messaging Sender ID: ");
      config.appId = await question("App ID: ");

      updateFirebaseConfig(config);
      log("\n✅ Firebase configurado com sucesso!", colors.green);
    } else {
      log("\n📋 Siga as instruções acima para obter as credenciais do Firebase.", colors.yellow);
      log("   Depois, execute este script novamente e digite 's' quando perguntado.", colors.yellow);
    }

    log("\n✨ Processo concluído!", colors.green);
    log("\n📄 Instruções completas salvas em: FIREBASE_SETUP_INSTRUCTIONS.md", colors.cyan);

  } catch (error) {
    log(`\n❌ Erro: ${error.message}`, colors.red);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

