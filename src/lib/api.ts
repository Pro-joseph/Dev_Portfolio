export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export function getToken(): string | null {
  return null;
}

export function setToken(_token: string): void {
  void _token;
  /* sessions are held in an HttpOnly cookie set by the server */
}

export function clearToken(): void {
  /* sessions are held in an HttpOnly cookie cleared by the server */
}

export function subscribeToken(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("jl-token", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("jl-token", callback);
    window.removeEventListener("storage", callback);
  };
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(typeof data === "object" && data !== null && "message" in data
      ? String((data as { message: unknown }).message)
      : `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function api<T>(
  path: string,
  { body, headers, ...rest }: ApiOptions = {}
): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (body !== undefined && !isForm) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(response.status, data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "PATCH", body }),
  del: <T>(path: string, options?: ApiOptions) =>
    api<T>(path, { ...options, method: "DELETE" }),
  upload: <T>(path: string, formData: FormData, options?: ApiOptions) =>
    api<T>(path, {
      ...options,
      method: "POST",
      body: formData,
      headers: {
        ...(formData.get("_method")
          ? { "X-HTTP-Method-Override": String(formData.get("_method")) }
          : {}),
      },
    }),
  download: async (path: string, options?: ApiOptions): Promise<Blob> => {
    void options;
    const headers: Record<string, string> = {
      Accept: "text/csv,application/octet-stream",
    };
    const response = await fetch(`${API_URL}${path}`, {
      headers,
      cache: "no-store",
    });
    if (!response.ok) {
      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(response.status, data);
    }
    return response.blob();
  },
};

export function requireLogin(): void {
  /* auth is enforced server-side via the HttpOnly session cookie */
}
