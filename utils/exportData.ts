/**
 * Utilitários para exportação de dados (CSV e JSON)
 */

import { Patient } from '../types';
import { trackEvent, AnalyticsEvents } from './analytics';

export interface ExportResult {
  questionnaireId: string;
  questionnaireName: string;
  questionnaireAcronym: string;
  resultId: string;
  patientId: string;
  patientName: string;
  date: string;
  totalScore: number;
  isPercent: boolean;
  answers: Array<{
    itemId: string;
    itemText: string;
    optionLabel?: string;
    score: number;
  }>;
  domainScores?: Record<string, number>;
  positive?: string[];
  negative?: string[];
}

export interface ExportData {
  patient: Patient;
  results: ExportResult[];
  metadata: {
    exportDate: string;
    exportVersion: string;
    applicationName: string;
  };
}

/**
 * Converte dados para formato CSV
 */
export function exportToCSV(data: ExportData): string {
  const lines: string[] = [];

  // Cabeçalho CSV
  lines.push('Questionário,Acrônimo,Data,Pontuação Total,Pontuação %,Domínios,Respostas,Pontos Positivos,Pontos Negativos');

  // Dados
  data.results.forEach((result) => {
    const date = new Date(result.date).toLocaleString('pt-BR');
    const score = result.totalScore.toFixed(2);
    const percent = result.isPercent ? score : '';
    const domains = result.domainScores 
      ? Object.entries(result.domainScores).map(([k, v]) => `${k}:${v.toFixed(2)}`).join('; ')
      : '';
    const answers = result.answers
      .map(a => `${a.itemText || a.itemId}: ${a.optionLabel ?? a.score}`)
      .join('; ');
    const positive = result.positive?.join('; ') || '';
    const negative = result.negative?.join('; ') || '';

    // Escapar vírgulas e aspas
    const escape = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    lines.push([
      escape(result.questionnaireName),
      escape(result.questionnaireAcronym),
      escape(date),
      escape(score),
      escape(percent),
      escape(domains),
      escape(answers),
      escape(positive),
      escape(negative),
    ].join(','));
  });

  return lines.join('\n');
}

/**
 * Converte dados para formato JSON
 */
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Download de arquivo
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta dados para CSV
 */
export function exportCSV(data: ExportData, filename?: string) {
  const csv = exportToCSV(data);
  const defaultFilename = `fisioq-${data.patient.nome}-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename || defaultFilename, 'text/csv;charset=utf-8;');
  trackEvent(AnalyticsEvents.QUESTIONNAIRE_EXPORT_CSV, {
    patientId: data.patient.id,
    resultsCount: data.results.length,
  });
}

/**
 * Exporta dados para JSON
 */
export function exportJSON(data: ExportData, filename?: string) {
  const json = exportToJSON(data);
  const defaultFilename = `fisioq-${data.patient.nome}-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename || defaultFilename, 'application/json;charset=utf-8;');
  trackEvent(AnalyticsEvents.QUESTIONNAIRE_EXPORTED, {
    patientId: data.patient.id,
    resultsCount: data.results.length,
    format: 'json',
  });
}

/**
 * Prepara dados para exportação
 */
export function prepareExportData(
  patient: Patient,
  results: any[],
  questionnaires: Map<string, any>,
  analysis?: (questionnaireId: string, answers: any[]) => { positive: string[]; negative: string[] }
): ExportData {
  const exportResults: ExportResult[] = results.map((result) => {
    const questionnaire = questionnaires.get(result.questionnaireId);
    const analysisResult = analysis 
      ? analysis(result.questionnaireId, result.answers || [])
      : { positive: [], negative: [] };

    return {
      questionnaireId: result.questionnaireId,
      questionnaireName: questionnaire?.name || result.questionnaireId,
      questionnaireAcronym: questionnaire?.acronym || '',
      resultId: result.id || result.questionnaireId,
      patientId: patient.id,
      patientName: patient.nome,
      date: result.createdAt || new Date().toISOString(),
      totalScore: result.totalScore || 0,
      isPercent: result.isPercent || false,
      answers: result.answers || [],
      domainScores: result.domainScores,
      positive: analysisResult.positive,
      negative: analysisResult.negative,
    };
  });

  return {
    patient: {
      ...patient,
      // Não incluir dados sensíveis se necessário
    },
    results: exportResults,
    metadata: {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0.0',
      applicationName: 'FisioQ Beta',
    },
  };
}

