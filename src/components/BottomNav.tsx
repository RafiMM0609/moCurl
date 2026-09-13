import React from 'react';
import type { ActiveTab, HttpResponse } from '../types';
import { Send, ArrowDownToLine, FolderGit2, History, Settings2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  lastResponse: HttpResponse | null;
  isLoading: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  lastResponse,
  isLoading
}) => {
  return (
    <nav className="bottom-nav" id="bottom-navigation">
      <button
        id="nav-tab-request"
        className={`nav-item ${activeTab === 'request' ? 'active' : ''}`}
        onClick={() => onTabChange('request')}
      >
        {activeTab === 'request' && <div className="nav-indicator" />}
        <Send size={19} />
        <span>Request</span>
      </button>

      <button
        id="nav-tab-response"
        className={`nav-item ${activeTab === 'response' ? 'active' : ''}`}
        onClick={() => onTabChange('response')}
      >
        {activeTab === 'response' && <div className="nav-indicator" />}
        <ArrowDownToLine size={19} />
        <span>Response</span>
        {isLoading ? (
          <span
            className="nav-badge-dot"
            style={{ backgroundColor: 'var(--color-info)', animation: 'pulse 1s infinite' }}
          />
        ) : lastResponse ? (
          <span
            className="nav-badge-dot"
            style={{
              backgroundColor:
                lastResponse.status >= 200 && lastResponse.status < 300
                  ? 'var(--color-success)'
                  : lastResponse.status >= 400
                  ? 'var(--color-danger)'
                  : 'var(--color-warning)'
            }}
          />
        ) : null}
      </button>

      <button
        id="nav-tab-collections"
        className={`nav-item ${activeTab === 'collections' ? 'active' : ''}`}
        onClick={() => onTabChange('collections')}
      >
        {activeTab === 'collections' && <div className="nav-indicator" />}
        <FolderGit2 size={19} />
        <span>Collections</span>
      </button>

      <button
        id="nav-tab-history"
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => onTabChange('history')}
      >
        {activeTab === 'history' && <div className="nav-indicator" />}
        <History size={19} />
        <span>History</span>
      </button>

      <button
        id="nav-tab-settings"
        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        {activeTab === 'settings' && <div className="nav-indicator" />}
        <Settings2 size={19} />
        <span>Settings</span>
      </button>
    </nav>
  );
};
