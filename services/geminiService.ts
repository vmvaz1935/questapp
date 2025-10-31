
import { GoogleGenAI } from "@google/genai";
import { Questionnaire } from '../types';

const GEMINI_PROMPT = `
Você é um assistente de análise clínica de alta precisão. Sua tarefa é analisar o texto Markdown do questionário clínico fornecido e extrair TODAS as suas informações estruturais. O texto pode conter formatação markdown (cabeçalhos, listas) para organizar perguntas e seções. Você DEVE retornar APENAS um objeto JSON, sem nenhum texto introdutório ou de conclusão. O schema do JSON deve ser o seguinte:

{
  "name": "Nome completo do questionário",
  "acronym": "Acrônimo (ex: 'WOMAC')",
  "domain": "Domínio clínico (ex: 'Função do Joelho')",
  "instructions": {
    "text": "Instruções textuais para o paciente",
    "reproduction_permitted": true
  },
  "items": [
    {
      "id": "Q1",
      "text": "O texto completo da primeira pergunta",
      "domain": "Nome do domínio/subescala (ex: 'Dor')",
      "options": [
        {"label": "Texto da Opção 1", "score": 0},
        {"label": "Texto da Opção 2", "score": 1}
      ],
      "reverse_scored": false
    }
  ],
  "scoring": {
    "domains": [
      {"name": "Dor", "items": ["Q1", "Q5"], "formula": "Soma dos scores"},
      {"name": "Função", "items": ["Q6", "Q10"], "formula": "Soma dos scores"}
    ],
    "total_formula": "Descrição da fórmula total (ex: '(Soma de todos os itens / 88) * 100')",
    "missing_data_rule": "Regra para dados ausentes (ex: 'Permitir 1 item ausente por domínio')",
    "range": {"min": 0, "max": 100},
    "interpretation": "O que a pontuação significa (ex: 'Pontuação mais alta = melhor função')"
  },
  "source": { "filename": "Nome do arquivo MD original" }
}


Instrução Crítica: Preste atenção absoluta à lógica de pontuação, valores de cada opção, itens reversos e fórmulas de domínio. A precisão é vital. Use temperatura 0.0.
`;

export const parseMarkdownToQuestionnaire = async (markdownText: string, filename: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // FIX: Simplified the contents structure and used systemInstruction for the main prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `--- QUESTIONNAIRE MARKDOWN (filename: ${filename}) ---\n\n${markdownText}`,
      config: {
        systemInstruction: GEMINI_PROMPT,
        temperature: 0.0,
        responseMimeType: "application/json",
      },
    });

    const rawJsonString = response.text.trim();
    // Validate and format JSON
    const parsedJson = JSON.parse(rawJsonString);
    return JSON.stringify(parsedJson, null, 2);

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to parse questionnaire: ${error.message}`);
    }
    throw new Error("An unknown error occurred while parsing the questionnaire.");
  }
};