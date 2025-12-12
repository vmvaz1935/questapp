import { GoogleGenAI } from "@google/genai";

const FIREBASE_CONFIG_PROMPT = `
Você é um assistente especializado em configuração do Firebase. Sua tarefa é ajudar a configurar o Firebase para um aplicativo web React/TypeScript.

Quando receber informações sobre um projeto Firebase (como nome do projeto, URL, ou outras informações), você deve:
1. Gerar instruções claras e passo a passo para configurar o Firebase
2. Validar configurações existentes do Firebase
3. Sugerir melhorias de segurança
4. Gerar código TypeScript para configuração do Firebase quando apropriado

Sempre retorne respostas em português brasileiro e seja específico e prático.
`;

interface FirebaseConfigInfo {
  projectName?: string;
  projectId?: string;
  apiKey?: string;
  authDomain?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

interface FirebaseConfigResponse {
  isValid: boolean;
  config?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  instructions?: string[];
  securityRecommendations?: string[];
  codeSnippet?: string;
  errors?: string[];
}

/**
 * Usa o Gemini para validar e gerar configuração do Firebase
 */
export async function validateFirebaseConfigWithGemini(
  config: FirebaseConfigInfo
): Promise<FirebaseConfigResponse> {
  if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada. Configure no arquivo .env");
  }

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });

    const prompt = `
Analise a seguinte configuração do Firebase e forneça:
1. Se a configuração está válida (todos os campos necessários preenchidos)
2. Instruções para obter as credenciais faltantes
3. Recomendações de segurança
4. Um código TypeScript pronto para uso

Configuração fornecida:
${JSON.stringify(config, null, 2)}

Retorne um JSON com a seguinte estrutura:
{
  "isValid": boolean,
  "config": { ... } (se válido),
  "instructions": ["passo 1", "passo 2", ...],
  "securityRecommendations": ["recomendação 1", ...],
  "codeSnippet": "código TypeScript",
  "errors": ["erro 1", ...] (se houver)
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: FIREBASE_CONFIG_PROMPT,
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

    const rawJsonString = response.text.trim();
    const parsedResponse = JSON.parse(rawJsonString) as FirebaseConfigResponse;

    return parsedResponse;
  } catch (error) {
    console.error("Erro ao validar configuração do Firebase com Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`Falha ao validar configuração: ${error.message}`);
    }
    throw new Error("Erro desconhecido ao validar configuração do Firebase.");
  }
}

/**
 * Usa o Gemini para gerar instruções personalizadas de configuração do Firebase
 */
export async function generateFirebaseSetupInstructions(
  projectName: string,
  useCase: string = "autenticação e sincronização de dados"
): Promise<string> {
  if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada. Configure no arquivo .env");
  }

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });

    const prompt = `
Gere instruções passo a passo detalhadas em português brasileiro para configurar o Firebase para o projeto "${projectName}".

O projeto precisa de: ${useCase}

Inclua:
1. Como criar o projeto no Firebase Console
2. Como configurar autenticação (especialmente Google)
3. Como configurar Firestore Database
4. Como obter as credenciais de configuração
5. Como configurar regras de segurança
6. Como integrar no código TypeScript/React

Seja específico e prático, com links quando apropriado.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: FIREBASE_CONFIG_PROMPT,
        temperature: 0.5,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Erro ao gerar instruções com Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`Falha ao gerar instruções: ${error.message}`);
    }
    throw new Error("Erro desconhecido ao gerar instruções.");
  }
}

/**
 * Usa o Gemini para gerar código TypeScript de configuração do Firebase
 */
export async function generateFirebaseConfigCode(
  config: FirebaseConfigInfo
): Promise<string> {
  if (!process.env.API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY não configurada. Configure no arquivo .env");
  }

  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey! });

    const prompt = `
Gere código TypeScript completo e funcional para configurar o Firebase com as seguintes credenciais:

${JSON.stringify(config, null, 2)}

O código deve:
1. Importar os módulos necessários do Firebase
2. Configurar o Firebase App
3. Configurar Authentication (com Google Provider)
4. Configurar Firestore
5. Exportar funções úteis para usar no projeto
6. Incluir tratamento de erros
7. Seguir as melhores práticas de TypeScript

Retorne APENAS o código TypeScript, sem explicações adicionais.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: FIREBASE_CONFIG_PROMPT,
        temperature: 0.2,
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Erro ao gerar código com Gemini:", error);
    if (error instanceof Error) {
      throw new Error(`Falha ao gerar código: ${error.message}`);
    }
    throw new Error("Erro desconhecido ao gerar código.");
  }
}

