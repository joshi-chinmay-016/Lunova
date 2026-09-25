export const API_BASE_URL = 'http://localhost:8000/api/v1';

// Super simple token mock for Phase 1. In Phase 4 we use JWT, so this gets a valid token.
let _token: string | null = null;

export const setAuthToken = (token: string) => {
  _token = token;
};

export const getAuthToken = () => _token;

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (_token) {
    headers.set('Authorization', `Bearer ${_token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData.detail || message;
    } catch (e) {
      // Ignore
    }
    throw new Error(message);
  }

  return response.json();
};
