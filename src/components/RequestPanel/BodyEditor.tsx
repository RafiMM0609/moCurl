import React, { useState } from 'react';
import type { RequestBody, BodyType } from '../../types';
import { KeyValueEditor } from './KeyValueEditor';
import { Sparkles, Check, AlertCircle } from 'lucide-react';

interface BodyEditorProps {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
}

const BODY_TYPES: { type: BodyType; label: string }[] = [
  { type: 'none', label: 'None' },
  { type: 'json', label: 'JSON' },
  { type: 'x-www-form-urlencoded', label: 'URL-Encoded' },
  { type: 'form-data', label: 'Form-Data' },
  { type: 'raw', label: 'Raw' }
];

export const BodyEditor: React.FC<BodyEditorProps> = ({ body, onChange }) => {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleTypeChange = (type: BodyType) => {
    onChange({ ...body, type });
  };

  const handleRawChange = (rawContent: string) => {
    onChange({ ...body, rawContent });
    if (body.type === 'json' && rawContent.trim()) {
      try {
        JSON.parse(rawContent);
        setJsonError(null);
      } catch (e: unknown) {
        setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
      }
    } else {
      setJsonError(null);
    }
  };

  const handlePrettifyJson = () => {
    try {
      const parsed = JSON.parse(body.rawContent);
      const pretty = JSON.stringify(parsed, null, 2);
      onChange({ ...body, rawContent: pretty });
      setJsonError(null);
    } catch {
      setJsonError('Cannot format: invalid JSON syntax');
    }
  };

  return (
    <div className="body-editor-wrap">
      {/* Body Type Radio Selector */}
      <div className="body-type-selector">
        {BODY_TYPES.map(bt => (
          <button
            key={bt.type}
            type="button"
            className={`body-radio-btn ${body.type === bt.type ? 'active' : ''}`}
            onClick={() => handleTypeChange(bt.type)}
          >
            {bt.label}
          </button>
        ))}
      </div>

      {body.type === 'none' && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
          This request has no body payload.
        </div>
      )}

      {(body.type === 'json' || body.type === 'raw') && (
        <div className="body-textarea-wrap">
          <textarea
            className="body-textarea"
            placeholder={body.type === 'json' ? '{\n  "key": "value"\n}' : 'Raw payload string...'}
            value={body.rawContent}
            onChange={e => handleRawChange(e.target.value)}
            spellCheck={false}
            autoCapitalize="none"
          />

          <div className="body-actions-bar">
            {body.type === 'json' && body.rawContent.trim() && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: 'auto', fontSize: '11px' }}>
                {jsonError ? (
                  <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={13} /> {jsonError}
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={13} /> Valid JSON
                  </span>
                )}
              </div>
            )}

            {body.type === 'json' && (
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handlePrettifyJson}
              >
                <Sparkles size={12} />
                <span>Prettify</span>
              </button>
            )}
          </div>
        </div>
      )}

      {body.type === 'x-www-form-urlencoded' && (
        <KeyValueEditor
          items={body.urlEncoded}
          onChange={urlEncoded => onChange({ ...body, urlEncoded })}
          keyPlaceholder="Parameter"
          valuePlaceholder="Value"
          title="URL Encoded Parameters"
        />
      )}

      {body.type === 'form-data' && (
        <KeyValueEditor
          items={body.formData}
          onChange={formData => onChange({ ...body, formData })}
          keyPlaceholder="Field Name"
          valuePlaceholder="Field Value"
          title="Multipart Form Data"
        />
      )}
    </div>
  );
};
