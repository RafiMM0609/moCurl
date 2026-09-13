import React, { useState } from 'react';
import type { CollectionFolder, HttpRequest } from '../../types';
import { importPostmanCollection } from '../../utils/storage';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Upload,
  Play
} from 'lucide-react';

interface CollectionsViewProps {
  collections: CollectionFolder[];
  onCollectionsChange: (collections: CollectionFolder[]) => void;
  onSelectRequest: (req: HttpRequest) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  collections,
  onCollectionsChange,
  onSelectRequest
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    [collections[0]?.id || '']: true
  });
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);

  const toggleFolder = (folderId: string) => {
    setOpenFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: CollectionFolder = {
      id: 'col-' + crypto.randomUUID(),
      name: newFolderName.trim(),
      items: []
    };
    onCollectionsChange([...collections, newFolder]);
    setNewFolderName('');
    setShowAddFolder(false);
    setOpenFolders(prev => ({ ...prev, [newFolder.id]: true }));
  };

  const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this collection and all its requests?')) {
      onCollectionsChange(collections.filter(c => c.id !== folderId));
    }
  };

  const handleDeleteItem = (folderId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCollectionsChange(
      collections.map(folder => {
        if (folder.id === folderId) {
          return {
            ...folder,
            items: folder.items.filter(item => item.id !== itemId)
          };
        }
        return folder;
      })
    );
  };

  const handleImportPostmanFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const imported = importPostmanCollection(content);
        if (imported) {
          onCollectionsChange([...collections, imported]);
          setOpenFolders(prev => ({ ...prev, [imported.id]: true }));
          alert(`Successfully imported "${imported.name}" with ${imported.items.length} requests!`);
        } else {
          alert('Failed to parse Postman collection format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflowY: 'auto' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Collections</h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {collections.reduce((acc, c) => acc + c.items.length, 0)} saved requests
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Postman Import */}
          <label className="btn-secondary" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            padding: '6px 10px',
            cursor: 'pointer'
          }}>
            <Upload size={13} />
            <span>Import Postman</span>
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportPostmanFile}
            />
          </label>

          {/* New Folder */}
          <button
            type="button"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '6px 10px' }}
            onClick={() => setShowAddFolder(true)}
          >
            <Plus size={13} />
            <span>Folder</span>
          </button>
        </div>
      </div>

      {/* Add Folder Inline Box */}
      {showAddFolder && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span className="form-label">New Collection Name</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, padding: '6px 10px' }}
              placeholder="e.g. Auth Service APIs"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              autoFocus
            />
            <button type="button" className="btn-primary" onClick={handleCreateFolder}>
              Create
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowAddFolder(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collections List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {collections.map(folder => {
          const isOpen = openFolders[folder.id];
          return (
            <div
              key={folder.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}
            >
              {/* Folder Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  cursor: 'pointer',
                  backgroundColor: isOpen ? 'var(--bg-surface-hover)' : 'transparent',
                  transition: 'background-color 0.15s ease'
                }}
                onClick={() => toggleFolder(folder.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isOpen ? <ChevronDown size={15} color="var(--text-muted)" /> : <ChevronRight size={15} color="var(--text-muted)" />}
                  {isOpen ? <FolderOpen size={17} color="var(--accent-primary)" /> : <Folder size={17} color="var(--text-secondary)" />}
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                    {folder.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                    ({folder.items.length})
                  </span>
                </div>

                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: '26px', height: '26px', color: 'var(--text-muted)' }}
                  onClick={e => handleDeleteFolder(folder.id, e)}
                  title="Delete Folder"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Items Inside Folder */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  {folder.items.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12px'
                    }}>
                      Folder is empty. Save requests here from the Request or Response view.
                    </div>
                  ) : (
                    folder.items.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer'
                        }}
                        className="kv-row"
                        onClick={() => onSelectRequest(item.request)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <span
                            className={`method-badge ${item.request.method}`}
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                          >
                            {item.request.method}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item.name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {item.request.url}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: '26px', height: '26px', color: 'var(--accent-primary)' }}
                            title="Load & Edit"
                            onClick={() => onSelectRequest(item.request)}
                          >
                            <Play size={13} fill="currentColor" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            style={{ width: '26px', height: '26px', color: 'var(--text-muted)' }}
                            title="Delete Request"
                            onClick={e => handleDeleteItem(folder.id, item.id, e)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
