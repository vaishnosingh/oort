import React, { useState, useEffect, useRef } from 'react';

interface RenameBucketModalProps {
  isOpen: boolean;
  currentDisplayName: string;
  onClose: () => void;
  onSubmit: (newName: string) => void;
}

export const RenameBucketModal: React.FC<RenameBucketModalProps> = ({
  isOpen,
  currentDisplayName,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentDisplayName);
      setTimeout(() => inputRef.current?.select(), 80);
    }
  }, [isOpen, currentDisplayName]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit(name.trim());
  };

  return (
    <div className="modal-backdrop show" id="modal-rename-bucket" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="18" height="18" fill="none" stroke="#38bdf8" strokeWidth="2" viewBox="0 0 24 24">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            Rename Bucket
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Current Bucket</label>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                color: 'var(--accent-primary)',
                padding: '8px 12px',
                background: 'rgba(56,189,248,0.07)',
                borderRadius: '8px',
                border: '1px solid rgba(56,189,248,0.2)',
              }}
              id="rename-bucket-current"
            >
              {currentDisplayName || '—'}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Bucket Name</label>
            <input
              type="text"
              id="rename-bucket-input"
              ref={inputRef}
              className="form-input mono-cell"
              placeholder="e.g. storage-volume-1"
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
              Must consist of lowercase letters, numbers, and hyphens. API endpoints will be updated automatically.
            </span>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit}>Rename Bucket</button>
        </div>
      </div>
    </div>
  );
};
