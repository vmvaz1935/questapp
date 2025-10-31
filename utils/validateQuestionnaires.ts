import { Questionnaire } from '../types';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

export interface ValidationResult {
  questionnaireId: string;
  name: string;
  acronym: string;
  issues: ValidationIssue[];
}

export function validateQuestionnaire(q: Questionnaire): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Campos básicos
  if (!q.id) issues.push({ type: 'error', message: 'ID ausente.' });
  if (!q.name) issues.push({ type: 'error', message: 'Nome ausente.' });
  if (!q.acronym) issues.push({ type: 'warning', message: 'Acrônimo ausente.' });
  if (!q.items || q.items.length === 0) issues.push({ type: 'error', message: 'Sem itens.' });

  // Itens e opções
  const itemIds = new Set<string>();
  q.items.forEach((item, idx) => {
    if (!item.id) issues.push({ type: 'error', message: `Item #${idx + 1} sem id.` });
    if (!item.text) issues.push({ type: 'error', message: `Item ${item.id || `#${idx + 1}`} sem texto.` });
    if (!item.options || item.options.length === 0) issues.push({ type: 'error', message: `Item ${item.id} sem opções.` });
    if (itemIds.has(item.id)) issues.push({ type: 'error', message: `Item id duplicado: ${item.id}.` });
    itemIds.add(item.id);
    // Opções válidas
    const seen = new Set<string>();
    item.options.forEach((opt, oidx) => {
      if (opt.label == null || opt.label === '') issues.push({ type: 'error', message: `Item ${item.id} opção #${oidx + 1} sem label.` });
      if (typeof opt.score !== 'number' || Number.isNaN(opt.score)) issues.push({ type: 'error', message: `Item ${item.id} opção '${opt.label}' com score inválido.` });
      const key = `${opt.label}::${opt.score}`;
      if (seen.has(key)) issues.push({ type: 'warning', message: `Item ${item.id} opção duplicada '${opt.label}' (${opt.score}).` });
      seen.add(key);
    });
  });

  // Domínios
  if (!q.scoring?.domains) issues.push({ type: 'error', message: 'Scoring.domains ausente.' });
  else if (q.scoring.domains.length === 0) issues.push({ type: 'warning', message: 'Sem domínios definidos.' });
  else {
    q.scoring.domains.forEach((d, didx) => {
      if (!d.name) issues.push({ type: 'error', message: `Domínio #${didx + 1} sem nome.` });
      if (!Array.isArray(d.items)) issues.push({ type: 'error', message: `Domínio '${d.name}' sem lista de itens.` });
      else if (d.items.length === 0) issues.push({ type: 'warning', message: `Domínio '${d.name}' sem itens.` });
      else {
        d.items.forEach(id => {
          if (!itemIds.has(id)) issues.push({ type: 'error', message: `Domínio '${d.name}' referencia item inexistente: ${id}.` });
        });
      }
      if (typeof d.formula !== 'string') issues.push({ type: 'warning', message: `Domínio '${d.name}' sem fórmula textual.` });
    });
  }

  // Fórmula total e range
  if (!q.scoring?.total_formula) issues.push({ type: 'warning', message: 'Fórmula total ausente.' });
  if (!q.scoring?.range) issues.push({ type: 'warning', message: 'Range de pontuação ausente.' });
  else {
    const { min, max } = q.scoring.range;
    if (typeof min !== 'number' || typeof max !== 'number' || Number.isNaN(min) || Number.isNaN(max)) {
      issues.push({ type: 'error', message: 'Range inválido (min/max não numéricos).' });
    } else if (max <= min) {
      issues.push({ type: 'warning', message: 'Range com max <= min.' });
    }
  }

  // Interpretação
  if (!q.scoring?.interpretation) issues.push({ type: 'warning', message: 'Interpretação/normas ausentes.' });

  return { questionnaireId: q.id, name: q.name, acronym: q.acronym, issues };
}

export function validateAll(questionnaires: Questionnaire[]): ValidationResult[] {
  return questionnaires.map(validateQuestionnaire);
}


