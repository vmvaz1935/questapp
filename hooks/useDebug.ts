/**
 * Hook React para sistema de debug
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  DiagnosticResult,
  DebugLogEntry,
  DebugPanelState,
} from '../types/debug';
import {
  runDiagnostics,
  exportDiagnostics,
  formatDiagnosticsForConsole,
} from '../utils/debug';

/**
 * Hook principal para debug
 */
export function useDebug() {
  const [state, setState] = useState<DebugPanelState>({
    isOpen: false,
    activeTab: 'auth',
    logs: [],
    isRunningDiagnostics: false,
  });
  
  const logsRef = useRef<DebugLogEntry[]>([]);
  
  /**
   * Adiciona log de debug
   */
  const addLog = useCallback((level: DebugLogEntry['level'], category: string, message: string, data?: Record<string, any>) => {
    const entry: DebugLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };
    
    logsRef.current = [...logsRef.current.slice(-99), entry]; // Manter últimos 100 logs
    setState(prev => ({
      ...prev,
      logs: logsRef.current,
    }));
  }, []);
  
  /**
   * Executa diagnóstico completo
   */
  const runDiagnostic = useCallback(async () => {
    setState(prev => ({ ...prev, isRunningDiagnostics: true }));
    addLog('info', 'diagnostics', 'Iniciando diagnóstico completo...');
    
    try {
      const result = await runDiagnostics();
      setState(prev => ({
        ...prev,
        lastDiagnostic: result,
        isRunningDiagnostics: false,
      }));
      addLog('info', 'diagnostics', 'Diagnóstico concluído com sucesso');
      return result;
    } catch (error) {
      addLog('error', 'diagnostics', 'Erro ao executar diagnóstico', { error: String(error) });
      setState(prev => ({ ...prev, isRunningDiagnostics: false }));
      throw error;
    }
  }, [addLog]);
  
  /**
   * Exporta diagnóstico
   */
  const exportDiagnostic = useCallback(async () => {
    addLog('info', 'export', 'Exportando diagnóstico...');
    try {
      const json = await exportDiagnostics();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fisioq-diagnostic-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog('info', 'export', 'Diagnóstico exportado com sucesso');
    } catch (error) {
      addLog('error', 'export', 'Erro ao exportar diagnóstico', { error: String(error) });
      throw error;
    }
  }, [addLog]);
  
  /**
   * Limpa logs
   */
  const clearLogs = useCallback(() => {
    logsRef.current = [];
    setState(prev => ({ ...prev, logs: [] }));
    addLog('info', 'logs', 'Logs limpos');
  }, [addLog]);
  
  /**
   * Abre/fecha painel de debug
   */
  const togglePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);
  
  /**
   * Define aba ativa
   */
  const setActiveTab = useCallback((tab: DebugPanelState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);
  
  /**
   * Abre painel
   */
  const openPanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: true }));
  }, []);
  
  /**
   * Fecha painel
   */
  const closePanel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  return {
    state,
    addLog,
    runDiagnostic,
    exportDiagnostic,
    clearLogs,
    togglePanel,
    setActiveTab,
    openPanel,
    closePanel,
    formatDiagnosticsForConsole,
  };
}

/**
 * Hook para executar diagnóstico automaticamente
 */
export function useDiagnostics(interval?: number) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const run = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runDiagnostics();
      setDiagnostics(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (interval && interval > 0) {
      run();
      const timer = setInterval(run, interval);
      return () => clearInterval(timer);
    }
  }, [interval, run]);
  
  return {
    diagnostics,
    isLoading,
    error,
    run,
  };
}

/**
 * Hook para logs de debug em tempo real
 */
export function useDebugLog() {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  
  const addLog = useCallback((level: DebugLogEntry['level'], category: string, message: string, data?: Record<string, any>) => {
    const entry: DebugLogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };
    
    setLogs(prev => [...prev.slice(-99), entry]); // Manter últimos 100 logs
  }, []);
  
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);
  
  return {
    logs,
    addLog,
    clearLogs,
  };
}

