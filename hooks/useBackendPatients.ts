import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient, { isBackendEnabled } from '../services/apiClient';
import { getDatabase } from '../services/database';
import { BackendSyncService } from '../services/backendSync';
import type { Patient } from '../types';

interface UseBackendPatientsResult {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  createPatient: (data: Omit<Patient, 'id'>) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<Patient>) => Promise<Patient>;
  deletePatient: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useBackendPatients(): UseBackendPatientsResult {
  const { professionalId, accessToken } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar pacientes (local ou backend)
  const fetchPatients = useCallback(async () => {
    if (!professionalId) {
      setPatients([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isBackendEnabled() && accessToken) {
        // Buscar do backend
        const response = await apiClient.get('/patients');
        const backendPatients = response.data.data || [];
        
        // Converter para formato local
        const formattedPatients: Patient[] = backendPatients.map((p: any) => ({
          id: p.id,
          nome: p.name,
          idade: p.age,
          sexo: p.gender,
          diagnostico: p.diagnosis,
          ladoAcometido: p.sidedAffected,
          medico: p.referringDoctor,
          fisioterapeuta: p.physiotherapist,
        }));

        setPatients(formattedPatients);

        // Sincronizar com IndexedDB
        const db = getDatabase(professionalId);
        for (const patient of backendPatients) {
          await db.patients.put({
            patientId: patient.id,
            professionalId,
            data: {
              id: patient.id,
              nome: patient.name,
              idade: patient.age,
              sexo: patient.gender,
              diagnostico: patient.diagnosis,
              ladoAcometido: patient.sidedAffected,
              medico: patient.referringDoctor,
              fisioterapeuta: patient.physiotherapist,
            },
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
          });
        }
      } else {
        // Buscar do IndexedDB (modo offline)
        const db = getDatabase(professionalId);
        const localPatients = await db.patients.toArray();
        const formattedPatients: Patient[] = localPatients.map((p) => ({
          id: p.data.id || p.patientId,
          nome: p.data.nome || p.data.name,
          idade: p.data.idade || p.data.age,
          sexo: p.data.sexo || p.data.gender,
          diagnostico: p.data.diagnostico || p.data.diagnosis,
          ladoAcometido: p.data.ladoAcometido || p.data.sidedAffected,
          medico: p.data.medico || p.data.referringDoctor,
          fisioterapeuta: p.data.fisioterapeuta || p.data.physiotherapist,
        }));
        setPatients(formattedPatients);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, accessToken]);

  // Criar paciente
  const createPatient = useCallback(async (data: Omit<Patient, 'id'>): Promise<Patient> => {
    if (!professionalId) {
      throw new Error('Professional ID required');
    }

    const newPatient: Patient = {
      id: `patient_${Date.now()}_${Math.random()}`,
      ...data,
    };

    // Salvar localmente primeiro (offline-first)
    const db = getDatabase(professionalId);
    await db.patients.add({
      patientId: newPatient.id,
      professionalId,
      data: newPatient,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Adicionar à fila de sincronização
    await BackendSyncService.queueChange({
      entityType: 'PATIENT',
      entityId: newPatient.id,
      operation: 'CREATE',
      localTimestamp: new Date().toISOString(),
      data: {
        name: newPatient.nome,
        age: newPatient.idade,
        gender: newPatient.sexo,
        diagnosis: newPatient.diagnostico,
        sidedAffected: newPatient.ladoAcometido,
        referringDoctor: newPatient.medico,
        physiotherapist: newPatient.fisioterapeuta,
      },
    });

    // Tentar sincronizar imediatamente
    if (isBackendEnabled() && accessToken) {
      try {
        const response = await apiClient.post('/patients', {
          name: newPatient.nome,
          age: newPatient.idade,
          gender: newPatient.sexo,
          diagnosis: newPatient.diagnostico,
          sidedAffected: newPatient.ladoAcometido,
          referringDoctor: newPatient.medico,
          physiotherapist: newPatient.fisioterapeuta,
        });

        // Atualizar com ID do servidor
        const serverPatient = response.data;
        newPatient.id = serverPatient.id;

        const localPatient = await db.patients.where('patientId').equals(newPatient.id).first();
        if (localPatient) {
          await db.patients.update(localPatient.id!, {
            patientId: serverPatient.id,
            data: { ...newPatient, id: serverPatient.id },
            updatedAt: serverPatient.updatedAt,
          });
        }
      } catch (error) {
        console.warn('Failed to create patient on server, will sync later:', error);
      }
    }

    setPatients((prev) => [...prev, newPatient]);
    return newPatient;
  }, [professionalId, accessToken]);

  // Atualizar paciente
  const updatePatient = useCallback(async (id: string, data: Partial<Patient>): Promise<Patient> => {
    if (!professionalId) {
      throw new Error('Professional ID required');
    }

    const db = getDatabase(professionalId);
    const localPatient = await db.patients.where('patientId').equals(id).first();

    if (!localPatient) {
      throw new Error('Patient not found');
    }

    const updatedPatient: Patient = {
      ...(localPatient.data as Patient),
      ...data,
      id,
    };

    // Atualizar localmente
    await db.patients.update(localPatient.id!, {
      data: updatedPatient,
      updatedAt: new Date().toISOString(),
    });

    // Adicionar à fila de sincronização
    await BackendSyncService.queueChange({
      entityType: 'PATIENT',
      entityId: id,
      operation: 'UPDATE',
      localTimestamp: new Date().toISOString(),
      data: {
        name: updatedPatient.nome,
        age: updatedPatient.idade,
        gender: updatedPatient.sexo,
        diagnosis: updatedPatient.diagnostico,
        sidedAffected: updatedPatient.ladoAcometido,
        referringDoctor: updatedPatient.medico,
        physiotherapist: updatedPatient.fisioterapeuta,
      },
    });

    // Tentar sincronizar imediatamente
    if (isBackendEnabled() && accessToken) {
      try {
        await apiClient.put(`/patients/${id}`, {
          name: updatedPatient.nome,
          age: updatedPatient.idade,
          gender: updatedPatient.sexo,
          diagnosis: updatedPatient.diagnostico,
          sidedAffected: updatedPatient.ladoAcometido,
          referringDoctor: updatedPatient.medico,
          physiotherapist: updatedPatient.fisioterapeuta,
        });
      } catch (error) {
        console.warn('Failed to update patient on server, will sync later:', error);
      }
    }

    setPatients((prev) => prev.map((p) => (p.id === id ? updatedPatient : p)));
    return updatedPatient;
  }, [professionalId, accessToken]);

  // Deletar paciente
  const deletePatient = useCallback(async (id: string): Promise<void> => {
    if (!professionalId) {
      throw new Error('Professional ID required');
    }

    const db = getDatabase(professionalId);
    const localPatient = await db.patients.where('patientId').equals(id).first();

    if (localPatient) {
      await db.patients.delete(localPatient.id!);
    }

    // Adicionar à fila de sincronização
    await BackendSyncService.queueChange({
      entityType: 'PATIENT',
      entityId: id,
      operation: 'DELETE',
      localTimestamp: new Date().toISOString(),
      data: {},
    });

    // Tentar sincronizar imediatamente
    if (isBackendEnabled() && accessToken) {
      try {
        await apiClient.delete(`/patients/${id}`);
      } catch (error) {
        console.warn('Failed to delete patient on server, will sync later:', error);
      }
    }

    setPatients((prev) => prev.filter((p) => p.id !== id));
  }, [professionalId, accessToken]);

  // Buscar pacientes ao montar
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return {
    patients,
    isLoading,
    error,
    createPatient,
    updatePatient,
    deletePatient,
    refresh: fetchPatients,
  };
}

