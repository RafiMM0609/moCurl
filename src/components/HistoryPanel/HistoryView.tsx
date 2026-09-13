import React, { useState } from 'react';
import type { HistoryItem, HttpRequest } from '../../types';
import { Search, Trash2 } from 'lucide-react';

interface HistoryViewProps {
  history: HistoryItem[];
  onSelectRequest: (req: HttpRequest) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectRequest,
  onClearHistory,
  onDeleteItem
}) => {
  const [search, setSearch] = useState('');

  const filtered = history.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.request.url.toLowerCase().includes(q) ||
      item.request.method.toLowerCase().includes(q) ||
      (item.response?.status.toString().includes(q) ?? false)
    );
  });

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflowY: 'auto' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>History</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {history.length} logged executions
          </span>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              if (confirm('Clear all request history?')) onClearHistory();
            }}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      {history.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'var(--bg-surface)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Search size={14} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by URL or status..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>
      )}

      {/* History Items */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          {history.length === 0 ? 'No requests sent yet.' : 'No matching history found.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(item => {
            const res = item.response;
            const isSuccess = res && res.status >= 200 && res.status < 300;
            const isWarn = res && res.status >= 400 && res.status < 500;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  gap: '8px',
                  transition: 'background-color 0.15s ease'
                }}
                className="kv-row"
                onClick={() => onSelectRequest(item.request)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span
                    className={`method-badge ${item.request.method}`}
                    style={{ padding: '2px 6px', fontSize: '10px' }}
                  >
                    {item.request.method}
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.request.url}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>{timeAgo(item.timestamp)}</span>
                      {res && (
                        <span>• {res.duration}ms</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {res && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isSuccess ? 'var(--color-success-bg)' : isWarn ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                        color: isSuccess ? 'var(--color-success)' : isWarn ? 'var(--color-warning)' : 'var(--color-danger)'
                      }}
                    >
                      {res.status || 'ERR'}
                    </span>
                  )}

                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: '26px', height: '26px', color: 'var(--text-muted)' }}
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    title="Delete item"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
