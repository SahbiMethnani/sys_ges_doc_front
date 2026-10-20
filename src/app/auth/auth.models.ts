export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  display_name?: string;
  email?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  display_name: string | null;
  role: 'user' | 'admin';
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface AuthMessageResponse {
  message: string;
}
