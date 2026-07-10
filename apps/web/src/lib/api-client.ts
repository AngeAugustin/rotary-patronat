const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

let csrfToken: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

type ApiError = Error & { code?: string; status?: number };

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/csrf`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Impossible de récupérer le jeton CSRF');
  }

  const json = (await response.json()) as { data: { csrfToken: string } };
  csrfToken = json.data.csrfToken;
  return csrfToken;
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    csrfToken = null;
    csrfTokenPromise = null;
  } else if (csrfToken) {
    return csrfToken;
  }

  if (!csrfTokenPromise) {
    csrfTokenPromise = fetchCsrfToken().finally(() => {
      csrfTokenPromise = null;
    });
  }

  return csrfTokenPromise;
}

export function clearCsrfToken() {
  csrfToken = null;
  csrfTokenPromise = null;
}

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuth?: boolean;
  skipCsrf?: boolean;
  /** Empêche une nouvelle tentative après refresh (évite les boucles). */
  skipAuthRefresh?: boolean;
}

async function apiRequestOnce<T>(
  path: string,
  options: ApiRequestOptions,
  csrfForceRefresh = false,
): Promise<T> {
  const { body, skipAuth, skipCsrf, headers, method = 'GET', ...rest } = options;
  const isMutation = method !== 'GET' && method !== 'HEAD';

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  if (isMutation && !skipCsrf) {
    const token = await ensureCsrfToken(csrfForceRefresh);
    requestHeaders['X-CSRF-Token'] = token;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    method,
    headers: requestHeaders,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    const message =
      json?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
    const error = new Error(message) as ApiError;
    error.code = json?.error?.code;
    error.status = response.status;
    throw error;
  }

  return json as T;
}

/** Renouvelle l'access token via le cookie refresh (une seule requête à la fois). */
export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await apiRequestOnce<{ data: { accessToken: string } }>(
          '/auth/refresh',
          { method: 'POST', skipAuth: true, skipAuthRefresh: true },
        );
        setAccessToken(response.data.accessToken);
        return true;
      } catch {
        setAccessToken(null);
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function isAuthPath(path: string) {
  return path.startsWith('/auth/');
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const isMutation = (options.method ?? 'GET') !== 'GET' && options.method !== 'HEAD';

  try {
    return await apiRequestOnce<T>(path, options);
  } catch (error) {
    const apiError = error as ApiError;

    if (
      isMutation &&
      (apiError.code === 'CSRF_INVALID' || apiError.code === 'CSRF_MISSING')
    ) {
      clearCsrfToken();
      return apiRequestOnce<T>(path, options, true);
    }

    if (
      !options.skipAuth &&
      !options.skipAuthRefresh &&
      !isAuthPath(path) &&
      (apiError.status === 401 || apiError.code === 'UNAUTHORIZED')
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequestOnce<T>(path, { ...options, skipAuthRefresh: true });
      }
    }

    throw error;
  }
}
