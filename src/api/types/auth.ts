/** Body của POST /users/login. Đối chiếu lại với tab Payload trong DevTools. */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
