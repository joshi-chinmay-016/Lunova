export const API_BASE_URL =
  typeof window !== 'undefined' ? '/api/v1' : 'http://127.0.0.1:8000/api/v1';

const TOKEN_STORAGE_KEY = 'lunova_auth_token';
let _token: string | null = null;

export const setAuthToken = (token: string | null) => {
  _token = token;
  if (typeof window !== 'undefined') {
    if (token) {
      try {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } catch {}
      try {
        document.cookie = `${TOKEN_STORAGE_KEY}=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      } catch {}
    } else {
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {}
      try {
        document.cookie = `${TOKEN_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
      } catch {}
    }
  }
};

export const getAuthToken = (): string | null => {
  if (_token) return _token;

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        _token = stored;
        return _token;
      }
    } catch {}

    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)' + TOKEN_STORAGE_KEY + '=([^;]*)'));
      if (match && match[2]) {
        _token = decodeURIComponent(match[2]);
        return _token;
      }
    } catch {}
  }
  return null;
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);

  // When body is FormData, do NOT set Content-Type header so the browser
  // automatically sets multipart/form-data with the correct boundary parameter.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Only clear credentials if this wasn't an auth/login endpoint itself
    const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/token');
    if (!isAuthEndpoint) {
      setAuthToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('lunova_auth_expired'));
      }
    }
    let message = 'Session expired or unauthorized';
    try {
      const errorData = await response.json();
      message = errorData.detail || errorData.message || message;
    } catch {
      // Ignore
    }
    if (message === 'Not authenticated' || message === 'Could not validate credentials') {
      message = 'Your session has expired or is unauthenticated. Please sign in to your workspace.';
    }
    throw new Error(message);
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {}
    throw new Error(message);
  }

  return response.json();
};
