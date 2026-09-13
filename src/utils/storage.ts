import type {
  HttpRequest,
  HistoryItem,
  CollectionFolder,
  Environment,
  AppSettings,
  KeyValuePair,
  HttpMethod,
  CollectionItem
} from '../types';

const STORAGE_KEYS = {
  HISTORY: 'mocurl_history',
  COLLECTIONS: 'mocurl_collections',
  ENVIRONMENTS: 'mocurl_environments',
  SETTINGS: 'mocurl_settings',
  CURRENT_REQUEST: 'mocurl_current_request'
};

export const DEFAULT_REQUEST: HttpRequest = {
  id: 'default-req',
  name: 'New Request',
  url: 'https://httpbin.org/get',
  method: 'GET',
  params: [
    { id: 'p1', key: 'query', value: 'hello', enabled: true },
    { id: 'p2', key: 'device', value: 'mobile', enabled: true }
  ],
  headers: [
    { id: 'h1', key: 'Accept', value: 'application/json', enabled: true }
  ],
  body: {
    type: 'json',
    rawContent: '{\n  "message": "Hello from MoCurl!"\n}',
    formData: [],
    urlEncoded: []
  },
  auth: {
    type: 'none'
  }
};

export const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: 'env-default',
    name: 'Development (Demo)',
    variables: [
      { id: 'v1', key: 'baseUrl', value: 'https://httpbin.org', enabled: true },
      { id: 'v2', key: 'apiKey', value: 'mock-key-12345', enabled: true }
    ]
  }
];

export const DEFAULT_COLLECTIONS: CollectionFolder[] = [
  {
    id: 'col-samples',
    name: 'Sample Endpoints',
    items: [
      {
        id: 'sample-1',
        name: 'Get IP & Headers',
        description: 'Test simple GET request',
        request: {
          id: 'req-sample-1',
          name: 'Get IP & Headers',
          url: 'https://httpbin.org/get',
          method: 'GET',
          params: [{ id: 'sp1', key: 'format', value: 'json', enabled: true }],
          headers: [{ id: 'sh1', key: 'Accept', value: 'application/json', enabled: true }],
          body: { type: 'none', rawContent: '', formData: [], urlEncoded: [] },
          auth: { type: 'none' }
        }
      },
      {
        id: 'sample-2',
        name: 'Send JSON Body',
        description: 'Test POST request with JSON payload',
        request: {
          id: 'req-sample-2',
          name: 'Send JSON Body',
          url: 'https://httpbin.org/post',
          method: 'POST',
          params: [],
          headers: [{ id: 'sh2', key: 'Content-Type', value: 'application/json', enabled: true }],
          body: {
            type: 'json',
            rawContent: '{\n  "client": "MoCurl",\n  "status": "ready",\n  "pwa": true\n}',
            formData: [],
            urlEncoded: []
          },
          auth: { type: 'none' }
        }
      },
      {
        id: 'sample-3',
        name: 'Bearer Token Auth',
        description: 'Test authorization bearer token',
        request: {
          id: 'req-sample-3',
          name: 'Bearer Token Auth',
          url: 'https://httpbin.org/bearer',
          method: 'GET',
          params: [],
          headers: [],
          body: { type: 'none', rawContent: '', formData: [], urlEncoded: [] },
          auth: { type: 'bearer', bearerToken: 'mocurl-jwt-sample-token' }
        }
      }
    ]
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  useCorsProxy: true,
  corsProxyUrl: '/api/proxy',
  activeEnvironmentId: 'env-default',
  theme: 'dark',
  autoSwitchResponse: true
};

// Storage Helpers

export function loadCurrentRequest(): HttpRequest {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_REQUEST);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load current request from storage', e);
  }
  return DEFAULT_REQUEST;
}

export function saveCurrentRequest(req: HttpRequest): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_REQUEST, JSON.stringify(req));
  } catch (e) {
    console.warn('Failed to save current request', e);
  }
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load history', e);
  }
  return [];
}

export function saveHistory(history: HistoryItem[]): void {
  try {
    // Keep maximum 100 history items
    const trimmed = history.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save history', e);
  }
}

export function addHistoryItem(item: HistoryItem): HistoryItem[] {
  const current = loadHistory();
  const updated = [item, ...current.filter(h => h.id !== item.id)].slice(0, 100);
  saveHistory(updated);
  return updated;
}

export function loadCollections(): CollectionFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load collections', e);
  }
  return DEFAULT_COLLECTIONS;
}

export function saveCollections(collections: CollectionFolder[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
  } catch (e) {
    console.warn('Failed to save collections', e);
  }
}

export function loadEnvironments(): Environment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENVIRONMENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load environments', e);
  }
  return DEFAULT_ENVIRONMENTS;
}

export function saveEnvironments(environments: Environment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ENVIRONMENTS, JSON.stringify(environments));
  } catch (e) {
    console.warn('Failed to save environments', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate old public proxy URLs that failed on POST to /api/proxy
      if (!parsed.corsProxyUrl || parsed.corsProxyUrl.includes('allorigins') || parsed.corsProxyUrl.includes('corsproxy.io')) {
        parsed.corsProxyUrl = '/api/proxy';
        parsed.useCorsProxy = true;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load settings', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
}

// Backup & Restore
export function exportAllData(): string {
  const data = {
    mocurl_version: '1.0.0',
    exported_at: new Date().toISOString(),
    collections: loadCollections(),
    environments: loadEnvironments(),
    history: loadHistory(),
    settings: loadSettings()
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.collections) saveCollections(data.collections);
    if (data.environments) saveEnvironments(data.environments);
    if (data.history) saveHistory(data.history);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch (e) {
    console.error('Failed to import backup JSON', e);
    return false;
  }
}

// Postman Collection v2.1 Importer
interface PostmanItem {
  name: string;
  request?: {
    method?: string;
    url?: string | { raw?: string };
    header?: Array<{ key: string; value: string }>;
    body?: {
      mode?: string;
      raw?: string;
      urlencoded?: Array<{ key: string; value: string }>;
      formdata?: Array<{ key: string; value: string }>;
    };
    auth?: {
      type?: string;
      bearer?: Array<{ key: string; value: string }>;
      basic?: Array<{ key: string; value: string }>;
    };
  };
  item?: PostmanItem[];
}

export function importPostmanCollection(jsonString: string): CollectionFolder | null {
  try {
    const data = JSON.parse(jsonString);
    const folderName = data.info?.name || 'Imported Postman Collection';
    const folderId = 'col-' + crypto.randomUUID();
    const items: CollectionItem[] = [];

    const traverseItems = (postmanItems: PostmanItem[]) => {
      for (const pItem of postmanItems) {
        if (pItem.request) {
          const req = pItem.request;
          let rawUrl = '';
          if (typeof req.url === 'string') {
            rawUrl = req.url;
          } else if (req.url && req.url.raw) {
            rawUrl = req.url.raw;
          }

          const headers: KeyValuePair[] = (req.header || []).map(h => ({
            id: crypto.randomUUID(),
            key: h.key,
            value: h.value,
            enabled: true
          }));

          const params: KeyValuePair[] = [];
          if (rawUrl && rawUrl.includes('?')) {
            const queryStr = rawUrl.substring(rawUrl.indexOf('?') + 1);
            const searchParams = new URLSearchParams(queryStr);
            searchParams.forEach((val, key) => {
              params.push({
                id: crypto.randomUUID(),
                key,
                value: val,
                enabled: true
              });
            });
            rawUrl = rawUrl.substring(0, rawUrl.indexOf('?'));
          }

          const mode = req.body?.mode;
          let bodyType: HttpRequest['body']['type'] = 'none';
          let rawContent = '';
          const formData: KeyValuePair[] = [];
          const urlEncoded: KeyValuePair[] = [];

          if (mode === 'raw') {
            bodyType = 'json';
            rawContent = req.body?.raw || '';
          } else if (mode === 'urlencoded') {
            bodyType = 'x-www-form-urlencoded';
            (req.body?.urlencoded || []).forEach(u => {
              urlEncoded.push({
                id: crypto.randomUUID(),
                key: u.key,
                value: u.value,
                enabled: true
              });
            });
          } else if (mode === 'formdata') {
            bodyType = 'form-data';
            (req.body?.formdata || []).forEach(f => {
              formData.push({
                id: crypto.randomUUID(),
                key: f.key,
                value: f.value,
                enabled: true
              });
            });
          }

          // Auth
          const auth: HttpRequest['auth'] = { type: 'none' };
          if (req.auth?.type === 'bearer') {
            auth.type = 'bearer';
            const bearerEntry = (req.auth.bearer || []).find(b => b.key === 'token');
            auth.bearerToken = bearerEntry?.value || '';
          } else if (req.auth?.type === 'basic') {
            auth.type = 'basic';
            const userEntry = (req.auth.basic || []).find(b => b.key === 'username');
            const passEntry = (req.auth.basic || []).find(b => b.key === 'password');
            auth.basicUsername = userEntry?.value || '';
            auth.basicPassword = passEntry?.value || '';
          }

          items.push({
            id: 'item-' + crypto.randomUUID(),
            name: pItem.name || 'Request',
            request: {
              id: 'req-' + crypto.randomUUID(),
              name: pItem.name || 'Request',
              url: rawUrl,
              method: (req.method?.toUpperCase() as HttpMethod) || 'GET',
              params,
              headers,
              body: {
                type: bodyType,
                rawContent,
                formData,
                urlEncoded
              },
              auth
            }
          });
        }

        if (pItem.item && Array.isArray(pItem.item)) {
          traverseItems(pItem.item);
        }
      }
    };

    if (data.item && Array.isArray(data.item)) {
      traverseItems(data.item);
    }

    return {
      id: folderId,
      name: folderName,
      items
    };
  } catch (e) {
    console.error('Failed to parse Postman collection', e);
    return null;
  }
}
