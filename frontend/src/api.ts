const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type ApiErrorBody = {
  error?: string;
  details?: unknown;
};

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    },
    ...init
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? ((await response.json()) as ApiErrorBody) : null;

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return body as T;
}

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
};

export type ApiTask = {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  owner: ApiUser;
};