import React, { useState, useEffect, useRef } from 'react';

interface RenameFolderModalProps {
  isOpen: boolean;
  folderKey: string;
  onClose: () => void;
  onSubmit: (oldKey: string, newName: string) => void;
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  isOpen,
  folderKey,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const clean = folderKey.replace(/\/$/, '').split('/').pop() || '';
      setName(clean);
      setTimeout(() => inputRef.current?.select(), 80);
    }
  }, [isOpen, folderKey]);

  if (!isOpen) return null;

  const currentCleanName = folderKey.replace(/\/$/, '').split('/').pop() || folderKey;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(folderKey, name.trim());
  };

  return (
    <div className="modal-backdrop show" id="modal-rename-folder" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            Rename Folder
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Current Name</label>
            <input
              type="text"
              id="rename-folder-current"
              className="form-input mono-cell"
              readOnly
              style={{ opacity: 0.6 }}
              value={currentCleanName}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Folder Name</label>
            <input
              type="text"
              id="rename-folder-new"
              ref={inputRef}
              className="form-input"
              placeholder="Enter new name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              All objects inside will be moved to the new prefix. This may take a moment for large folders.
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Rename Folder</button>
        </div>
      </div>
    </div>
  );
};
