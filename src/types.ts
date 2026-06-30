export interface User {
  id: number;
  username: string;
  email: string;
  hashed_password?: string;
  is_active: boolean;
  api_calls: number;
  created_at: string;
}

export interface TranslationHistory {
  id: number;
  user_id: number | null;
  source_text: string;
  translated_text: string;
  source_lang_code: string;
  target_lang_code: string;
  detected_lang: string | null;
  confidence: number;
  character_count: number;
  source: string; // "api", "whatsapp", "telegram", "custom", etc.
  message_id: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface WebhookConfig {
  id: number;
  user_id: number;
  platform: string; // "whatsapp" | "telegram" | "custom"
  endpoint_url: string;
  secret_token: string;
  default_target_lang: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    api_calls: number;
    created_at: string;
  };
}

export interface TranslateRequest {
  text: string;
  source_lang: string; // code or "auto"
  target_lang: string; // code
  engine?: "demo" | "gemini";
}

export interface TranslateResponse {
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  detected_lang: string | null;
  confidence: number;
  character_count: number;
  engine: "demo" | "gemini";
}

export interface BatchTranslateRequest {
  texts: string[];
  source_lang: string;
  target_lang: string;
  engine?: "demo" | "gemini";
}

export interface BatchTranslateResponse {
  results: TranslateResponse[];
  total_characters: number;
}

export interface DetectLanguageRequest {
  text: string;
}

export interface DetectLanguageResponse {
  detected_lang: string;
  language_name: string;
  confidence: number;
  alternatives: { lang: string; confidence: number }[];
}
