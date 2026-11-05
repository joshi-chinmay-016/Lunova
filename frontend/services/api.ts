export const API_BASE_URL = 'http://localhost:8000/api/v1';

const TOKEN_STORAGE_KEY = 'lunova_auth_token';
let _token: string | null = null;

export const setAuthToken = (token: string | null) => {
  _token = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
};

export const getAuthToken = (): string | null => {
  if (!_token && typeof window !== 'undefined') {
    _token = localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return _token;
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
