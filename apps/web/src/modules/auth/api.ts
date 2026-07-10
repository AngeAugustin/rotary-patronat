import { AuthUser, loginSchema, type LoginInput } from '@rotary/shared-types';
import {
  apiRequest,
  clearCsrfToken,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
} from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

interface AuthResponse {
  data: {
    accessToken: string;
    user: AuthUser;
  };
}

interface MeResponse {
  data: AuthUser;
}

type SessionPayload = AuthResponse['data'];

export async function refreshSession(): Promise<SessionPayload | null> {
  const refreshed = await refreshAccessToken();
  if (!refreshed) return null;

  const accessToken = getAccessToken();
  if (!accessToken) return null;

  try {
    const user = await fetchCurrentUser();
    return { accessToken, user };
  } catch {
    setAccessToken(null);
    return null;
  }
}

export async function login(input: LoginInput) {
  const parsed = loginSchema.parse(input);
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: parsed,
    skipAuth: true,
  });
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await apiRequest<MeResponse>('/auth/me');
  return response.data;
}

export async function logout() {
  await apiRequest('/auth/logout', { method: 'POST' });
  setAccessToken(null);
  clearCsrfToken();
}

export { queryKeys as authQueryKeys };
