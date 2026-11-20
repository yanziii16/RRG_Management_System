const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details; // [{ field, message }] for form errors
  }
}

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  // The backend sends a fresh token on every request: a login lasts 30 minutes of inactivity
  const fresh = res.headers.get('X-Refresh-Token');
  if (fresh) setToken(fresh);

  const data = await res.json().catch(() => null);

  if (res.status === 401 && token && path !== '/api/auth/login') onUnauthorized();
  if (!res.ok) throw new ApiError(data?.error || 'Something went wrong', res.status, data?.details);
  return data;
}