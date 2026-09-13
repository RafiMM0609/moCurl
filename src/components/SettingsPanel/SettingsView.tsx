import React, { useState } from 'react';
import type { AppSettings, Environment } from '../../types';
import { exportAllData, importAllData } from '../../utils/storage';
import { Shield, HardDriveDownload, HardDriveUpload, Layers, Check, Info } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  environments: Environment[];
  onOpenEnvModal: () => void;
  onResetAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSettingsChange,
  environments,
  onOpenEnvModal,
  onResetAllData
}) => {
  const [copiedBackup, setCopiedBackup] = useState(false);

  const handleToggleCors = () => {
    onSettingsChange({
      ...settings,
      useCorsProxy: !settings.useCorsProxy
    });
  };

  const handleProxyUrlChange = (url: string) => {
    onSettingsChange({
      ...settings,
      corsProxyUrl: url
    });
  };

  const handleExportBackup = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mocurl-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyBackup = async () => {
    try {
      await navigator.clipboard.writeText(exportAllData());
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (content && importAllData(content)) {
        alert('Backup successfully restored! Refreshing data...');
        window.location.reload();
      } else {
        alert('Invalid backup JSON format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeEnv = environments.find(e => e.id === settings.activeEnvironmentId);

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Settings</h2>

      {/* CORS Proxy Configuration */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color={settings.useCorsProxy ? 'var(--color-info)' : 'var(--text-muted)'} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                CORS Proxy Engine
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Bypass browser Same-Origin Policy restrictions
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="kv-checkbox"
              checked={settings.useCorsProxy}
              onChange={handleToggleCors}
            />
          </label>
        </div>

        {settings.useCorsProxy && (
          <div className="form-group" style={{ marginTop: '4px' }}>
            <label className="form-label">Proxy Service URL</label>
            <input
              type="text"
              className="form-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              value={settings.corsProxyUrl}
              onChange={e => handleProxyUrlChange(e.target.value)}
              placeholder="https://api.allorigins.win/raw?url="
            />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button
                type="button"
                className="pill-tab"
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => handleProxyUrlChange('https://api.allorigins.win/raw?url=')}
              >
                AllOrigins
              </button>
              <button
                type="button"
                className="pill-tab"
                style={{ fontSize: '10px', padding: '2px 8px' }}
                onClick={() => handleProxyUrlChange('https://corsproxy.io/?url=')}
              >
                CorsProxy.io
              </button>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-start',
          fontSize: '11px',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-input)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)'
        }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Browsers block direct requests to 3rd-party servers lacking <code>Access-Control-Allow-Origin</code> headers. Enabling the CORS proxy forwards the request through a server to bypass this restriction.
          </span>
        </div>
      </div>

      {/* Environments Manager */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--accent-primary)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                Environment Variables
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Active: {activeEnv ? `${activeEnv.name} (${activeEnv.variables.length} vars)` : 'None'}
              </div>
            </div>
          </div>

          <button type="button" className="btn-secondary" style={{ fontSize: '11px' }} onClick={onOpenEnvModal}>
            Manage
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
          Data Backup & Storage
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          All data is saved locally on your device in <code>localStorage</code>. You can download or transfer your data anytime.
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}
            onClick={handleExportBackup}
          >
            <HardDriveDownload size={13} />
            <span>Download JSON</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}
            onClick={handleCopyBackup}
          >
            {copiedBackup ? <Check size={13} color="var(--color-success)" /> : <HardDriveDownload size={13} />}
            <span>{copiedBackup ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          <label className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            cursor: 'pointer'
          }}>
            <HardDriveUpload size={13} />
            <span>Restore JSON</span>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportBackupFile}
            />
          </label>
        </div>
      </div>

      {/* Reset Data */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-danger)' }}>
            Reset App Data
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Restore default sample endpoints and clear history
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ fontSize: '11px', color: 'var(--color-danger)', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          onClick={() => {
            if (confirm('Are you sure you want to reset all data to defaults?')) {
              onResetAllData();
            }
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
