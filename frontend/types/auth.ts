export interface UserProfile {
  id: string;
  company_id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  company_name?: string;
}
