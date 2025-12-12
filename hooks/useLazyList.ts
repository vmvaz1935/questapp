import React, { useState, useEffect, useCallback, useRef } from 'react';

export interface UseLazyListOptions<T> {
  items: T[];
  initialPageSize?: number;
  incrementSize?: number;
  threshold?: number; // Distância do final para carregar mais (em pixels)
}

export interface UseLazyListReturn<T> {
  displayedItems: T[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
  reset: () => void;
}

/**
 * Hook para lazy loading de listas grandes
 * Carrega itens incrementalmente conforme necessário
 */
export function useLazyList<T>({
  items,
  initialPageSize = 20,
  incrementSize = 20,
  threshold = 200,
}: UseLazyListOptions<T>): UseLazyListReturn<T> {
  const [displayedCount, setDisplayedCount] = useState(initialPageSize);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  
  // Expor ref no retorno
  const returnValue = {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
  } as UseLazyListReturn<T> & { loadMoreRef: React.RefObject<HTMLDivElement> };
  
  (returnValue as any).loadMoreRef = loadMoreRef;

  const displayedItems = items.slice(0, displayedCount);
  const hasMore = displayedCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // Simular pequeno delay para UX suave
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + incrementSize, items.length));
      setIsLoading(false);
    }, 100);
  }, [isLoading, hasMore, incrementSize, items.length]);

  const reset = useCallback(() => {
    setDisplayedCount(initialPageSize);
  }, [initialPageSize]);

  // Intersection Observer para carregar automaticamente ao scroll
  useEffect(() => {
    if (!hasMore || !loadMoreRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore, threshold]);

  const returnValue: UseLazyListReturn<T> & { loadMoreRef: React.RefObject<HTMLDivElement> } = {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
    loadMoreRef, // Para anexar ao elemento de trigger
  };
  
  return returnValue;
}

