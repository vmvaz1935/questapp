import fs from 'fs';
import path from 'path';

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function validateQuestionnaire(q) {
  const issues = [];
  if (!q.id) issues.push({ type: 'warning', message: 'ID ausente (app usa id do arquivo se necessário).' });
  if (!q.name) issues.push({ type: 'error', message: 'Nome ausente.' });
  if (!q.acronym) issues.push({ type: 'warning', message: 'Acrônimo ausente.' });
  if (!Array.isArray(q.items) || q.items.length === 0) issues.push({ type: 'error', message: 'Sem itens.' });

  const itemIds = new Set();
  if (Array.isArray(q.items)) {
    q.items.forEach((item, idx) => {
      if (!item.id) issues.push({ type: 'error', message: `Item #${idx + 1} sem id.` });
      if (!item.text) issues.push({ type: 'error', message: `Item ${item.id || `#${idx + 1}`} sem texto.` });
      if (!Array.isArray(item.options) || item.options.length === 0) issues.push({ type: 'error', message: `Item ${item.id} sem opções.` });
      if (item.id) {
        if (itemIds.has(item.id)) issues.push({ type: 'error', message: `Item id duplicado: ${item.id}.` });
        itemIds.add(item.id);
      }
      const seen = new Set();
      if (Array.isArray(item.options)) {
        item.options.forEach((opt, oidx) => {
          if (opt.label == null || opt.label === '') issues.push({ type: 'error', message: `Item ${item.id} opção #${oidx + 1} sem label.` });
          if (typeof opt.score !== 'number' || Number.isNaN(opt.score)) issues.push({ type: 'error', message: `Item ${item.id} opção '${opt.label}' com score inválido.` });
          const key = `${opt.label}::${opt.score}`;
          if (seen.has(key)) issues.push({ type: 'warning', message: `Item ${item.id} opção duplicada '${opt.label}' (${opt.score}).` });
          seen.add(key);
        });
      }
    });
  }

  if (!q.scoring || !Array.isArray(q.scoring.domains)) {
    issues.push({ type: 'error', message: 'Scoring.domains ausente.' });
  } else if (q.scoring.domains.length === 0) {
    issues.push({ type: 'warning', message: 'Sem domínios definidos.' });
  } else {
    q.scoring.domains.forEach((d, didx) => {
      if (!d.name) issues.push({ type: 'error', message: `Domínio #${didx + 1} sem nome.` });
      if (!Array.isArray(d.items)) issues.push({ type: 'error', message: `Domínio '${d.name || `#${didx + 1}`}' sem lista de itens.` });
      else if (d.items.length === 0) issues.push({ type: 'warning', message: `Domínio '${d.name}' sem itens.` });
      else {
        d.items.forEach(id => { if (!itemIds.has(id)) issues.push({ type: 'error', message: `Domínio '${d.name}' referencia item inexistente: ${id}.` }); });
      }
    });
  }

  if (!q.scoring || !q.scoring.total_formula) issues.push({ type: 'warning', message: 'Fórmula total ausente.' });
  if (!q.scoring || !q.scoring.range) issues.push({ type: 'warning', message: 'Range de pontuação ausente.' });
  else {
    const { min, max } = q.scoring.range;
    if (typeof min !== 'number' || typeof max !== 'number' || Number.isNaN(min) || Number.isNaN(max)) {
      issues.push({ type: 'error', message: 'Range inválido (min/max não numéricos).' });
    } else if (max <= min) {
      issues.push({ type: 'warning', message: 'Range com max <= min.' });
    }
  }

  if (!q.scoring || !q.scoring.interpretation) issues.push({ type: 'warning', message: 'Interpretação/normas ausentes.' });

  return { id: q.id, name: q.name, acronym: q.acronym, issues };
}

function main() {
  const dir = path.resolve('data/questionnaires');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const report = [];
  for (const file of files) {
    const p = path.join(dir, file);
    const q = loadJson(p);
    if (!q.id) q.id = path.basename(file, '.json');
    const res = validateQuestionnaire(q);
    report.push({ file, ...res });
  }
  // Saída amigável
  for (const r of report) {
    const errs = r.issues.filter(i=>i.type==='error');
    const warns = r.issues.filter(i=>i.type==='warning');
    console.log(`\n=== ${r.name} (${r.acronym}) — ${r.file} ===`);
    if (errs.length === 0 && warns.length === 0) {
      console.log('OK');
      continue;
    }
    if (errs.length) {
      console.log(`Erros (${errs.length}):`);
      errs.forEach(e=> console.log(` - ${e.message}`));
    }
    if (warns.length) {
      console.log(`Avisos (${warns.length}):`);
      warns.forEach(w=> console.log(` - ${w.message}`));
    }
  }
}

main();


