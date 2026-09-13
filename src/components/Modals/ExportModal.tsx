import React, { useState } from 'react';
import type { HttpRequest } from '../../types';
import { toCurl, toFetch, toPython } from '../../utils/curlExporter';
import { X, Copy, Check, Code2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: HttpRequest;
}

type SnippetLang = 'curl' | 'javascript' | 'python';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  request
}) => {
  const [lang, setLang] = useState<SnippetLang>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let snippet = '';
  if (lang === 'curl') snippet = toCurl(request);
  else if (lang === 'javascript') snippet = toFetch(request);
  else if (lang === 'python') snippet = toPython(request);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={16} color="var(--accent-primary)" />
            <span className="modal-title">Export Code Snippet</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Language Tabs */}
          <div className="subtabs-container" style={{ padding: '0 0 6px 0', border: 'none' }}>
            <button
              type="button"
              className={`pill-tab ${lang === 'curl' ? 'active' : ''}`}
              onClick={() => setLang('curl')}
            >
              cURL CLI
            </button>
            <button
              type="button"
              className={`pill-tab ${lang === 'javascript' ? 'active' : ''}`}
              onClick={() => setLang('javascript')}
            >
              JavaScript (Fetch)
            </button>
            <button
              type="button"
              className={`pill-tab ${lang === 'python' ? 'active' : ''}`}
              onClick={() => setLang('python')}
            >
              Python (Requests)
            </button>
          </div>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <pre style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: '#38bdf8',
              lineHeight: 1.6,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '260px'
            }}>
              {snippet}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
