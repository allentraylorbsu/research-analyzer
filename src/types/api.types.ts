/**
 * API Types for Research Analyzer
 * Defines interfaces for API keys and responses
 */

export interface ApiKeys {
  openaiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  legiscanKey?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: 'success' | 'error' | 'loading';
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export interface ConnectionStatus {
  openai: ConnectionState;
  supabase: ConnectionState;
  legiscan?: ConnectionState;
}

export interface ConnectionState {
  connected: boolean;
  message: string;
  lastTested?: Date;
}

export interface OpenAIModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}

export interface OpenAIChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
