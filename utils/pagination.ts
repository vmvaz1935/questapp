/**
 * Utilitários para paginação e lazy loading em IndexedDB
 */

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Pagina resultados de uma query Dexie
 */
export async function paginateQuery<T>(
  query: any,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page, pageSize, sortBy, sortOrder = 'desc' } = options;
  
  // Contar total
  const total = await query.count();
  
  // Aplicar ordenação se especificada
  let sortedQuery = query;
  if (sortBy) {
    sortedQuery = sortOrder === 'asc' 
      ? query.sortBy(sortBy)
      : query.reverse().sortBy(sortBy);
  }
  
  // Calcular offset
  const offset = (page - 1) * pageSize;
  
  // Buscar página
  const data = await sortedQuery.offset(offset).limit(pageSize).toArray();
  
  const totalPages = Math.ceil(total / pageSize);
  
  return {
    data: data as T[],
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Busca incremental (lazy loading) - retorna próximos N itens
 */
export async function loadMore<T>(
  query: any,
  currentCount: number,
  increment: number = 20
): Promise<T[]> {
  const items = await query
    .offset(currentCount)
    .limit(increment)
    .toArray();
  
  return items as T[];
}

