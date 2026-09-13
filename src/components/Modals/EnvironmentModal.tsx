import React, { useState } from 'react';
import type { Environment, KeyValuePair } from '../../types';
import { KeyValueEditor } from '../RequestPanel/KeyValueEditor';
import { X, Plus, Trash2, CheckCircle2, Layers } from 'lucide-react';

interface EnvironmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  environments: Environment[];
  activeEnvironmentId: string | null;
  onEnvironmentsChange: (envs: Environment[]) => void;
  onSetActiveEnvironment: (envId: string | null) => void;
}

export const EnvironmentModal: React.FC<EnvironmentModalProps> = ({
  isOpen,
  onClose,
  environments,
  activeEnvironmentId,
  onEnvironmentsChange,
  onSetActiveEnvironment
}) => {
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    activeEnvironmentId || environments[0]?.id || ''
  );
  const [newEnvName, setNewEnvName] = useState('');
  const [showAddEnv, setShowAddEnv] = useState(false);

  if (!isOpen) return null;

  const currentEnv = environments.find(e => e.id === selectedEnvId) || environments[0];

  const handleCreateEnv = () => {
    if (!newEnvName.trim()) return;
    const newEnv: Environment = {
      id: 'env-' + crypto.randomUUID(),
      name: newEnvName.trim(),
      variables: [
        { id: 'v1', key: 'baseUrl', value: 'https://api.example.com', enabled: true }
      ]
    };
    const updated = [...environments, newEnv];
    onEnvironmentsChange(updated);
    setSelectedEnvId(newEnv.id);
    onSetActiveEnvironment(newEnv.id);
    setNewEnvName('');
    setShowAddEnv(false);
  };

  const handleDeleteEnv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (environments.length <= 1) {
      alert('You must keep at least one environment.');
      return;
    }
    const filtered = environments.filter(e => e.id !== id);
    onEnvironmentsChange(filtered);
    if (activeEnvironmentId === id) {
      onSetActiveEnvironment(filtered[0]?.id || null);
    }
    if (selectedEnvId === id) {
      setSelectedEnvId(filtered[0]?.id || '');
    }
  };

  const handleVariablesChange = (kvItems: KeyValuePair[]) => {
    if (!currentEnv) return;
    const updatedEnvs = environments.map(env => {
      if (env.id === currentEnv.id) {
        return {
          ...env,
          variables: kvItems.map(item => ({
            id: item.id,
            key: item.key,
            value: item.value,
            enabled: item.enabled
          }))
        };
      }
      return env;
    });
    onEnvironmentsChange(updatedEnvs);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--accent-primary)" />
            <span className="modal-title">Environment Variables</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '14px' }}>
          {/* Environments list / tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {environments.map(env => {
              const isCurrent = env.id === currentEnv?.id;
              const isActive = env.id === activeEnvironmentId;
              return (
                <div
                  key={env.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isCurrent ? 'var(--bg-surface-active)' : 'var(--bg-input)',
                    border: `1px solid ${isCurrent ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    cursor: 'pointer',
                    fontSize: '12px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setSelectedEnvId(env.id)}
                >
                  <span style={{ fontWeight: isCurrent ? 700 : 500, color: 'var(--text-primary)' }}>
                    {env.name}
                  </span>
                  {isActive && (
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }} title="Active in requests">
                      <CheckCircle2 size={13} />
                    </span>
                  )}
                  {environments.length > 1 && (
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }}
                      onClick={e => handleDeleteEnv(env.id, e)}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="pill-tab"
              style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowAddEnv(true)}
            >
              <Plus size={13} />
              <span>New Env</span>
            </button>
          </div>

          {/* Add Env Inline Form */}
          {showAddEnv && (
            <div style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: 'var(--bg-input)',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)'
            }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
                placeholder="Environment Name (e.g. Staging)"
                value={newEnvName}
                onChange={e => setNewEnvName(e.target.value)}
                autoFocus
              />
              <button type="button" className="btn-primary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={handleCreateEnv}>
                Save
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => setShowAddEnv(false)}>
                Cancel
              </button>
            </div>
          )}

          {/* Current Env Actions */}
          {currentEnv && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Use in URL or headers as <code>{'{{variableName}}'}</code>
              </div>

              {currentEnv.id !== activeEnvironmentId ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => onSetActiveEnvironment(currentEnv.id)}
                >
                  Set as Active Env
                </button>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Currently Active
                </span>
              )}
            </div>
          )}

          {/* Variables Table */}
          {currentEnv && (
            <KeyValueEditor
              items={currentEnv.variables.map(v => ({
                id: v.id,
                key: v.key,
                value: v.value,
                enabled: v.enabled
              }))}
              onChange={handleVariablesChange}
              keyPlaceholder="Variable Name (e.g. baseUrl)"
              valuePlaceholder="Value (e.g. https://api.com)"
            />
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
