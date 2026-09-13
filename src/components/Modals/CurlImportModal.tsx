import React, { useState } from 'react';
import { parseCurl } from '../../utils/curlParser';
import type { HttpRequest } from '../../types';
import { X, Sparkles, AlertCircle } from 'lucide-react';

interface CurlImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (partialReq: Partial<HttpRequest>) => void;
}

export const CurlImportModal: React.FC<CurlImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [curlText, setCurlText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    if (!curlText.trim()) {
      setError('Please paste a cURL command string.');
      return;
    }

    try {
      const parsed = parseCurl(curlText);
      if (!parsed.url) {
        setError('Could not extract a valid URL from the provided cURL.');
        return;
      }
      onImport(parsed);
      onClose();
      setCurlText('');
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to parse cURL command.');
    }
  };

  const handlePasteSample = () => {
    setCurlText(`curl -X POST https://httpbin.org/post \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer my-sample-jwt-token' \\
  -d '{"message": "Hello from imported cURL!", "success": true}'`);
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span className="modal-title">Import cURL Command</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Paste any cURL bash command (e.g., copied from browser DevTools, terminal, or API documentation).
          </span>

          <textarea
            className="form-input"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              minHeight: '140px',
              lineHeight: 1.5,
              resize: 'vertical'
            }}
            placeholder="curl -X POST 'https://api.example.com/login' -H 'Content-Type: application/json' -d '...'"
            value={curlText}
            onChange={e => {
              setCurlText(e.target.value);
              setError(null);
            }}
            autoFocus
            spellCheck={false}
          />

          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={13} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              className="pill-tab"
              style={{ fontSize: '11px', color: 'var(--accent-primary)' }}
              onClick={handlePasteSample}
            >
              Paste Sample cURL
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleParse}>
            Parse & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
