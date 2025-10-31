import { FORM } from './formSchema';

export type Answers = Record<string, any>;

export function nextStepId(currentId: string | null, answers: Answers): string | null {
  const steps = FORM.steps as any[];
  const idx = currentId ? steps.findIndex(s => s.id === currentId) : -1;
  let i = idx + 1;
  while (i < steps.length) {
    const step = steps[i];
    if (step.when) {
      const v = answers[step.when.stepId];
      const cond = step.when as any;
      if (cond.equals !== undefined && v !== cond.equals) { i++; continue; }
      if (cond.equalsAny && !cond.equalsAny.includes(v)) { i++; continue; }
    }
    return step.id;
  }
  return null;
}

export function branchFromAnswer(stepId: string, value: any) {
  const step: any = (FORM.steps as any[]).find(s => s.id === stepId);
  const b = step?.onAnswer?.branch;
  if (!b) return null;
  return b[value] ?? b.default ?? null;
}


