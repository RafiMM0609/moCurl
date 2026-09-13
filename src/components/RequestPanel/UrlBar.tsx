import React, { useState, useRef } from 'react';
import type { HttpMethod, HttpRequest } from '../../types';
import { isCurlCommand, parseCurl } from '../../utils/curlParser';
import { ChevronDown, Send, X, Loader2, Sparkles } from 'lucide-react';

interface UrlBarProps {
  request: HttpRequest;
  isLoading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onImportCurl: (partialReq: Partial<HttpRequest>) => void;
}

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export const UrlBar: React.FC<UrlBarProps> = ({
  request,
  isLoading,
  onMethodChange,
  onUrlChange,
  onSend,
  onCancel,
  onImportCurl
}) => {
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [detectedNotice, setDetectedNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && isCurlCommand(pastedText)) {
      e.preventDefault();
      const parsed = parseCurl(pastedText);
      onImportCurl(parsed);
      setDetectedNotice(true);
      setTimeout(() => setDetectedNotice(false), 2500);
    }
  };

  const handleInputChange = (val: string) => {
    if (isCurlCommand(val)) {
      const parsed = parseCurl(val);
      onImportCurl(parsed);
      setDetectedNotice(true);
      setTimeout(() => setDetectedNotice(false), 2500);
      return;
    }
    onUrlChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (isCurlCommand(request.url)) {
        handleInputChange(request.url);
        return;
      }
      onSend();
    }
  };

  return (
    <div className="url-section" id="url-bar-container">
      {detectedNotice && (
        <div style={{
          fontSize: '11px',
          color: 'var(--accent-primary)',
          backgroundColor: 'rgba(255, 119, 0, 0.12)',
          border: '1px solid rgba(255, 119, 0, 0.28)',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Sparkles size={13} />
          <span>cURL command detected & parsed automatically!</span>
        </div>
      )}

      <div className="url-input-row">
        {/* Method Picker Dropdown */}
        <div className="method-select-wrap">
          <button
            id="btn-method-selector"
            type="button"
            className={`method-badge ${request.method}`}
            onClick={() => setShowMethodDropdown(!showMethodDropdown)}
          >
            <span>{request.method}</span>
            <ChevronDown size={14} />
          </button>

          {showMethodDropdown && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                onClick={() => setShowMethodDropdown(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '6px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                padding: '4px',
                minWidth: '110px'
              }}>
                {HTTP_METHODS.map(m => (
                  <button
                    key={m}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: request.method === m ? 'var(--bg-surface-active)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: `var(--method-${m.toLowerCase()})`,
                      textAlign: 'left'
                    }}
                    onClick={() => {
                      onMethodChange(m);
                      setShowMethodDropdown(false);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* URL Text Input */}
        <input
          id="input-request-url"
          ref={inputRef}
          type="text"
          className="url-text-input"
          placeholder="https://api.example.com/v1/resource or paste cURL"
          value={request.url}
          onChange={e => handleInputChange(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />

        {/* Clear URL button if not empty */}
        {request.url && (
          <button
            type="button"
            className="icon-btn"
            style={{ width: '26px', height: '26px' }}
            onClick={() => onUrlChange('')}
            title="Clear URL"
          >
            <X size={14} />
          </button>
        )}

        {/* Send / Cancel Action Button */}
        {isLoading ? (
          <button
            id="btn-cancel-request"
            type="button"
            className="btn-send cancel"
            onClick={onCancel}
            title="Cancel Request"
          >
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Stop</span>
          </button>
        ) : (
          <button
            id="btn-send-request"
            type="button"
            className="btn-send"
            onClick={onSend}
            title="Send Request (Enter)"
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        )}
      </div>
    </div>
  );
};
