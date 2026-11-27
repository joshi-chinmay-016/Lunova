export const API_BASE_URL = 'http://localhost:8000/api/v1';

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
  headers.set('Content-Type', 'application/json');

  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Clear expired or invalid credentials
    setAuthToken(null);
    let message = 'Session expired or unauthorized';
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Ignore
    }
    throw new Error(message);
  }

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch {
      // Ignore
    }
    throw new Error(message);
  }

  return response.json();
};
