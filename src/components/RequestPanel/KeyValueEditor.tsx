import React from 'react';
import type { KeyValuePair } from '../../types';
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react';

interface KeyValueEditorProps {
  items: KeyValuePair[];
  onChange: (items: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  suggestions?: string[];
  title?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  suggestions = [],
  title
}) => {
  const handleToggle = (id: string) => {
    onChange(items.map(item => (item.id === id ? { ...item, enabled: !item.enabled } : item)));
  };

  const handleKeyChange = (id: string, key: string) => {
    onChange(items.map(item => (item.id === id ? { ...item, key } : item)));
  };

  const handleValueChange = (id: string, value: string) => {
    onChange(items.map(item => (item.id === id ? { ...item, value } : item)));
  };

  const handleDelete = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleAdd = () => {
    const newItem: KeyValuePair = {
      id: crypto.randomUUID(),
      key: '',
      value: '',
      enabled: true
    };
    onChange([...items, newItem]);
  };

  const handleAddSuggestion = (key: string) => {
    // If already exists, toggle or don't duplicate
    const existing = items.find(i => i.key.toLowerCase() === key.toLowerCase());
    if (existing) {
      onChange(items.map(i => (i.id === existing.id ? { ...i, enabled: true } : i)));
    } else {
      onChange([
        ...items,
        {
          id: crypto.randomUUID(),
          key,
          value: '',
          enabled: true
        }
      ]);
    }
  };

  return (
    <div className="kv-editor">
      {title && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="form-label">{title}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {items.filter(i => i.enabled).length}/{items.length} active
          </span>
        </div>
      )}

      {/* Quick Suggestion Chips */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {suggestions.map(sug => (
            <button
              key={sug}
              type="button"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              onClick={() => handleAddSuggestion(sug)}
            >
              + {sug}
            </button>
          ))}
        </div>
      )}

      {/* Rows */}
      {items.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '24px 12px',
          color: 'var(--text-muted)',
          fontSize: '12px',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)'
        }}>
          No items added yet. Tap "+ Add Row" below to configure.
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} className="kv-row" style={{ opacity: item.enabled ? 1 : 0.55 }}>
            <button
              type="button"
              className="icon-btn"
              style={{ width: '28px', height: '28px', color: item.enabled ? 'var(--accent-primary)' : 'var(--text-muted)' }}
              onClick={() => handleToggle(item.id)}
              title={item.enabled ? 'Disable' : 'Enable'}
            >
              {item.enabled ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>

            <input
              type="text"
              className="kv-input"
              placeholder={keyPlaceholder}
              value={item.key}
              onChange={e => handleKeyChange(item.id, e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
            />

            <div className="kv-divider" />

            <input
              type="text"
              className="kv-input"
              placeholder={valuePlaceholder}
              value={item.value}
              onChange={e => handleValueChange(item.id, e.target.value)}
              autoCapitalize="none"
              spellCheck={false}
            />

            <button
              type="button"
              className="icon-btn"
              style={{ width: '28px', height: '28px', color: 'var(--text-muted)' }}
              onClick={() => handleDelete(item.id)}
              title="Delete row"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}

      <button type="button" className="btn-add-row" onClick={handleAdd}>
        <Plus size={15} />
        <span>Add Row</span>
      </button>
    </div>
  );
};
