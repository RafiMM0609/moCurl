import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  HttpRequest,
  HttpResponse,
  ActiveTab,
  RequestSubTab,
  CollectionFolder,
  Environment,
  AppSettings,
  CollectionItem,
  HistoryItem
} from './types';
import {
  loadCurrentRequest,
  saveCurrentRequest,
  loadCollections,
  saveCollections,
  loadEnvironments,
  saveEnvironments,
  loadHistory,
  saveHistory,
  addHistoryItem,
  loadSettings,
  saveSettings,
  DEFAULT_REQUEST,
  DEFAULT_COLLECTIONS,
  DEFAULT_ENVIRONMENTS,
  DEFAULT_SETTINGS
} from './utils/storage';
import { executeHttpRequest } from './utils/httpClient';
import { useClipboardCurl } from './hooks/useClipboardCurl';

import { HeaderBar } from './components/HeaderBar';
import { BottomNav } from './components/BottomNav';
import { UrlBar } from './components/RequestPanel/UrlBar';
import { RequestTabs } from './components/RequestPanel/RequestTabs';
import { KeyValueEditor } from './components/RequestPanel/KeyValueEditor';
import { BodyEditor } from './components/RequestPanel/BodyEditor';
import { AuthEditor } from './components/RequestPanel/AuthEditor';
import { ResponseViewer } from './components/ResponsePanel/ResponseViewer';
import { CollectionsView } from './components/CollectionsPanel/CollectionsView';
import { HistoryView } from './components/HistoryPanel/HistoryView';
import { SettingsView } from './components/SettingsPanel/SettingsView';

import { CurlImportModal } from './components/Modals/CurlImportModal';
import { EnvironmentModal } from './components/Modals/EnvironmentModal';
import { ExportModal } from './components/Modals/ExportModal';
import { SaveRequestModal } from './components/Modals/SaveRequestModal';

import { Sparkles, X } from 'lucide-react';

export const App: React.FC = () => {
  // Persistence state
  const [request, setRequest] = useState<HttpRequest>(loadCurrentRequest);
  const [collections, setCollections] = useState<CollectionFolder[]>(loadCollections);
  const [environments, setEnvironments] = useState<Environment[]>(loadEnvironments);
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Runtime UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('request');
  const [requestSubTab, setRequestSubTab] = useState<RequestSubTab>('params');
  const [lastResponse, setLastResponse] = useState<HttpResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [showCurlModal, setShowCurlModal] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-save current request
  useEffect(() => {
    saveCurrentRequest(request);
  }, [request]);

  // Handle cURL import callback
  const handleImportCurl = useCallback((partialReq: Partial<HttpRequest>) => {
    setRequest(prev => ({
      ...prev,
      ...partialReq,
      id: prev.id,
      body: {
        ...prev.body,
        ...(partialReq.body || {})
      },
      auth: {
        ...prev.auth,
        ...(partialReq.auth || {})
      }
    }));
    setActiveTab('request');
  }, []);

  // Quick set Bearer Token from response
  const handleSetBearerToken = useCallback((token: string) => {
    setRequest(prev => ({
      ...prev,
      auth: {
        ...prev.auth,
        type: 'bearer',
        bearerToken: token
      }
    }));
  }, []);

  // Clipboard Watcher Hook
  const {
    showToast: showClipboardToast,
    applyDetectedCurl,
    dismissToast: dismissClipboardToast,
    manualPasteFromClipboard
  } = useClipboardCurl({
    onRequestImported: handleImportCurl
  });

  // Common Header suggestions
  const HEADER_SUGGESTIONS = [
    'Accept',
    'Content-Type',
    'Authorization',
    'User-Agent',
    'Cache-Control',
    'X-Requested-With'
  ];

  // Send HTTP Request
  const handleSend = async (overrideProxy?: boolean) => {
    if (!request.url.trim()) {
      alert('Please enter a request URL.');
      return;
    }

    // Abort previous if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    const activeEnv = environments.find(e => e.id === settings.activeEnvironmentId);
    const useProxy = overrideProxy !== undefined ? overrideProxy : settings.useCorsProxy;

    try {
      const resp = await executeHttpRequest({
        request,
        variables: activeEnv?.variables || [],
        useCorsProxy: useProxy,
        corsProxyUrl: settings.corsProxyUrl,
        signal: controller.signal
      });

      setLastResponse(resp);

      // Log to history
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        request: { ...request },
        response: {
          status: resp.status,
          statusText: resp.statusText,
          duration: resp.duration,
          size: resp.size,
          timestamp: resp.timestamp,
          error: resp.error
        },
        timestamp: Date.now()
      };
      const updatedHistory = addHistoryItem(historyItem);
      setHistory(updatedHistory);

      // Auto switch to response tab if enabled
      if (settings.autoSwitchResponse) {
        setActiveTab('response');
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Request aborted by user
      } else {
        console.error('Execution error', e);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  };

  const handleRetryWithProxy = () => {
    const updatedSettings = { ...settings, useCorsProxy: true };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    handleSend(true);
  };

  const handleSaveToCollection = (folderId: string, item: CollectionItem) => {
    const updated = collections.map(folder => {
      if (folder.id === folderId) {
        return {
          ...folder,
          items: [item, ...folder.items]
        };
      }
      return folder;
    });
    setCollections(updated);
    saveCollections(updated);
    alert(`Saved "${item.name}" to collection!`);
  };

  const handleResetAllData = () => {
    localStorage.clear();
    setRequest(DEFAULT_REQUEST);
    setCollections(DEFAULT_COLLECTIONS);
    setEnvironments(DEFAULT_ENVIRONMENTS);
    setHistory([]);
    setSettings(DEFAULT_SETTINGS);
    setLastResponse(null);
    alert('App reset to initial clean state.');
  };

  return (
    <div className="app-container" id="mocurl-root">
      {/* Sticky Header Bar */}
      <HeaderBar
        environments={environments}
        settings={settings}
        onOpenEnvModal={() => setShowEnvModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onToggleCorsProxy={() => {
          const nextVal = !settings.useCorsProxy;
          const updated = { ...settings, useCorsProxy: nextVal };
          setSettings(updated);
          saveSettings(updated);
        }}
        onPasteCurl={manualPasteFromClipboard}
        onOpenCurlModal={() => setShowCurlModal(true)}
        onSelectTab={setActiveTab}
      />

      {/* Detected cURL Banner on focus / resume */}
      {showClipboardToast && (
        <div className="clipboard-toast">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} />
            <span>cURL detected in clipboard!</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button type="button" className="toast-btn" onClick={applyDetectedCurl}>
              Import cURL
            </button>
            <button
              type="button"
              className="icon-btn"
              style={{ width: '22px', height: '22px', color: '#ffffff' }}
              onClick={dismissClipboardToast}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Content Area */}
      <main className="content-area">
        {activeTab === 'request' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* Top Method + URL input + Send */}
            <UrlBar
              request={request}
              isLoading={isLoading}
              onMethodChange={method => setRequest(r => ({ ...r, method }))}
              onUrlChange={url => setRequest(r => ({ ...r, url }))}
              onSend={() => handleSend()}
              onCancel={handleCancel}
              onImportCurl={handleImportCurl}
            />

            {/* Sub-tabs: Params | Headers | Body | Auth */}
            <RequestTabs
              activeSubTab={requestSubTab}
              onSubTabChange={setRequestSubTab}
              request={request}
            />

            {/* Tab Editor Contents */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: '24px' }}>
              {requestSubTab === 'params' && (
                <KeyValueEditor
                  items={request.params}
                  onChange={params => setRequest(r => ({ ...r, params }))}
                  keyPlaceholder="Parameter"
                  valuePlaceholder="Value"
                  title="Query Parameters"
                />
              )}

              {requestSubTab === 'headers' && (
                <KeyValueEditor
                  items={request.headers}
                  onChange={headers => setRequest(r => ({ ...r, headers }))}
                  keyPlaceholder="Header Name"
                  valuePlaceholder="Header Value"
                  suggestions={HEADER_SUGGESTIONS}
                  title="HTTP Headers"
                />
              )}

              {requestSubTab === 'body' && (
                <BodyEditor
                  body={request.body}
                  onChange={body => setRequest(r => ({ ...r, body }))}
                />
              )}

              {requestSubTab === 'auth' && (
                <AuthEditor
                  auth={request.auth}
                  onChange={auth => setRequest(r => ({ ...r, auth }))}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'response' && (
          <ResponseViewer
            response={lastResponse}
            isLoading={isLoading}
            onRetryWithProxy={handleRetryWithProxy}
            onSaveToCollection={() => setShowSaveModal(true)}
            onSetBearerToken={handleSetBearerToken}
          />
        )}

        {activeTab === 'collections' && (
          <CollectionsView
            collections={collections}
            onCollectionsChange={cols => {
              setCollections(cols);
              saveCollections(cols);
            }}
            onSelectRequest={req => {
              setRequest(req);
              setActiveTab('request');
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onSelectRequest={req => {
              setRequest(req);
              setActiveTab('request');
            }}
            onClearHistory={() => {
              setHistory([]);
              saveHistory([]);
            }}
            onDeleteItem={id => {
              const updated = history.filter(h => h.id !== id);
              setHistory(updated);
              saveHistory(updated);
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSettingsChange={st => {
              setSettings(st);
              saveSettings(st);
            }}
            environments={environments}
            onOpenEnvModal={() => setShowEnvModal(true)}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Bottom Thumb Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastResponse={lastResponse}
        isLoading={isLoading}
      />

      {/* Modals */}
      <CurlImportModal
        isOpen={showCurlModal}
        onClose={() => setShowCurlModal(false)}
        onImport={handleImportCurl}
      />

      <EnvironmentModal
        isOpen={showEnvModal}
        onClose={() => setShowEnvModal(false)}
        environments={environments}
        activeEnvironmentId={settings.activeEnvironmentId}
        onEnvironmentsChange={envs => {
          setEnvironments(envs);
          saveEnvironments(envs);
        }}
        onSetActiveEnvironment={envId => {
          const updated = { ...settings, activeEnvironmentId: envId };
          setSettings(updated);
          saveSettings(updated);
        }}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        request={request}
      />

      <SaveRequestModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        request={request}
        collections={collections}
        onSave={handleSaveToCollection}
      />
    </div>
  );
};

export default App;
