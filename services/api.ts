interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

class ApiError extends Error {
  status: number;
  response?: Response;
  payload?: unknown;

  constructor(message: string, status: number, response?: Response, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
    this.payload = payload;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers ?? {}),
  };

  if (!options?.skipAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal: options?.signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      (payload as Record<string, string>)?.error ?? "Erro na requisição",
      response.status,
      response,
      payload,
    );
  }

  return {
    data: payload as T,
    status: response.status,
  };
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, undefined, options),
  setAccessToken,
  ApiError,
  baseUrl: API_BASE_URL,
};

export type { ApiError };
