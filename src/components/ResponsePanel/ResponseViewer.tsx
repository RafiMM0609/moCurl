import React, { useState } from 'react';
import type { HttpResponse, ResponseSubTab } from '../../types';
import { JsonViewer } from './JsonViewer';
import { Clock, HardDrive, ShieldAlert, RotateCw, Copy, Check, BookmarkPlus } from 'lucide-react';

interface ResponseViewerProps {
  response: HttpResponse | null;
  isLoading: boolean;
  onRetryWithProxy: () => void;
  onSaveToCollection: () => void;
  onSetBearerToken?: (token: string) => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  isLoading,
  onRetryWithProxy,
  onSaveToCollection,
  onSetBearerToken
}) => {
  const [subTab, setSubTab] = useState<ResponseSubTab>('pretty');
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedHeaderKey, setCopiedHeaderKey] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '30px',
        color: 'var(--text-muted)',
        gap: '16px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--border-default)',
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '13px' }}>Sending request...</span>
      </div>
    );
  }

  if (!response) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px 20px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)'
        }}>
          <RotateCw size={24} />
        </div>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>
          No Response Yet
        </div>
        <p style={{ fontSize: '12px', maxWidth: '280px', lineHeight: 1.5 }}>
          Enter a URL or paste a cURL command in the Request tab and tap <strong>Send</strong> to inspect the response.
        </p>
      </div>
    );
  }

  // Format size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isSuccess = response.status >= 200 && response.status < 300;

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(response.body);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyHeader = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedHeaderKey(key);
      setTimeout(() => setCopiedHeaderKey(null), 1800);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="response-view">
      {/* Top Status & Metrics Bar */}
      <div className="response-status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className={`status-badge ${
              isSuccess ? 'success' : response.status >= 400 && response.status < 500 ? 'warn' : 'danger'
            }`}
          >
            {response.status ? `${response.status} ${response.statusText}` : response.statusText}
          </span>
        </div>

        <div className="response-metrics">
          <div className="metric-item" title="Duration">
            <Clock size={13} />
            <span>{response.duration} ms</span>
          </div>
          <div className="metric-item" title="Payload size">
            <HardDrive size={13} />
            <span>{formatSize(response.size)}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            style={{ width: '28px', height: '28px' }}
            onClick={onSaveToCollection}
            title="Save to Collection"
          >
            <BookmarkPlus size={15} />
          </button>
        </div>
      </div>

      {/* Error / CORS Alert Banner */}
      {response.error && (
        <div style={{
          padding: '12px 14px',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          borderBottom: '1px solid rgba(244, 63, 94, 0.25)',
          color: 'var(--text-primary)',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          userSelect: 'text',
          WebkitUserSelect: 'text'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontWeight: 600 }}>
            <ShieldAlert size={16} />
            <span>{response.error}</span>
          </div>
          {response.status === 0 && (
            <button
              type="button"
              className="btn-primary"
              style={{
                alignSelf: 'flex-start',
                fontSize: '11px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={onRetryWithProxy}
            >
              <RotateCw size={12} />
              <span>Enable CORS Proxy & Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Sub-tabs: Pretty / Raw / Headers */}
      <div className="subtabs-container">
        <button
          type="button"
          className={`pill-tab ${subTab === 'pretty' ? 'active' : ''}`}
          onClick={() => setSubTab('pretty')}
        >
          Pretty
        </button>
        <button
          type="button"
          className={`pill-tab ${subTab === 'raw' ? 'active' : ''}`}
          onClick={() => setSubTab('raw')}
        >
          Raw
        </button>
        <button
          type="button"
          className={`pill-tab ${subTab === 'headers' ? 'active' : ''}`}
          onClick={() => setSubTab('headers')}
        >
          Headers ({Object.keys(response.headers).length})
        </button>
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {subTab === 'pretty' && (
          <JsonViewer
            jsonString={response.body || (response.error ? `// Error details:\n${response.error}` : '// Empty body')}
            onSetBearerToken={onSetBearerToken}
          />
        )}

        {subTab === 'raw' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)'
            }}>
              <button
                type="button"
                className="icon-btn"
                style={{ width: '28px', height: '28px' }}
                onClick={handleCopyRaw}
                title="Copy Raw Body"
              >
                {copiedRaw ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
              </button>
            </div>
            <textarea
              readOnly
              style={{
                flex: 1,
                width: '100%',
                background: 'var(--bg-input)',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                padding: '12px',
                paddingBottom: '28px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                userSelect: 'text',
                WebkitUserSelect: 'text'
              }}
              value={response.body}
            />
          </div>
        )}

        {subTab === 'headers' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', paddingBottom: '28px', minHeight: 0 }}>
            {Object.keys(response.headers).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
                No response headers available.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  {Object.entries(response.headers).map(([key, value]) => (
                    <tr key={key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{
                        padding: '8px 4px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--accent-primary)',
                        width: '32%',
                        wordBreak: 'break-all',
                        userSelect: 'text',
                        WebkitUserSelect: 'text'
                      }}>
                        {key}
                      </td>
                      <td style={{
                        padding: '8px 4px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-primary)',
                        wordBreak: 'break-all',
                        userSelect: 'text',
                        WebkitUserSelect: 'text'
                      }}>
                        {value}
                      </td>
                      <td style={{
                        width: '28px',
                        padding: '8px 2px',
                        textAlign: 'right',
                        verticalAlign: 'middle',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}>
                        <button
                          type="button"
                          className="icon-btn"
                          style={{ width: '22px', height: '22px' }}
                          onClick={() => handleCopyHeader(value, key)}
                          title={`Copy ${key} value`}
                        >
                          {copiedHeaderKey === key ? (
                            <Check size={12} color="var(--color-success)" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
