// Gerador de PDF formatado para relatórios clínicos
import type { Patient, Questionnaire } from '../types';
import { analyzeResults } from './resultAnalysis';

// Carregar jsPDF dinamicamente via ESModule (local)
async function loadJsPDF(): Promise<any> {
  try {
    // Tentar import dinâmico ESModule (preferido)
    const jsPDFModule = await import('jspdf');
    // jsPDF pode exportar default ou named export dependendo da versão
    if (jsPDFModule.default) {
      return jsPDFModule.default;
    }
    if (jsPDFModule.jsPDF) {
      return jsPDFModule.jsPDF;
    }
    // Fallback para compatibilidade
    if (typeof (jsPDFModule as any).jsPDF === 'function') {
      return (jsPDFModule as any).jsPDF;
    }
    throw new Error('jsPDF não encontrado no módulo importado');
  } catch (error) {
    console.error('Erro ao carregar jsPDF:', error);
    throw new Error('Falha ao carregar jsPDF. Verifique se a dependência está instalada: npm install jspdf');
  }
}

interface QuestionnaireResult {
  questionnaireId: string;
  totalScore: number;
  isPercent: boolean;
  answers: any[];
  createdAt: string;
  domainScores?: Record<string, number>;
}

interface PDFData {
  patient: Patient;
  selectedResults: { result: QuestionnaireResult; questionnaire: Questionnaire }[];
  citations: Record<string, string>;
}

// Função helper para garantir que o texto seja tratado corretamente com UTF-8
function ensureUTF8(text: string | undefined | null): string {
  if (!text) return '';
  // Converter para string e garantir encoding correto
  return String(text).normalize('NFC');
}

// Função auxiliar para desenhar gráfico de pizza (donut chart) no PDF
function drawDonutChart(
  doc: any,
  x: number,
  y: number,
  radius: number,
  percentage: number,
  label: string
): void {
  const innerRadius = radius * 0.6;
  const centerX = x;
  const centerY = y;

  // Círculo de fundo (cinza)
  doc.setFillColor(229, 231, 235);
  doc.setDrawColor(229, 231, 235);
  doc.circle(centerX, centerY, radius, 'FD');

  // Arco do gráfico de pizza - desenhar setor usando método de preenchimento radial
  if (percentage > 0 && percentage <= 100) {
    const startAngle = -Math.PI / 2; // Começa no topo
    const endAngle = startAngle + (percentage / 100) * 2 * Math.PI;
    
    doc.setFillColor(37, 99, 235); // Azul
    doc.setDrawColor(37, 99, 235);
    
    // Desenhar setor usando múltiplas linhas radiais para criar preenchimento visual
    // Método: desenhar linhas radiais próximas para simular preenchimento sólido
    const steps = Math.max(50, Math.ceil((percentage / 100) * 100));
    doc.setLineWidth(0.3);
    
    for (let i = 0; i < steps; i++) {
      const angle = startAngle + (i / steps) * (endAngle - startAngle);
      
      // Linha radial do centro até a borda externa
      const x2 = centerX + radius * Math.cos(angle);
      const y2 = centerY + radius * Math.sin(angle);
      
      // Desenhar linha radial
      doc.line(centerX, centerY, x2, y2);
    }
    
    // Desenhar borda externa do setor (arco)
    doc.setLineWidth(1.0);
    const arcSteps = Math.max(40, Math.ceil((percentage / 100) * 80));
    for (let i = 0; i < arcSteps; i++) {
      const angle1 = startAngle + (i / arcSteps) * (endAngle - startAngle);
      const angle2 = startAngle + ((i + 1) / arcSteps) * (endAngle - startAngle);
      
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      
      doc.line(x1, y1, x2, y2);
    }
    
    // Desenhar bordas laterais do setor (linhas radiais nas extremidades)
    if (percentage < 100) {
      doc.setLineWidth(1.2);
      // Borda inicial (topo)
      const startX = centerX + radius * Math.cos(startAngle);
      const startY = centerY + radius * Math.sin(startAngle);
      doc.line(centerX, centerY, startX, startY);
      
      // Borda final
      const endX = centerX + radius * Math.cos(endAngle);
      const endY = centerY + radius * Math.sin(endAngle);
      doc.line(centerX, centerY, endX, endY);
    }
  }

  // Círculo interno (branco) para criar efeito donut
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.circle(centerX, centerY, innerRadius, 'FD');

  // Borda do donut
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.circle(centerX, centerY, radius, 'D');
  doc.circle(centerX, centerY, innerRadius, 'D');

  // Texto da porcentagem
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text(`${percentage.toFixed(0)}%`, centerX, centerY + 2, { align: 'center', baseline: 'middle' });

  // Label do gráfico (se fornecido)
  if (label) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(label, centerX, centerY + radius + 6, { align: 'center' });
  }
}

// Função principal de geração de PDF
export async function generatePDFReport(data: PDFData): Promise<void> {
  const { patient, selectedResults, citations } = data;

  try {
    // Carregar jsPDF dinamicamente
    console.log('Carregando jsPDF...');
    const jsPDFConstructor = await loadJsPDF();
    console.log('jsPDF carregado:', typeof jsPDFConstructor);
    
    if (!jsPDFConstructor || (typeof jsPDFConstructor !== 'function' && typeof jsPDFConstructor !== 'object')) {
      throw new Error('jsPDF não é válido. Tipo recebido: ' + typeof jsPDFConstructor);
    }
    
    // Criar novo documento PDF (A4)
    console.log('Criando documento PDF...');
    // jsPDF pode ser uma classe ou função construtora dependendo da versão
    const DocConstructor = (jsPDFConstructor as any).default || jsPDFConstructor;
    if (typeof DocConstructor !== 'function') {
      throw new Error('jsPDF constructor não é uma função');
    }
    const doc = new DocConstructor({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    if (!doc) {
      throw new Error('Falha ao criar documento PDF');
    }
    
    console.log('Documento PDF criado com sucesso');
    
    // Configurar encoding UTF-8 para suportar caracteres especiais
    // Nota: jsPDF 2.x tem melhor suporte nativo a UTF-8

  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // === CABEÇALHO ===
  doc.setFillColor(239, 246, 255); // Azul claro
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Logo/Nome do App
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216); // Azul escuro
  // Usar função helper para texto UTF-8
  doc.text(ensureUTF8('FisioQ'), margin, yPosition + 15);
  
  // Badge Beta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(254, 243, 199); // Laranja claro
  doc.setTextColor(234, 88, 12); // Laranja
  const betaWidth = doc.getTextWidth('Beta');
  doc.roundedRect(margin + 35, yPosition + 8, betaWidth + 4, 6, 3, 3, 'F');
  doc.text('Beta', margin + 37, yPosition + 12);

  // Subtítulo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(ensureUTF8('Questionários Clínicos'), margin, yPosition + 22);

  // Data de geração
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(ensureUTF8(`Gerado em: ${date}`), pageWidth - margin, yPosition + 25, { align: 'right' });

  yPosition = 40;

  // === DADOS DO PACIENTE ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(ensureUTF8('DADOS DO PACIENTE'), margin, yPosition);

  yPosition += 8;

  // Retângulo de fundo para dados do paciente
  const patientDataHeight = 35;
  doc.setFillColor(249, 250, 251);
  doc.rect(margin, yPosition, contentWidth, patientDataHeight, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.rect(margin, yPosition, contentWidth, patientDataHeight, 'S');

  yPosition += 7;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(ensureUTF8('Nome:'), margin + 3, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ensureUTF8(patient.nome || '-'), margin + 20, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(ensureUTF8('Idade:'), margin + 3, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ensureUTF8(`${patient.idade || '-'} anos`), margin + 20, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text(ensureUTF8('Sexo:'), margin + 60, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ensureUTF8(patient.sexo || '-'), margin + 75, yPosition);

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(ensureUTF8('Diagnóstico:'), margin + 3, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ensureUTF8(patient.diagnostico || '-'), margin + 30, yPosition);

  if (patient.ladoAcometido && patient.ladoAcometido !== 'Não se aplica') {
    doc.setFont('helvetica', 'bold');
    doc.text(ensureUTF8('Lado acometido:'), margin + 120, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(ensureUTF8(patient.ladoAcometido), margin + 155, yPosition);
  }

  yPosition += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(ensureUTF8('Fisioterapeuta:'), margin + 3, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ensureUTF8(patient.fisioterapeuta || '-'), margin + 40, yPosition);

  doc.setFont('helvetica', 'bold');
  doc.text(ensureUTF8('Médico:'), margin + 110, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(ensureUTF8(patient.medico || '-'), margin + 130, yPosition);

  yPosition += 15;

  // === RESULTADOS DOS QUESTIONÁRIOS ===
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(ensureUTF8('RESULTADOS DOS QUESTIONÁRIOS'), margin, yPosition);

  yPosition += 10;

  // Processar cada resultado selecionado
  selectedResults.forEach((item, index) => {
    const { result, questionnaire } = item;

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    // Calcular porcentagem
    const max = questionnaire.scoring?.range?.max ?? 100;
    let percentage = 0;
    if (result.isPercent) {
      percentage = Math.max(0, Math.min(100, result.totalScore));
    } else if (typeof result.totalScore === 'number' && max > 0) {
      percentage = (result.totalScore / max) * 100;
    }

    // Título do questionário
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(29, 78, 216);
    const questionnaireTitle = `${questionnaire.name} (${questionnaire.acronym})`;
    doc.text(ensureUTF8(questionnaireTitle), margin, yPosition);

    yPosition += 6;

    // Data da avaliação
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    const evaluationDate = new Date(result.createdAt || Date.now()).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    doc.text(ensureUTF8(`Avaliado em: ${evaluationDate}`), margin, yPosition);

    yPosition += 8;

    // Box do resultado
    const resultBoxHeight = 50;
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPosition, contentWidth, resultBoxHeight, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(margin, yPosition, contentWidth, resultBoxHeight, 'S');

    // Gráfico de pizza (lado direito)
    const chartX = pageWidth - margin - 25;
    const chartY = yPosition + resultBoxHeight / 2;
    drawDonutChart(doc, chartX, chartY, 12, percentage, 'Resultado');

    // Pontuação total (lado esquerdo)
    const scoreX = margin + 5;
    const scoreY = yPosition + 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(ensureUTF8('Pontuação Total:'), scoreX, scoreY);

    doc.setFontSize(16);
    doc.setTextColor(29, 78, 216);
    const scoreText = `${result.totalScore.toFixed(2)}${result.isPercent ? '%' : ''}`;
    doc.text(scoreText, scoreX, scoreY + 8);

    if (!result.isPercent && percentage > 0) {
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128);
      doc.text(`(${percentage.toFixed(1)}%)`, scoreX + 35, scoreY + 8);
    }

    // Domínios (se disponíveis)
    if (result.domainScores && Object.keys(result.domainScores).length > 0) {
      let domainsY = scoreY + 12;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text(ensureUTF8('Domínios:'), scoreX, domainsY);

      domainsY += 5;
      let domainX = scoreX;
      const domains = Object.entries(result.domainScores);
      domains.forEach(([domain, score], idx) => {
        if (yPosition + resultBoxHeight > pageHeight - 15) {
          // Não adicionar domínios se não houver espaço
          return;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        const domainText = `${domain}: ${Number(score).toFixed(2)}`;
        
        // Quebrar linha se necessário
        if (domainX + 70 > pageWidth - margin - 35) {
          domainX = scoreX;
          domainsY += 5;
        }
        
        doc.text(ensureUTF8(domainText), domainX, domainsY);
        domainX += 70;
      });
    }

    yPosition += resultBoxHeight + 8;

    // === PONTOS PERTINENTES POSITIVOS E NEGATIVOS ===
    try {
      const analysis = analyzeResults(questionnaire, result.answers || []);
      
      if (analysis.positive.length > 0 || analysis.negative.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(ensureUTF8('ANÁLISE DE RESULTADOS'), margin, yPosition);
        yPosition += 8;

        // Pontos Positivos
        if (analysis.positive.length > 0) {
          const maxPositivePoints = Math.min(analysis.positive.length, 8);
          let estimatedHeight = maxPositivePoints * 5 + 10;
          
          // Box para pontos positivos
          doc.setFillColor(240, 253, 244); // Verde claro
          doc.rect(margin, yPosition, contentWidth, estimatedHeight, 'F');
          doc.setDrawColor(34, 197, 94); // Verde
          doc.setLineWidth(0.5);
          doc.rect(margin, yPosition, contentWidth, estimatedHeight, 'S');
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(22, 163, 74); // Verde escuro
          doc.text(ensureUTF8('✓ Pontos Pertinentes Positivos'), margin + 3, yPosition + 6);
          
          let posY = yPosition + 10;
          analysis.positive.slice(0, maxPositivePoints).forEach((point: string) => {
            if (posY > yPosition + estimatedHeight - 3) return;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            const pointText = ensureUTF8(`• ${point}`);
            const pointLines = doc.splitTextToSize(pointText, contentWidth - 10);
            doc.text(pointLines, margin + 5, posY);
            posY += pointLines.length * 4 + 1;
          });
          
          yPosition += estimatedHeight + 5;
        }

        // Pontos Negativos
        if (analysis.negative.length > 0) {
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = margin;
          }

          const maxNegativePoints = Math.min(analysis.negative.length, 8);
          let estimatedHeight = maxNegativePoints * 5 + 10;
          
          // Box para pontos negativos
          doc.setFillColor(254, 242, 242); // Vermelho claro
          doc.rect(margin, yPosition, contentWidth, estimatedHeight, 'F');
          doc.setDrawColor(239, 68, 68); // Vermelho
          doc.setLineWidth(0.5);
          doc.rect(margin, yPosition, contentWidth, estimatedHeight, 'S');
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(220, 38, 38); // Vermelho escuro
          doc.text(ensureUTF8('⚠ Pontos Pertinentes Negativos'), margin + 3, yPosition + 6);
          
          let negY = yPosition + 10;
          analysis.negative.slice(0, maxNegativePoints).forEach((point: string) => {
            if (negY > yPosition + estimatedHeight - 3) return;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(75, 85, 99);
            const pointText = ensureUTF8(`• ${point}`);
            const pointLines = doc.splitTextToSize(pointText, contentWidth - 10);
            doc.text(pointLines, margin + 5, negY);
            negY += pointLines.length * 4 + 1;
          });
          
          yPosition += estimatedHeight + 5;
        }

        yPosition += 5;
      }
    } catch (error) {
      console.warn('Erro ao analisar resultados para PDF:', error);
      // Continuar mesmo se houver erro na análise
    }

    // Interpretação
    if (questionnaire.scoring?.interpretation) {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text(ensureUTF8('Interpretação:'), margin, yPosition);
      
      yPosition += 6;
      
      // Box para interpretação
      doc.setFillColor(239, 246, 255); // Azul muito claro
      doc.setDrawColor(59, 130, 246); // Azul
      doc.setLineWidth(0.3);
      const interpText = ensureUTF8(questionnaire.scoring.interpretation);
      const interpLines = doc.splitTextToSize(interpText, contentWidth - 10);
      const interpHeight = interpLines.length * 4 + 6;
      doc.rect(margin, yPosition - 2, contentWidth, interpHeight, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(interpLines, margin + 3, yPosition + 2);
      yPosition += interpHeight + 5;
    }

    // Informações sobre o questionário (metadata) - resumido
    if (questionnaire.metadata) {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(17, 24, 39);
      doc.text(ensureUTF8('INFORMAÇÕES SOBRE O QUESTIONÁRIO'), margin, yPosition);
      yPosition += 8;

      // Tradução e Adaptação Cultural (mais relevante)
      if (questionnaire.metadata.translation_cultural_adaptation) {
        const tca = questionnaire.metadata.translation_cultural_adaptation;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(75, 85, 99);
        doc.text(ensureUTF8('Tradução e Adaptação Cultural:'), margin, yPosition);
        yPosition += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        
        doc.text(ensureUTF8(`Idioma original: ${tca.original_language}`), margin + 3, yPosition);
        yPosition += 4;
        doc.text(ensureUTF8(`Idioma de destino: ${tca.target_language}`), margin + 3, yPosition);
        yPosition += 4;
        doc.text(ensureUTF8(`Ano de adaptação: ${tca.adaptation_year} | Autores: ${tca.adaptation_authors}`), margin + 3, yPosition);
        yPosition += 8;
      }

      yPosition += 3;
    }

    // Respostas detalhadas (todas, com layout compacto)
    if (result.answers && result.answers.length > 0) {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(75, 85, 99);
      doc.text(ensureUTF8('Respostas Detalhadas:'), margin, yPosition);
      yPosition += 5;
      
      // Mostrar todas as respostas com layout compacto
      result.answers.forEach((answer: any) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const answerText = `${answer.itemText || answer.itemId}: ${answer.optionLabel ?? answer.score}`;
        const answerTextUTF8 = ensureUTF8(`• ${answerText}`);
        const lines = doc.splitTextToSize(answerTextUTF8, contentWidth - 10);
        const linesUTF8 = Array.isArray(lines) ? lines.map(l => ensureUTF8(l)) : [ensureUTF8(String(lines))];
        doc.text(linesUTF8, margin + 3, yPosition);
        yPosition += linesUTF8.length * 3.5;
      });
      
      yPosition += 3;
    }

    // Linha separadora entre questionários
    if (index < selectedResults.length - 1) {
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    }
  });

  // === REFERÊNCIAS BIBLIOGRÁFICAS ===
  if (selectedResults.length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Box de fundo para seção de referências
    doc.setFillColor(249, 250, 251);
    const refStartY = yPosition;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(ensureUTF8('REFERÊNCIAS BIBLIOGRÁFICAS (ABNT)'), margin, yPosition);

    yPosition += 8;

    // Coletar acrônimos únicos dos questionários selecionados
    const usedAcronyms = new Set<string>();
    selectedResults.forEach(item => {
      const acronym = item.questionnaire.acronym;
      if (acronym && citations[acronym]) {
        usedAcronyms.add(acronym);
      }
    });

    // Adicionar referências com melhor formatação
    Array.from(usedAcronyms).forEach((acronym, idx) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin + 10;
      }

      // Box para cada referência
      const refHeight = 15;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPosition - 2, contentWidth, refHeight, 'FD');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(29, 78, 216);
      doc.text(`${acronym}:`, margin + 3, yPosition + 3);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      const citation = citations[acronym];
      const citationUTF8 = ensureUTF8(citation);
      const citationLines = doc.splitTextToSize(citationUTF8, contentWidth - 15);
      const citationLinesUTF8 = Array.isArray(citationLines) ? citationLines.map(l => ensureUTF8(l)) : [ensureUTF8(String(citationLines))];
      doc.text(citationLinesUTF8, margin + 12, yPosition + 3);
      yPosition += Math.max(refHeight, citationLines.length * 4) + 3;
    });

    // Adicionar informações sobre desenvolvedores
    selectedResults.forEach(item => {
      const { questionnaire } = item;
      
      if (questionnaire.metadata?.about_developer) {
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(17, 24, 39);
        doc.text(ensureUTF8(`Sobre o Desenvolvedor do ${questionnaire.acronym}:`), margin, yPosition);
        yPosition += 6;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        const developerText = ensureUTF8(questionnaire.metadata.about_developer);
        const developerLines = doc.splitTextToSize(developerText, contentWidth - 5);
        doc.text(developerLines, margin + 3, yPosition);
        yPosition += developerLines.length * 4 + 5;
      }

      // Literatura de apoio adicional (se disponível)
      if (questionnaire.metadata?.supporting_literature && questionnaire.metadata.supporting_literature.length > 0) {
        questionnaire.metadata.supporting_literature.forEach((lit: any) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          if (lit.type) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(75, 85, 99);
            doc.text(ensureUTF8(lit.type) + ':', margin, yPosition);
            yPosition += 4;
          }

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(107, 114, 128);
          const litText = ensureUTF8(lit.citation);
          const litLines = doc.splitTextToSize(litText, contentWidth - 5);
          doc.text(litLines, margin + 3, yPosition);
          yPosition += litLines.length * 4 + 3;
        });
      }
    });
  }

  // === RODAPÉ ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      ensureUTF8(`FisioQ Beta - Relatório Clínico | Página ${i} de ${totalPages}`),
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

    // Salvar PDF
    // Sanitizar nome do paciente para nome de arquivo
    const sanitizedName = patient.nome
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .substring(0, 30); // Limita tamanho
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Relatorio_${sanitizedName}_${dateStr}.pdf`;
    
    console.log('Salvando PDF:', fileName);
    doc.save(fileName);
    console.log('PDF salvo com sucesso');
  } catch (error: any) {
    console.error('Erro na geração de PDF:', error);
    throw error; // Re-lançar o erro para ser capturado pelo componente
  }
}

