export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    api_calls: number;
    created_at?: string;
  };
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  native?: string;
  region: string;
  is_active?: boolean;
  stt: boolean;
  mt: boolean;
  tts: boolean;
}
