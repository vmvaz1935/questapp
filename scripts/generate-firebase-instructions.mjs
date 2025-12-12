#!/usr/bin/env node

/**
 * Script para gerar instruções do Firebase usando Gemini (não-interativo)
 */

import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

function loadEnv() {
  const env = { ...process.env };
  const envPath = join(projectRoot, ".env");
  
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
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

async function main() {
  try {
    console.log("\n🔥 Gerando instruções do Firebase com Gemini AI...\n");

    const env = loadEnv();
    const apiKey = env.GEMINI_API_KEY || env.API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não encontrada no arquivo .env");
    }

    const ai = new GoogleGenAI({ apiKey });
    const projectName = "FisioQ";

    console.log("🤖 Conectando ao Gemini...");

    const prompt = `Gere instruções passo a passo MUITO DETALHADAS em português brasileiro para configurar o Firebase para o projeto "${projectName}".

O projeto é um aplicativo React/TypeScript que precisa de:
- Autenticação com Google
- Firestore Database para sincronização de dados
- Regras de segurança adequadas

INCLUA:
1. Link direto: https://console.firebase.google.com/
2. Passo a passo EXATO de como criar o projeto (com nomes de botões e menus)
3. Como habilitar autenticação Google (com descrições detalhadas de cada passo)
4. Como criar o Firestore Database (modo de teste inicialmente)
5. Como obter as credenciais (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) - onde encontrar cada uma
6. Regras de segurança do Firestore (código completo para copiar)
7. Como adicionar as credenciais no arquivo firebaseConfig.ts (caminho exato do arquivo)

Seja MUITO específico e prático. Formate a resposta de forma clara e organizada com títulos e subtítulos.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.3 },
    });

    const instructions = response.text.trim();

    // Salvar instruções
    const instructionsPath = join(projectRoot, "FIREBASE_SETUP_INSTRUCTIONS.md");
    writeFileSync(instructionsPath, instructions, "utf-8");

    console.log("✅ Instruções geradas com sucesso!");
    console.log(`📄 Salvas em: FIREBASE_SETUP_INSTRUCTIONS.md\n`);
    console.log("=" .repeat(60));
    console.log(instructions);
    console.log("=" .repeat(60));
    console.log("\n✨ Próximo passo: Siga as instruções acima para configurar o Firebase!");

  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
