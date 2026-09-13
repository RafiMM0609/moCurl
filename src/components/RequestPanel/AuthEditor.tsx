import React, { useState } from 'react';
import type { RequestAuth, AuthType } from '../../types';
import { Eye, EyeOff, KeyRound, Lock, User } from 'lucide-react';

interface AuthEditorProps {
  auth: RequestAuth;
  onChange: (auth: RequestAuth) => void;
}

const AUTH_TYPES: { type: AuthType; label: string }[] = [
  { type: 'none', label: 'No Auth' },
  { type: 'bearer', label: 'Bearer Token' },
  { type: 'basic', label: 'Basic Auth' },
  { type: 'apiKey', label: 'API Key' }
];

export const AuthEditor: React.FC<AuthEditorProps> = ({ auth, onChange }) => {
  const [showSecret, setShowSecret] = useState(false);

  const handleTypeChange = (type: AuthType) => {
    onChange({ ...auth, type });
  };

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Type Selector */}
      <div className="body-type-selector">
        {AUTH_TYPES.map(at => (
          <button
            key={at.type}
            type="button"
            className={`body-radio-btn ${auth.type === at.type ? 'active' : ''}`}
            onClick={() => handleTypeChange(at.type)}
          >
            {at.label}
          </button>
        ))}
      </div>

      {auth.type === 'none' && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          This request does not use any authentication credentials.
        </div>
      )}

      {/* Bearer Token */}
      {auth.type === 'bearer' && (
        <div className="form-group">
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <KeyRound size={13} /> Token
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type={showSecret ? 'text' : 'password'}
              className="form-input"
              style={{ width: '100%', paddingRight: '40px', fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={auth.bearerToken || ''}
              onChange={e => onChange({ ...auth, bearerToken: e.target.value })}
              autoCapitalize="none"
              spellCheck={false}
            />
            <button
              type="button"
              className="icon-btn"
              style={{ position: 'absolute', right: '4px' }}
              onClick={() => setShowSecret(!showSecret)}
              title={showSecret ? 'Hide token' : 'Show token'}
            >
              {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Header generated: <code>Authorization: Bearer &lt;token&gt;</code>
          </span>
        </div>
      )}

      {/* Basic Auth */}
      {auth.type === 'basic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={13} /> Username
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="admin"
              value={auth.basicUsername || ''}
              onChange={e => onChange({ ...auth, basicUsername: e.target.value })}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={13} /> Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                className="form-input"
                style={{ width: '100%', paddingRight: '40px' }}
                placeholder="password123"
                value={auth.basicPassword || ''}
                onChange={e => onChange({ ...auth, basicPassword: e.target.value })}
                autoCapitalize="none"
                spellCheck={false}
              />
              <button
                type="button"
                className="icon-btn"
                style={{ position: 'absolute', right: '4px' }}
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Will be encoded as base64 in <code>Authorization: Basic ...</code>
          </span>
        </div>
      )}

      {/* API Key */}
      {auth.type === 'apiKey' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="form-group">
            <label className="form-label">Key Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="X-API-Key or api_key"
              value={auth.apiKeyName || ''}
              onChange={e => onChange({ ...auth, apiKeyName: e.target.value })}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Key Value</label>
            <input
              type="text"
              className="form-input"
              placeholder="key_live_abcdef12345"
              value={auth.apiKeyValue || ''}
              onChange={e => onChange({ ...auth, apiKeyValue: e.target.value })}
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Add To</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`body-radio-btn ${(auth.apiKeyAddTo || 'header') === 'header' ? 'active' : ''}`}
                onClick={() => onChange({ ...auth, apiKeyAddTo: 'header' })}
              >
                Header
              </button>
              <button
                type="button"
                className={`body-radio-btn ${auth.apiKeyAddTo === 'query' ? 'active' : ''}`}
                onClick={() => onChange({ ...auth, apiKeyAddTo: 'query' })}
              >
                Query Params
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
