import React from 'react';
import type { RequestSubTab, HttpRequest } from '../../types';

interface RequestTabsProps {
  activeSubTab: RequestSubTab;
  onSubTabChange: (subTab: RequestSubTab) => void;
  request: HttpRequest;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  activeSubTab,
  onSubTabChange,
  request
}) => {
  const activeParamsCount = request.params.filter(p => p.enabled && p.key.trim()).length;
  const activeHeadersCount = request.headers.filter(h => h.enabled && h.key.trim()).length;
  const hasBody = request.body.type !== 'none';
  const hasAuth = request.auth.type !== 'none';

  return (
    <div className="subtabs-container" id="request-subtabs">
      <button
        id="subtab-params"
        type="button"
        className={`pill-tab ${activeSubTab === 'params' ? 'active' : ''}`}
        onClick={() => onSubTabChange('params')}
      >
        <span>Params</span>
        {activeParamsCount > 0 && <span className="tab-badge">{activeParamsCount}</span>}
      </button>

      <button
        id="subtab-headers"
        type="button"
        className={`pill-tab ${activeSubTab === 'headers' ? 'active' : ''}`}
        onClick={() => onSubTabChange('headers')}
      >
        <span>Headers</span>
        {activeHeadersCount > 0 && <span className="tab-badge">{activeHeadersCount}</span>}
      </button>

      <button
        id="subtab-body"
        type="button"
        className={`pill-tab ${activeSubTab === 'body' ? 'active' : ''}`}
        onClick={() => onSubTabChange('body')}
      >
        <span>Body</span>
        {hasBody && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-info)'
            }}
          />
        )}
      </button>

      <button
        id="subtab-auth"
        type="button"
        className={`pill-tab ${activeSubTab === 'auth' ? 'active' : ''}`}
        onClick={() => onSubTabChange('auth')}
      >
        <span>Auth</span>
        {hasAuth && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success)'
            }}
          />
        )}
      </button>
    </div>
  );
};
