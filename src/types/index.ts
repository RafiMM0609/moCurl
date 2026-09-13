export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  description?: string;
}

export type BodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw';

export interface RequestBody {
  type: BodyType;
  rawContent: string;
  formData: KeyValuePair[];
  urlEncoded: KeyValuePair[];
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey';

export interface RequestAuth {
  type: AuthType;
  bearerToken?: string;
  basicUsername?: string;
  basicPassword?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyAddTo?: 'header' | 'query';
}

export interface HttpRequest {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: RequestBody;
  auth: RequestAuth;
}

export interface HttpResponse {
  status: number;
  statusText: string;
  duration: number; // in milliseconds
  size: number; // in bytes
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  timestamp: number;
  error?: string;
}

export interface HistoryItem {
  id: string;
  request: HttpRequest;
  response?: {
    status: number;
    statusText: string;
    duration: number;
    size: number;
    timestamp: number;
    error?: string;
  };
  timestamp: number;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  request: HttpRequest;
}

export interface CollectionFolder {
  id: string;
  name: string;
  items: CollectionItem[];
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
}

export interface AppSettings {
  useCorsProxy: boolean;
  corsProxyUrl: string;
  activeEnvironmentId: string | null;
  theme: 'dark' | 'light';
  autoSwitchResponse: boolean;
}

export type ActiveTab = 'request' | 'response' | 'collections' | 'history' | 'settings';
export type RequestSubTab = 'params' | 'headers' | 'body' | 'auth';
export type ResponseSubTab = 'pretty' | 'raw' | 'headers';
