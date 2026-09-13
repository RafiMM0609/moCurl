import React from 'react';
import type { Environment, AppSettings } from '../types';
import { ClipboardPaste, Shield, ShieldAlert, Code2, Layers, Terminal } from 'lucide-react';

interface HeaderBarProps {
  environments: Environment[];
  settings: AppSettings;
  onOpenEnvModal: () => void;
  onOpenExportModal: () => void;
  onToggleCorsProxy: () => void;
  onPasteCurl: () => void;
  onOpenCurlModal?: () => void;
  onSelectTab: (tab: 'request' | 'settings') => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  environments,
  settings,
  onOpenEnvModal,
  onOpenExportModal,
  onToggleCorsProxy,
  onPasteCurl,
  onOpenCurlModal,
  onSelectTab
}) => {
  const activeEnv = environments.find(e => e.id === settings.activeEnvironmentId);

  return (
    <header className="header-bar" id="app-header">
      <div className="brand-section" onClick={() => onSelectTab('request')} title="MoCurl Mobile API Client">
        <img src="/favicon.svg" alt="MoCurl Logo" className="brand-logo" />
        <span className="brand-name">MoCurl</span>
      </div>

      <div className="header-actions">
        {/* Quick Paste cURL Button */}
        <button
          id="btn-quick-paste"
          className="icon-btn"
          title="Paste cURL from Clipboard"
          onClick={onPasteCurl}
        >
          <ClipboardPaste size={18} />
        </button>

        {/* Manual cURL Import Modal */}
        {onOpenCurlModal && (
          <button
            id="btn-manual-curl"
            className="icon-btn"
            title="Import Raw cURL Command"
            onClick={onOpenCurlModal}
          >
            <Terminal size={18} style={{ color: 'var(--accent-primary)' }} />
          </button>
        )}

        {/* CORS Proxy Toggle */}
        <button
          id="btn-cors-toggle"
          className={`icon-btn ${settings.useCorsProxy ? 'active' : ''}`}
          title={settings.useCorsProxy ? 'CORS Proxy Active (Bypasses CORS)' : 'Direct Fetch (CORS Proxy Disabled)'}
          onClick={onToggleCorsProxy}
        >
          {settings.useCorsProxy ? (
            <Shield size={18} style={{ color: 'var(--color-info)' }} />
          ) : (
            <ShieldAlert size={18} style={{ color: 'var(--text-muted)' }} />
          )}
        </button>

        {/* Code Snippet Export */}
        <button
          id="btn-export-code"
          className="icon-btn"
          title="Export as cURL / Fetch / Python"
          onClick={onOpenExportModal}
        >
          <Code2 size={18} />
        </button>

        {/* Active Environment Selector */}
        <button
          id="btn-env-select"
          className="env-button"
          onClick={onOpenEnvModal}
          title="Manage Environments"
        >
          <Layers size={12} />
          <span>{activeEnv ? activeEnv.name : 'No Env'}</span>
          {activeEnv && <span className="env-dot" />}
        </button>
      </div>
    </header>
  );
};
