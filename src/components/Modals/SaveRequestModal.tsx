import React, { useState } from 'react';
import type { CollectionFolder, HttpRequest, CollectionItem } from '../../types';
import { X, BookmarkPlus } from 'lucide-react';

interface SaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: HttpRequest;
  collections: CollectionFolder[];
  onSave: (folderId: string, item: CollectionItem) => void;
}

export const SaveRequestModal: React.FC<SaveRequestModalProps> = ({
  isOpen,
  onClose,
  request,
  collections,
  onSave
}) => {
  const [requestName, setRequestName] = useState(request.name || `${request.method} ${request.url.replace(/^https?:\/\/[^/]+/, '') || '/'}`);
  const [description, setDescription] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(collections[0]?.id || '');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!selectedFolderId) {
      alert('Please select or create a collection first.');
      return;
    }

    const item: CollectionItem = {
      id: 'item-' + crypto.randomUUID(),
      name: requestName.trim() || 'Saved Request',
      description: description.trim(),
      request: {
        ...request,
        id: 'req-' + crypto.randomUUID(),
        name: requestName.trim() || 'Saved Request'
      }
    };

    onSave(selectedFolderId, item);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookmarkPlus size={16} color="var(--accent-primary)" />
            <span className="modal-title">Save to Collection</span>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Request Name</label>
            <input
              type="text"
              className="form-input"
              value={requestName}
              onChange={e => setRequestName(e.target.value)}
              placeholder="e.g. Login Endpoint"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Collection Folder</label>
            <select
              className="form-input"
              value={selectedFolderId}
              onChange={e => setSelectedFolderId(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              {collections.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.items.length} items)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Testing authentication flow"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Save Request
          </button>
        </div>
      </div>
    </div>
  );
};
