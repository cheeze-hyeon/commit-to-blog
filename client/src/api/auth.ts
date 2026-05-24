import api from './client';

export interface AuthUser {
  login: string;
  name: string;
  avatarUrl: string;
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch {
    return null;
  }
}

export function logout(): Promise<void> {
  return api.post('/auth/logout').then(() => {});
}
