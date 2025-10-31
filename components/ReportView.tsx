import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import useLocalStorage from '../hooks/useLocalStorage';
import { Patient, Questionnaire } from '../types';
import { generatePDFReport } from '../utils/pdfGenerator';
import { analyzeResults } from '../utils/resultAnalysis';
import { exportCSV, exportJSON, prepareExportData } from '../utils/exportData';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

const ReportView: React.FC<{ questionnaires: Questionnaire[] }> = ({ questionnaires }) => {
  const { professionalId } = useAuth();
  const patientsKey = professionalId ? `patients_${professionalId}` : 'patients';
  const resultsKey = professionalId ? `results_${professionalId}` : 'results';
  const [patients] = useLocalStorage<Patient[]>(patientsKey, []);
  const [results] = useLocalStorage<any[]>(resultsKey, []);
  const [patientId, setPatientId] = useState<string>('');
  const [selectedIdx, setSelectedIdx] = useState<Record<number, boolean>>({});

  const qMap = useMemo(()=> Object.fromEntries(questionnaires.map(q=>[q.id,q])), [questionnaires]);
  const patient = patients.find(p=>p.id===patientId);
  const patientResults = results.filter(r=> r.patientId===patientId);

  const handleExportCSV = () => {
    if (!patient) return;

    const selectedResults = patientResults.filter((_, idx) => selectedIdx[idx]);
    
    if (selectedResults.length === 0) {
      alert('Selecione pelo menos um questionário para exportar.');
      return;
    }

    try {
      const questionnairesMap = new Map(
        selectedResults.map(r => [r.questionnaireId, qMap[r.questionnaireId]])
      );

      const exportData = prepareExportData(
        patient,
        selectedResults,
        questionnairesMap,
        (questionnaireId, answers) => {
          const questionnaire = qMap[questionnaireId];
          if (!questionnaire) return { positive: [], negative: [] };
          return analyzeResults(questionnaire, answers);
        }
      );

      exportCSV(exportData);
    } catch (error: any) {
      console.error('Erro ao exportar CSV:', error);
      alert(`Erro ao exportar CSV: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleExportJSON = () => {
    if (!patient) return;

    const selectedResults = patientResults.filter((_, idx) => selectedIdx[idx]);
    
    if (selectedResults.length === 0) {
      alert('Selecione pelo menos um questionário para exportar.');
      return;
    }

    try {
      const questionnairesMap = new Map(
        selectedResults.map(r => [r.questionnaireId, qMap[r.questionnaireId]])
      );

      const exportData = prepareExportData(
        patient,
        selectedResults,
        questionnairesMap,
        (questionnaireId, answers) => {
          const questionnaire = qMap[questionnaireId];
          if (!questionnaire) return { positive: [], negative: [] };
          return analyzeResults(questionnaire, answers);
        }
      );

      exportJSON(exportData);
    } catch (error: any) {
      console.error('Erro ao exportar JSON:', error);
      alert(`Erro ao exportar JSON: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const generatePDF = async () => {
    if (!patient) return;
    
    // Filtrar apenas resultados selecionados
    const selectedResults = patientResults
      .filter((_, idx) => selectedIdx[idx])
      .map(r => {
        const q = qMap[r.questionnaireId];
        return { result: r, questionnaire: q! };
      })
      .filter(item => item.questionnaire);

    if (selectedResults.length === 0) {
      alert('Selecione pelo menos um questionário para gerar o relatório PDF.');
      return;
    }

    try {
      // Gerar PDF formatado
      await generatePDFReport({
        patient,
        selectedResults,
        citations
      });
      trackEvent(AnalyticsEvents.QUESTIONNAIRE_EXPORT_PDF, {
        patientId: patient.id,
        resultsCount: selectedResults.length,
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao gerar PDF';
      alert(`Erro ao gerar PDF: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    }
  };

  const toggleAll = (check: boolean) => {
    const next: Record<number, boolean> = {};
    patientResults.forEach((_, i) => { next[i] = check; });
    setSelectedIdx(next);
  };

  const percentFrom = (r: any) => {
    const q = qMap[r.questionnaireId];
    if (!q) return undefined;
    const max = q.scoring?.range?.max ?? 100;
    if (r.isPercent) return Math.max(0, Math.min(100, r.totalScore));
    if (typeof r.totalScore === 'number' && max > 0) return (r.totalScore / max) * 100;
    return undefined;
  };

  // Referências em ABNT - Versões traduzidas e adaptadas culturalmente (quando disponíveis)
  const citations: Record<string, string> = {
    'ACL-RSI': 'WEBSTER, K. E.; FELLER, J. A.; LAMBROS, C. Development and preliminary validation of a scale to measure the psychological impact of returning to sport following anterior cruciate ligament reconstruction surgery. Physical Therapy in Sport, v. 9, n. 1, p. 9-15, 2008. DOI: 10.1016/j.ptsp.2007.09.003.',
    'AOFAS': 'KITAOKA, H. B. et al. Clinical rating systems for the ankle-hindfoot, midfoot, hallux, and lesser toes. Foot & Ankle International, v. 15, n. 7, p. 349-353, 1994.',
    'CPG': 'VON KORFF, M.; ORMEL, J.; KEELER, F.; DWORKIN, S. F. Grading the severity of chronic pain. Pain, v. 50, n. 2, p. 133-149, 1992. DOI: 10.1016/0304-3959(92)90154-4.',
    'DASH': 'ORNELLAS, T. S.; CICONELLI, R. M.; FALOPPA, F. Tradução e adaptação cultural do questionário Disabilities of the Arm, Shoulder and Hand (DASH) para a língua portuguesa. Revista Brasileira de Reumatologia, v. 48, n. 6, p. 335-342, 2008. DOI: 10.1590/S0482-50042008000600004.',
    'FAAM': 'MARTIN, R. L.; IRRGANG, J. J.; BURDETT, R. G.; CONTI, S. F.; VAN SWEARINGEN, J. M. Evidence of validity for the Foot and Ankle Ability Measure (FAAM). Foot & Ankle International, v. 26, n. 11, p. 968-983, 2005. DOI: 10.1177/107110070502601113.',
    'FAOS': 'ROOS, E. M.; BRANDSSON, S.; KARLSSON, J. Validation of the Foot and Ankle Outcome Score for ankle ligament reconstruction. Foot & Ankle International, v. 22, n. 10, p. 788-794, 2001. DOI: 10.1177/107110070102201004.',
    'HAGOS': 'THORBORG, K. et al. The Copenhagen Hip and Groin Outcome Score (HAGOS): development and validation according to the COSMIN checklist. British Journal of Sports Medicine, v. 45, n. 6, p. 478-491, 2011. DOI: 10.1136/bjsm.2010.080937.',
    'HOOS': 'NILSDOTTER, A. K.; LOHMANDER, L. S.; KLÄSSBO, M.; ROOS, E. M. Hip disability and osteoarthritis outcome score (HOOS) - validity and responsiveness in total hip replacement. BMC Musculoskeletal Disorders, v. 4, n. 10, 2003. DOI: 10.1186/1471-2474-4-10.',
    'iHOT-12': 'MOHTADI, N. G. H. et al. The development and validation of a self-administered quality-of-life outcome measure for young, active patients with symptomatic hip disease: the International Hip Outcome Tool (iHOT-12). Arthroscopy: The Journal of Arthroscopic & Related Surgery, v. 28, n. 5, p. 595-610, 2012. DOI: 10.1016/j.arthro.2012.02.027.',
    'IKDC': 'METSAVAHT, L. et al. Translation and cross-cultural adaptation of the Brazilian version of the International Knee Documentation Committee Subjective Knee Form: validity and reproducibility. The American Journal of Sports Medicine, v. 38, n. 11, p. 2404-2412, 2010. DOI: 10.1177/0363546510365314.',
    'KOOS': 'MENDES, J. G. G. et al. Translation, cross-cultural adaptation and validation of the Knee Injury and Osteoarthritis Outcome Score (KOOS) into Brazilian Portuguese. Knee Surgery, Sports Traumatology, Arthroscopy, v. 31, n. 5, p. 1652-1662, 2023. DOI: 10.1007/s00167-022-06911-w.',
    'LEFS': 'NATOUR, J.; FERRAZ, M. B.; VILLARTA, R. L.; MEDEIROS, C. Tradução e validação do questionário Lower Extremity Functional Scale (LEFS) para língua portuguesa. Revista Brasileira de Reumatologia, v. 45, n. 3, p. 153-161, 2005. DOI: 10.1590/S0482-50042005000300004.',
    'Lysholm': 'PECCIN, M. S.; CICONELLI, R. M.; COHEN, M. Questionário específico para sintomas do joelho "Lysholm Knee Scoring Scale" - tradução e validação para a língua portuguesa. Acta Ortopédica Brasileira, v. 14, n. 5, p. 268-272, 2006. DOI: 10.1590/S1413-78522006000500008.',
    'MHQ': 'CHUNG, K. C. et al. The Michigan Hand Outcomes Questionnaire (MHQ): assessment of responsiveness and validity of a patient-reported outcome measure of hand function. The Journal of Hand Surgery, v. 23, n. 4, p. 575-587, 1998. DOI: 10.1016/S0363-5023(98)80024-7.',
    'NBQ': 'BOLTON, J. E.; HUMPHREYS, B. K. The Bournemouth Questionnaire: a short-form comprehensive outcome measure. II. Psychometric properties in neck pain patients. Journal of Manipulative and Physiological Therapeutics, v. 25, n. 3, p. 141-148, 2002. DOI: 10.1067/mmt.2002.123333.',
    'NDI': 'COOK, C. et al. Three-dimensional movements of the cervical spine. Journal of Manipulative and Physiological Therapeutics, v. 29, n. 7, p. 574-584, 2006.',
    'ODI': 'VIGATTO, R.; ALEXANDRE, N. M. C.; CORRÊA FILHO, H. R. Adaptação transcultural do Oswestry Disability Index para língua portuguesa do Brasil. Revista Brasileira de Fisioterapia, v. 11, n. 6, p. 459-467, 2007. DOI: 10.1590/S1413-35552007000600008.',
    'OSS': 'DAWSON, J. et al. Questionnaire on the perceptions of patients about shoulder surgery. The Journal of Bone and Joint Surgery. British Volume, v. 78, n. 4, p. 593-600, 1996. DOI: 10.1302/0301-620X.78B4.0780593.',
    'PRTEE': 'MACDERMID, J. C. Development of a patient-rated tennis elbow evaluation (PRTEE). Journal of Hand Therapy, v. 12, n. 3, p. 177-183, 1999. DOI: 10.1016/S0894-1130(99)80042-0.',
    'PRWE': 'MACDERMID, J. C. et al. Patient rating of wrist pain and disability: a reliable and valid measurement tool. Journal of Orthopaedic Trauma, v. 12, n. 8, p. 577-586, 1998. DOI: 10.1097/00005131-199812000-00009.',
    'QBPDS': 'COPOBIANCO, M. A.; SILVA, L. C.; NASCIMENTO, R. A.; LIMA, L. R.; PIRES, M. C. Q. Translation, cross-cultural adaptation and validation of the Quebec Back Pain Disability Scale to Brazilian Portuguese. Brazilian Journal of Physical Therapy, v. 21, n. 5, p. 336-345, 2017. DOI: 10.1016/j.bjpt.2017.07.001.',
    'RMDQ': 'NUSBAUM, L. et al. Tradução, adaptação e validação do Roland-Morris Questionnaire - um instrumento para avaliar incapacidade relacionada à dor nas costas. Revista Brasileira de Reumatologia, v. 41, n. 6, p. 309-316, 2001.',
    'SBST': 'HILL, J. C. et al. A primary care back pain screening tool: identifying patient subgroups for initial treatment. Arthritis & Rheumatism, v. 59, n. 5, p. 632-641, 2008. DOI: 10.1002/art.23576.',
    'SPADI': 'CAMARGO, P. R.; ALBURQUERQUE-SENDÍN, F.; SALVINI, T. F. Tradução brasileira e adaptação do questionário Shoulder Pain and Disability Index. Revista Brasileira de Fisioterapia, v. 12, n. 1, p. 6-11, 2008. DOI: 10.1590/S1413-35552008000100002.',
    'TSK-11': 'SIQUEIRA, F. B. et al. Tradução e adaptação transcultural da Tampa Scale of Kinesiophobia para a língua portuguesa do Brasil. Revista Brasileira de Fisioterapia, v. 11, n. 4, p. 287-292, 2007. DOI: 10.1590/S1413-35552007000400005.',
    'WOMAC': 'SANTOS, E.; CICONELLI, R. M.; SILVA, E. F. P.; DUARTE, P. S.; KAWANO, M. M. Tradução e adaptação do questionário WOMAC para a língua portuguesa. Revista Brasileira de Reumatologia, v. 45, n. 3, p. 141-152, 2005. DOI: 10.1590/S0482-50042005000300003.',
    'WOSI': 'KIRKLEY, A.; GRIFFIN, S.; McLINTOCK, H.; NG, L. The development and evaluation of a disease-specific quality of life measurement tool for shoulder instability: the Western Ontario Shoulder Instability Index (WOSI). The American Journal of Sports Medicine, v. 26, n. 6, p. 764-772, 1998. DOI: 10.1177/03635465980260060301.'
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios</h2>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Paciente</label>
          <select value={patientId} onChange={e=>setPatientId(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2 dark:bg-gray-700 max-w-md">
            <option value="">-- Selecione --</option>
            {patients.map(p=> <option key={p.id} value={p.id}>{p.nome} • {p.idade} anos</option>)}
          </select>
        </div>
      </div>

      {patient && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Dados do Paciente</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{patient.nome} • {patient.idade} anos • {patient.sexo}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Diag.: {patient.diagnostico} {patient.ladoAcometido && `• Lado: ${patient.ladoAcometido}`}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fisio: {patient.fisioterapeuta || '-'} • Médico: {patient.medico || '-'}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={handleExportCSV}
                className="text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={patientResults.length === 0}
                title={patientResults.length === 0 ? 'Nenhum resultado disponível' : 'Exportar para CSV'}
                aria-label="Exportar para CSV"
              >
                CSV
              </button>
              <button 
                onClick={handleExportJSON}
                className="text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={patientResults.length === 0}
                title={patientResults.length === 0 ? 'Nenhum resultado disponível' : 'Exportar para JSON'}
                aria-label="Exportar para JSON"
              >
                JSON
              </button>
              <button 
                onClick={generatePDF} 
                className="text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500" 
                disabled={patientResults.length === 0}
                title={patientResults.length === 0 ? 'Nenhum resultado disponível' : 'Gerar relatório PDF formatado'}
                aria-label="Gerar relatório PDF"
              >
                {patientResults.filter((_, idx) => selectedIdx[idx]).length > 0 
                  ? `PDF (${patientResults.filter((_, idx) => selectedIdx[idx]).length})`
                  : 'PDF'}
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {patientResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Sem resultados registrados.</p>
            ) : (
              patientResults.map((r, idx)=> {
                const q = qMap[r.questionnaireId];
                const pct = percentFrom(r);
                const sel = !!selectedIdx[idx];
                const a = (pct ?? 0) / 100 * 2 * Math.PI; // radianos
                const sweep = Math.max(0.01, Math.min(6.283, a));
                const x = 40 + 30 * Math.sin(sweep);
                const y = 40 - 30 * Math.cos(sweep);
                const large = sweep > Math.PI ? 1 : 0;
                return (
                  <div key={idx} className={`border ${sel?'border-blue-400':'border-gray-200 dark:border-gray-700'} rounded-lg p-4`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          <input type="checkbox" className="mr-2" checked={sel} onChange={e=> setSelectedIdx(prev=> ({ ...prev, [idx]: e.target.checked }))} />
                          {q?.name ?? r.questionnaireId} ({q?.acronym}) • {new Date(r.createdAt||Date.now()).toLocaleString()}
                        </p>
                        {typeof r.totalScore === 'number' && (
                          <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">Pontuação total: {r.totalScore.toFixed(2)}{r.isPercent ? '%' : ''} {pct!=null && !r.isPercent && `(${pct.toFixed(1)}%)`}</p>
                        )}
                      </div>
                      {/* Gráfico pizza (%): SVG donut */}
                      <svg width="80" height="80" aria-label="Gráfico de pizza">
                        <circle cx="40" cy="40" r="30" fill="#E5E7EB" />
                        {pct!=null && pct>0 && (
                          <path d={`M40,10 A30,30 0 ${large} 1 ${x},${y} L40,40 Z`} fill="#2563EB" />
                        )}
                        <circle cx="40" cy="40" r="18" fill="#fff" />
                        <text x="40" y="45" textAnchor="middle" fontSize="12" fill="#111827">{pct!=null ? `${pct.toFixed(0)}%` : '-'}</text>
                      </svg>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium mb-2">Respostas</h4>
                      <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-200 mb-4">
                        {(r.answers||[]).map((a:any,i:number)=> (
                          <li key={i}><span className="font-medium">{a.itemText || a.itemId}:</span> {a.optionLabel ?? a.score}</li>
                        ))}
                      </ul>
                      
                      {/* Pontos Pertinentes Positivos e Negativos */}
                      {q && (() => {
                        const analysis = analyzeResults(q, r.answers || []);
                        return (
                          <>
                            {analysis.positive.length > 0 && (
                              <div className="mb-3">
                                <h5 className="font-semibold text-green-700 dark:text-green-400 text-sm mb-1 flex items-center gap-1">
                                  <span>✓</span> Pontos Positivos
                                </h5>
                                <ul className="list-disc ml-6 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                  {analysis.positive.slice(0, 5).map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {analysis.negative.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-red-700 dark:text-red-400 text-sm mb-1 flex items-center gap-1">
                                  <span>⚠</span> Pontos Negativos
                                </h5>
                                <ul className="list-disc ml-6 text-xs text-gray-700 dark:text-gray-300 space-y-1">
                                  {analysis.negative.slice(0, 5).map((point, idx) => (
                                    <li key={idx}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {patientResults.length > 0 && (
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
              <div className="space-x-2">
                <button 
                  onClick={()=>toggleAll(true)} 
                  className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Selecionar todos os questionários"
                >
                  Selecionar todos
                </button>
                <button 
                  onClick={()=>toggleAll(false)} 
                  className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Limpar seleção"
                >
                  Limpar seleção
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={handleExportCSV}
                  className="text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={patientResults.filter((_, idx) => selectedIdx[idx]).length === 0}
                  aria-label="Exportar para CSV"
                >
                  Exportar CSV
                </button>
                <button 
                  onClick={handleExportJSON}
                  className="text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={patientResults.filter((_, idx) => selectedIdx[idx]).length === 0}
                  aria-label="Exportar para JSON"
                >
                  Exportar JSON
                </button>
                <button 
                  onClick={generatePDF} 
                  className="text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={patientResults.filter((_, idx) => selectedIdx[idx]).length === 0}
                  aria-label="Gerar relatório PDF"
                >
                  {patientResults.filter((_, idx) => selectedIdx[idx]).length > 0 
                    ? `Gerar PDF (${patientResults.filter((_, idx) => selectedIdx[idx]).length} selecionado(s))`
                    : 'Gerar PDF'}
                </button>
              </div>
            </div>
          )}

          {patientResults.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-2">Referências dos Questionários Selecionados</h4>
              <ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-200 space-y-2">
                {Array.from(new Set(patientResults
                  .filter((_, idx) => selectedIdx[idx]) // Apenas questionários selecionados
                  .map(r=> (qMap[r.questionnaireId]?.acronym||'') as string)
                  .filter(Boolean)))
                  .map(acr => (
                    <li key={acr}>
                      <span className="font-medium">{acr}:</span> {citations[acr] || 'Referência não disponível.'}
                    </li>
                ))}
                {patientResults.filter((_, idx) => selectedIdx[idx]).length === 0 && (
                  <li className="text-gray-500 italic">Selecione questionários para ver as referências.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportView;


