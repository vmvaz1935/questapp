import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDatabase } from '../services/database';
import { useAuth } from '../context/AuthContext';
import { DraftData } from '../services/database';

/**
 * Hook para gerenciar rascunhos de questionários
 */
export function useDrafts() {
  const { professionalId } = useAuth();
  const db = professionalId ? getDatabase(professionalId) : null;

  // Listar todos os rascunhos
  const drafts = useLiveQuery(async () => {
    if (!db || !professionalId) return [];
    
    try {
      return await db.drafts
        .where('professionalId')
        .equals(professionalId)
        .reverse()
        .sortBy('updatedAt');
    } catch (error) {
      console.error('Erro ao carregar rascunhos:', error);
      return [];
    }
  }, [db, professionalId]);

  // Salvar rascunho
  const saveDraft = useCallback(async (
    questionnaireId: string,
    answers: Record<string, number>,
    patientId?: string,
    progress?: number
  ): Promise<string> => {
    if (!db || !professionalId) {
      throw new Error('Database não disponível');
    }

    try {
      const draftId = `draft_${questionnaireId}_${patientId || 'no_patient'}_${Date.now()}`;
      const now = new Date().toISOString();
      
      // Calcular progresso se não fornecido
      let calculatedProgress = progress;
      if (calculatedProgress === undefined) {
        // [HIPÓTESE] Assumindo que precisamos contar itens respondidos
        // Isso seria melhor calculado no componente
        calculatedProgress = Object.keys(answers).length;
      }

      // Verificar se já existe rascunho para este questionário e paciente
      const existingDraft = await db.drafts
        .where('[questionnaireId+patientId]')
        .equals([questionnaireId, patientId || ''])
        .first();

      if (existingDraft) {
        // Atualizar rascunho existente
        await db.drafts.update(existingDraft.id!, {
          answers,
          progress: calculatedProgress,
          updatedAt: now,
        });
        return existingDraft.draftId;
      } else {
        // Criar novo rascunho
        await db.drafts.add({
          draftId,
          questionnaireId,
          patientId: patientId || '',
          professionalId,
          answers,
          progress: calculatedProgress || 0,
          createdAt: now,
          updatedAt: now,
        });
        return draftId;
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      throw error;
    }
  }, [db, professionalId]);

  // Carregar rascunho específico
  const loadDraft = useCallback(async (draftId: string): Promise<DraftData | null> => {
    if (!db) return null;

    try {
      const draft = await db.drafts.where('draftId').equals(draftId).first();
      return draft || null;
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
      return null;
    }
  }, [db]);

  // Deletar rascunho
  const deleteDraft = useCallback(async (draftId: string): Promise<void> => {
    if (!db) return;

    try {
      await db.drafts.where('draftId').equals(draftId).delete();
    } catch (error) {
      console.error('Erro ao deletar rascunho:', error);
      throw error;
    }
  }, [db]);

  // Carregar rascunho por questionário e paciente
  const loadDraftByQuestionnaire = useCallback(async (
    questionnaireId: string,
    patientId?: string
  ): Promise<DraftData | null> => {
    if (!db) return null;

    try {
      const draft = await db.drafts
        .where('[questionnaireId+patientId]')
        .equals([questionnaireId, patientId || ''])
        .first();
      return draft || null;
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
      return null;
    }
  }, [db]);

  return {
    drafts: drafts || [],
    saveDraft,
    loadDraft,
    deleteDraft,
    loadDraftByQuestionnaire,
  };
}

