export const FORM = {
  formId: 'ortho_baseline_v1',
  locale: 'pt-BR',
  offline: { autosave: true, retryIntervalSec: 15 },
  steps: [
    { id: 'consent', type: 'consent', title: 'Consentimento LGPD',
      summary: 'Usaremos seus dados para guiar seu cuidado. Você pode revogar quando quiser.', required: true },
    { id: 'region', type: 'single_select', label: 'Qual área está incomodando?',
      options: ['Pescoço','Ombro','Cotovelo','Punho/Mão','Coluna lombar','Quadril','Joelho','Tornozelo/Pé'],
      required: true, onAnswer: { branch: { 'Coluna lombar':'odi','Joelho':'koos','Quadril':'hoos','Cotovelo':'prtee','Punho/Mão':'prwe','default':'lefs' } } },
    { id: 'pain_nprs', type: 'nprs', label: 'Dor hoje (0 = nenhuma, 10 = pior possível)', min: 0, max: 10, required: true },
    { id: 'red_flags', type: 'multi_select', label: 'Algum destes sinais de alerta?',
      options: ['Perda de controle urinário/intestino','Fraqueza acentuada recente','Febre com dor nas costas','Histórico de câncer','Trauma recente grave'],
      onAnswer: { ifAnySelected: { next: 'flag_guidance' } } },
    { id: 'flag_guidance', type: 'info', style: 'critical',
      text: 'Recomendamos avaliação clínica imediata. Procure atendimento de urgência.' },
    { id: 'lefs', type: 'scale_ref', scaleId: 'LEFS', when: { stepId:'region', equalsAny:['Quadril','Joelho','Tornozelo/Pé'] } },
    { id: 'odi',  type: 'scale_ref', scaleId: 'ODI',  when: { stepId:'region', equals:'Coluna lombar' } },
    { id: 'dash', type: 'scale_ref', scaleId: 'DASH', when: { stepId:'region', equalsAny:['Ombro','Cotovelo','Punho/Mão'] } },
    { id: 'koos', type: 'scale_ref', scaleId: 'KOOS', license: 'required', when: { stepId:'region', equals:'Joelho' } },
    { id: 'hoos', type: 'scale_ref', scaleId: 'HOOS', license: 'required', when: { stepId:'region', equals:'Quadril' } },
    { id: 'review', type: 'review' }
  ],
  validation: {
    requiredMessage: 'Este campo é obrigatório.',
    rangeMessage: 'Escolha um valor entre {{min}} e {{max}}.'
  }
} as const;


