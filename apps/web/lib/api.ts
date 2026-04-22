import axios, { AxiosError } from 'axios';

const baseURL =
  typeof window === 'undefined'
    ? process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
    : '';

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    if (typeof window !== 'undefined') localStorage.setItem('accessToken', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    if (typeof window !== 'undefined') localStorage.removeItem('accessToken');
  }
}

export function setRefreshToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('refreshToken', token);
  else localStorage.removeItem('refreshToken');
}

export function bootstrapAuth() {
  if (typeof window === 'undefined') return;
  const t = localStorage.getItem('accessToken');
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      const rt = localStorage.getItem('refreshToken');
      const original = error.config as any;
      if (rt && original && !original._retry) {
        original._retry = true;
        try {
          const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken: rt });
          setAuthToken(data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api.request(original);
        } catch {
          setAuthToken(null);
          setRefreshToken(null);
          if (!location.pathname.startsWith('/login')) location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function extractError(err: unknown): string {
  const e = err as AxiosError<{ error?: { message?: string } }>;
  return e?.response?.data?.error?.message ?? e?.message ?? 'Request failed';
}
