// FIX: Import React to make React namespace available for types.
import React, { useState, useEffect } from 'react';

// Função helper para tentar fazer parse de valores que podem estar em formato incorreto
function safeParseJSON<T>(value: string | null, initialValue: T, key: string): T {
  if (!value) return initialValue;
  
  // Primeiro, tentar detectar valores comuns inválidos antes de fazer parse
  const trimmed = value.trim();
  
  // Se for uma string direta sem aspas JSON (ex: "pro" ao invés de '"pro"')
  if ((trimmed === 'pro' || trimmed === 'free') && !value.startsWith('"')) {
    console.warn(`Valor inválido detectado no localStorage para "${key}": "${value}". Corrigindo automaticamente.`);
    const corrected = JSON.stringify(trimmed);
    try {
      window.localStorage.setItem(key, corrected);
      return trimmed as T;
    } catch (setError) {
      console.error(`Erro ao corrigir valor para "${key}":`, setError);
      // Se não conseguiu salvar, pelo menos retornar o valor correto
      return trimmed as T;
    }
  }
  
  try {
    // Tentar parse direto
    const parsed = JSON.parse(value);
    return parsed;
  } catch (parseError) {
    // Se ainda falhou após tentativa de correção, limpar e usar valor inicial
    console.warn(`Erro ao fazer parse do valor para "${key}": "${value}". Limpando e usando valor inicial.`);
    try {
      window.localStorage.removeItem(key);
    } catch (removeError) {
      console.error(`Erro ao remover valor inválido para "${key}":`, removeError);
    }
    return initialValue;
  }
}

function useLocalStorage<T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return safeParseJSON(item, initialValue, key);
    } catch (error) {
      console.error(`Erro ao ler localStorage para "${key}":`, error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  // Remover useEffect problemático - o useState inicial já faz a leitura
  // useEffect só causava re-renders desnecessários e erros

  return [storedValue, setValue];
}

export default useLocalStorage;